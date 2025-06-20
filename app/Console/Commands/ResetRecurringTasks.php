<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class ResetRecurringTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:reset-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset completed recurring tasks to pending status for the next occurrence';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting recurring tasks reset...');

        $resetCount = 0;

        // Get all users to handle timezone-specific resets
        $users = User::all();

        foreach ($users as $user) {
            // Get user's current time in their timezone
            $userNow = $user->nowInUserTimezone();
            $userToday = $userNow->startOfDay();

            // Find completed recurring tasks that should be reset
            $completedRecurringTasks = Task::where('user_id', $user->id)
                ->where('is_recurring', true)
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->whereNotNull('recurring_until')
                ->whereNotNull('recurrence_type')
                ->where('recurring_until', '>=', $userToday) // Only tasks that haven't expired
                ->get();

            foreach ($completedRecurringTasks as $task) {
                if ($this->shouldResetTask($task, $userToday)) {
                    $this->resetTask($task, $userToday);
                    $resetCount++;

                    $this->line("Reset task: {$task->title} for user: {$user->name}");
                }
            }
        }

        $this->info("Completed! Reset {$resetCount} recurring tasks.");

        return 0;
    }

    /**
     * Determine if a task should be reset based on its recurrence pattern
     */
    private function shouldResetTask(Task $task, Carbon $userToday): bool
    {
        if (!$task->completed_at) {
            return false;
        }

        // Get the completion date in user's timezone
        $completedDate = $task->completed_at->startOfDay();

        // Calculate the next occurrence date based on recurrence type
        $nextOccurrenceDate = $this->getNextOccurrenceDate($task, $completedDate);

        if (!$nextOccurrenceDate) {
            return false;
        }

        // Check if today matches or is past the next occurrence date
        return $userToday->greaterThanOrEqualTo($nextOccurrenceDate);
    }

    /**
     * Reset a task to pending status and update its due date
     */
    private function resetTask(Task $task, Carbon $userToday): void
    {
        // Calculate the new due date based on the recurrence pattern
        $newDueDate = $this->getNextOccurrenceDate($task, $task->completed_at->startOfDay());

        // If the calculated date is in the past, use today
        if ($newDueDate && $newDueDate->lessThan($userToday)) {
            $newDueDate = $userToday->copy();
        }

        // Update the task
        $task->update([
            'status' => 'pending',
            'completed_at' => null,
            'due_date' => $newDueDate,
        ]);

        // Reset all subtasks to incomplete
        $task->subtasks()->update([
            'is_completed' => false,
            'completed_at' => null,
        ]);
    }

    /**
     * Get the next occurrence date based on recurrence type
     */
    private function getNextOccurrenceDate(Task $task, Carbon $fromDate): ?Carbon
    {
        switch ($task->recurrence_type) {
            case 'daily':
                return $fromDate->copy()->addDay();
            case 'weekly':
                return $fromDate->copy()->addWeek();
            case 'monthly':
                return $fromDate->copy()->addMonth();
            case 'yearly':
                return $fromDate->copy()->addYear();
            default:
                return null;
        }
    }
}
