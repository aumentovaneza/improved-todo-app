<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\ProductionShowcaseSeeder;
use App\Models\User;

class SetupShowcaseUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:setup-showcase {--force : Force creation even if user already exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a showcase user with comprehensive data to demonstrate all app features';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up showcase user for production demo...');

        // Check if showcase user already exists
        $existingUser = User::where('email', 'showcase@todoapp.com')->first();

        if ($existingUser && !$this->option('force')) {
            $this->warn('Showcase user already exists!');
            $this->line('Email: showcase@todoapp.com');
            $this->line('Use --force option to recreate the user and data.');
            return 1;
        }

        if ($existingUser && $this->option('force')) {
            $this->warn('Removing existing showcase user and related data...');

            // Delete related data first
            $existingUser->tasks()->each(function ($task) {
                $task->subtasks()->delete();
                $task->reminders()->delete();
                $task->tags()->detach();
                $task->delete();
            });

            $existingUser->reminders()->delete();
            $existingUser->activityLogs()->delete();
            $existingUser->delete();

            $this->info('Existing showcase user removed.');
        }

        // Run the seeder
        $this->info('Creating showcase user with comprehensive demo data...');

        $seeder = new ProductionShowcaseSeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->newLine();
        $this->info('🎉 Showcase setup completed successfully!');
        $this->newLine();
        $this->line('This user has been created with:');
        $this->line('• Diverse task categories (Work, Personal, Health, Learning, etc.)');
        $this->line('• Tasks with different priorities and statuses');
        $this->line('• Overdue, today, and future tasks');
        $this->line('• Recurring tasks (daily, weekly, monthly)');
        $this->line('• Tasks with subtasks and reminders');
        $this->line('• Tasks tagged with various labels');
        $this->line('• Completed and in-progress tasks');
        $this->line('• Time-specific and all-day tasks');
        $this->newLine();

        return 0;
    }
}
