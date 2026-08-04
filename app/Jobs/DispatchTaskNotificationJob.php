<?php

namespace App\Jobs;

use App\Models\Task;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchTaskNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  string  $kind  'due' or 'overdue'.
     */
    public function __construct(
        public int $taskId,
        public string $kind
    ) {}

    public function handle(NotificationService $service): void
    {
        $task = Task::with('user')->find($this->taskId);

        if (! $task) {
            return;
        }

        // Re-check the idempotency marker inside the job: the task may have been
        // notified between enqueue and execution.
        if ($this->kind === 'overdue') {
            if ($task->overdue_notified_at !== null) {
                return;
            }

            $service->sendTaskOverdueNotification($task);

            return;
        }

        if ($task->due_notified_at !== null) {
            return;
        }

        $service->sendTaskDueReminder($task);
    }
}
