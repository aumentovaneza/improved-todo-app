<?php

namespace App\Jobs;

use App\Models\CalendarEventReminderDelivery;
use App\Notifications\CalendarEventReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchCalendarEventReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $deliveryId) {}

    public function handle(): void
    {
        $delivery = CalendarEventReminderDelivery::with('reminder.event.user')->find($this->deliveryId);
        if (! $delivery || $delivery->sent_at) {
            return;
        }

        $delivery->reminder->event->user->notify(new CalendarEventReminderNotification($delivery));
        $delivery->update(['sent_at' => now()]);
    }
}
