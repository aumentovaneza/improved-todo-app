<?php

namespace App\Console\Commands;

use App\Jobs\DispatchTaskNotificationJob;
use App\Jobs\ProcessDueReminderJob;
use App\Models\Task;
use App\Services\ReminderService;
use Illuminate\Console\Command;

class DispatchNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:dispatch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch due reminders and due-soon/overdue task notifications';

    /**
     * How far ahead a task counts as "due soon".
     */
    private const DUE_SOON_MINUTES = 30;

    /**
     * Execute the console command.
     *
     * All queries use portable Carbon comparisons (no DB-specific date funcs)
     * and lean on the idempotency markers (is_sent / due_notified_at /
     * overdue_notified_at) so repeated runs never double-dispatch.
     */
    public function handle(ReminderService $reminderService): int
    {
        $now = now();
        $reminderCount = 0;
        $dueCount = 0;
        $overdueCount = 0;

        // 1. Custom reminders whose time has arrived (already filtered by is_sent).
        foreach ($reminderService->getRemindersDueForSending() as $reminder) {
            ProcessDueReminderJob::dispatch($reminder->id);
            $reminderCount++;
        }

        // 2. Tasks due within the next window that have not been notified yet.
        Task::whereNotNull('due_date')
            ->where('due_date', '<=', $now->copy()->addMinutes(self::DUE_SOON_MINUTES))
            ->where('due_date', '>=', $now)
            ->whereNull('due_notified_at')
            ->where('status', '!=', 'completed')
            ->select('id')
            ->chunkById(200, function ($tasks) use (&$dueCount) {
                foreach ($tasks as $task) {
                    DispatchTaskNotificationJob::dispatch($task->id, 'due');
                    $dueCount++;
                }
            });

        // 3. Tasks past their due date that have not had an overdue notice.
        Task::whereNotNull('due_date')
            ->where('due_date', '<', $now)
            ->whereNull('overdue_notified_at')
            ->where('status', '!=', 'completed')
            ->select('id')
            ->chunkById(200, function ($tasks) use (&$overdueCount) {
                foreach ($tasks as $task) {
                    DispatchTaskNotificationJob::dispatch($task->id, 'overdue');
                    $overdueCount++;
                }
            });

        $this->info("Dispatched {$reminderCount} reminder(s), {$dueCount} due-soon and {$overdueCount} overdue task notification(s).");

        return self::SUCCESS;
    }
}
