<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google\Client;
use Google\Service\Calendar;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;


class GoogleCalendarSync extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:google-calendar-sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Google Calendar with tasks';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken(decrypt(Auth::user()->google_token));
        
        $service = new Calendar($client);
        
        $events = $service->events->listEvents('primary', [
            'timeMin' => now()->toRfc3339String(),
            'singleEvents' => true,
            'orderBy' => 'startTime',
        ]);
        
        foreach ($events->getItems() as $event) {
            Task::updateOrCreate(
                ['google_event_id' => $event->getId()],
                [
                    'user_id' => Auth::user()->id,
                    'title' => $event->getSummary(),
                    'description' => $event->getDescription(),
                    'start_time' => $event->getStart()->getDateTime(),
                    'end_time' => $event->getEnd()->getDateTime(),
                    'is_from_google' => true,
                ]
            );
        }
    }
}
