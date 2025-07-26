<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleCalendarService;
use App\Models\User;

class GoogleCalendarSync extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:google-calendar-sync {--user-id= : Sync for specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Google Calendar with tasks for all users or specific user';

    public function __construct(
        private GoogleCalendarService $googleCalendarService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');

        if ($userId) {
            // Sync for specific user
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found.");
                return 1;
            }

            $this->syncForUser($user);
        } else {
            // Sync for all users with Google Calendar connected
            $users = User::whereNotNull('google_token')
                ->whereNotNull('google_token_expires')
                ->where('google_token_expires', '>', now())
                ->get();

            $this->info("Found {$users->count()} users with Google Calendar connected.");

            foreach ($users as $user) {
                $this->syncForUser($user);
            }
        }

        return 0;
    }

    /**
     * Sync Google Calendar for a specific user
     */
    private function syncForUser(User $user): void
    {
        $this->info("Syncing Google Calendar for user: {$user->name} ({$user->email})");

        $result = $this->googleCalendarService->syncFromCalendar($user);

        if ($result['success']) {
            $this->info("✓ {$result['message']}");
        } else {
            $this->error("✗ Failed to sync for {$user->name}: {$result['message']}");
        }
    }
}
