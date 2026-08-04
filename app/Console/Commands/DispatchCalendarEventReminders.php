<?php

namespace App\Console\Commands;

use App\Jobs\DispatchCalendarEventReminderJob;
use App\Models\CalendarEventReminder;
use App\Models\CalendarEventReminderDelivery;
use App\Services\CalendarEventService;
use Illuminate\Console\Command;

class DispatchCalendarEventReminders extends Command
{
    protected $signature = 'calendar:dispatch-reminders';

    protected $description = 'Dispatch due reminders for native calendar events';

    public function handle(CalendarEventService $events): int
    {
        $count = 0;
        CalendarEventReminder::query()
            ->whereNotNull('next_remind_at')
            ->where('next_remind_at', '<=', now())
            ->with('event.calendar', 'event.exceptions', 'event.reminders')
            ->chunkById(100, function ($reminders) use ($events, &$count) {
                foreach ($reminders as $reminder) {
                    if (! $reminder->next_occurrence_key) {
                        $events->refreshReminderSchedule($reminder->event, now());

                        continue;
                    }

                    $delivery = CalendarEventReminderDelivery::firstOrCreate(
                        [
                            'calendar_event_reminder_id' => $reminder->id,
                            'occurrence_key' => $reminder->next_occurrence_key,
                        ],
                        ['scheduled_for' => $reminder->next_remind_at]
                    );

                    if ($delivery->wasRecentlyCreated) {
                        DispatchCalendarEventReminderJob::dispatch($delivery->id);
                        $count++;
                    }
                    $events->refreshReminderSchedule($reminder->event, now());
                }
            });

        $this->info("Dispatched {$count} calendar reminder(s).");

        return self::SUCCESS;
    }
}
