<?php

namespace App\Notifications;

use App\Models\CalendarEventReminderDelivery;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Apn\ApnChannel;
use NotificationChannels\Apn\ApnMessage;

class CalendarEventReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public CalendarEventReminderDelivery $delivery) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (! ($notifiable->push_notifications_enabled ?? true)
            || ! ($notifiable->reminder_notifications_enabled ?? true)) {
            return $channels;
        }
        if ($notifiable->pushTokens()->where('provider', 'apns')->exists()) {
            $channels[] = ApnChannel::class;
        }
        if ($notifiable->pushTokens()->where('provider', 'webpush')->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    public function toApn(object $notifiable): ApnMessage
    {
        $event = $this->delivery->reminder->event;

        return ApnMessage::create()
            ->title('Coming up')
            ->body($event->title)
            ->custom('calendar_event_id', $event->id)
            ->custom('occurrence_key', $this->delivery->occurrence_key);
    }

    public function toWebPush(object $notifiable): array
    {
        $event = $this->delivery->reminder->event;

        return [
            'title' => 'Coming up',
            'body' => $event->title,
            'url' => route('calendar.index', ['date' => substr($this->delivery->occurrence_key, 0, 10)]),
            'tag' => 'calendar-event-reminder-'.$this->delivery->id,
        ];
    }

    public function toArray(object $notifiable): array
    {
        $event = $this->delivery->reminder->event;

        return [
            'type' => 'calendar_event_reminder',
            'title' => 'Coming up',
            'message' => $event->title,
            'calendar_event_id' => $event->id,
            'occurrence_key' => $this->delivery->occurrence_key,
        ];
    }
}
