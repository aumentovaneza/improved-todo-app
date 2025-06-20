<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class TestRecurringReset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:test-recurring-reset';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the recurring task reset functionality by creating and resetting a sample task';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing recurring task reset functionality...');

        // Get the first user (or create one if none exists)
        $user = User::first();
        if (!$user) {
            $this->error('No users found in the database. Please create a user first.');
            return 1;
        }

        $this->info("Using user: {$user->name} ({$user->email})");

        // Create a sample recurring task
        $task = Task::create([
            'user_id' => $user->id,
            'title' => 'Test Daily Recurring Task',
            'description' => 'This is a test recurring task that should reset daily',
            'priority' => 'medium',
            'status' => 'pending',
            'due_date' => Carbon::yesterday(), // Set to yesterday so it can be reset today
            'is_recurring' => true,
            'recurrence_type' => 'daily',
            'recurring_until' => Carbon::today()->addMonth(), // Valid for a month
            'position' => 1,
        ]);

        $this->info("Created recurring task: {$task->title}");

        // Mark it as completed yesterday
        $task->update([
            'status' => 'completed',
            'completed_at' => Carbon::yesterday()->setTime(14, 30), // Completed at 2:30 PM yesterday
        ]);

        $this->info("Marked task as completed yesterday at 2:30 PM");

        // Show current task state
        $this->info("Current task state:");
        $this->line("  Status: {$task->status}");
        $this->line("  Due Date: {$task->due_date->format('Y-m-d')}");
        $this->line("  Completed At: {$task->completed_at->format('Y-m-d H:i:s')}");
        $this->line("  Is Recurring: " . ($task->is_recurring ? 'Yes' : 'No'));
        $this->line("  Recurrence Type: {$task->recurrence_type}");

        // Now run the reset command
        $this->info("\nRunning recurring task reset...");
        $this->call('tasks:reset-recurring');

        // Refresh the task from database
        $task->refresh();

        // Show updated task state
        $this->info("\nUpdated task state:");
        $this->line("  Status: {$task->status}");
        $this->line("  Due Date: {$task->due_date->format('Y-m-d')}");
        $this->line("  Completed At: " . ($task->completed_at ? $task->completed_at->format('Y-m-d H:i:s') : 'null'));

        if ($task->status === 'pending' && $task->completed_at === null) {
            $this->info("\n✅ SUCCESS: Task was successfully reset to pending status!");
        } else {
            $this->error("\n❌ FAILED: Task was not reset properly.");
        }

        // Ask if user wants to clean up the test task
        if ($this->confirm('Do you want to delete the test task?', true)) {
            $task->delete();
            $this->info("Test task deleted.");
        }

        return 0;
    }
}
