<?php

namespace App\Notifications;

use App\Models\Reminder;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Apn\ApnChannel;
use NotificationChannels\Apn\ApnMessage;

class CustomReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Reminder $reminder
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * The in-app bell (database) always fires. Email is appended when the user
     * opts into both email notifications and reminder notifications. Native push
     * (APNs) is appended when the user opts into push + reminder notifications
     * and has at least one registered APNs device token.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (($notifiable->email_notifications_enabled ?? true)
            && ($notifiable->reminder_notifications_enabled ?? true)) {
            $channels[] = 'mail';
        }

        if (($notifiable->push_notifications_enabled ?? true)
            && ($notifiable->reminder_notifications_enabled ?? true)
            && $this->hasApnsToken($notifiable)) {
            $channels[] = ApnChannel::class;
        }

        if (($notifiable->push_notifications_enabled ?? true)
            && ($notifiable->reminder_notifications_enabled ?? true)
            && $this->hasWebPushToken($notifiable)) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    /**
     * Whether the notifiable has a registered APNs device token, favouring an
     * already-loaded relation to avoid a query per notification.
     */
    protected function hasApnsToken(object $notifiable): bool
    {
        if (method_exists($notifiable, 'relationLoaded') && $notifiable->relationLoaded('pushTokens')) {
            return $notifiable->pushTokens
                ->where('provider', 'apns')
                ->isNotEmpty();
        }

        return $notifiable->pushTokens()->where('provider', 'apns')->exists();
    }

    /**
     * Whether the notifiable has a registered web-push subscription, favouring an
     * already-loaded relation to avoid a query per notification.
     */
    protected function hasWebPushToken(object $notifiable): bool
    {
        if (method_exists($notifiable, 'relationLoaded') && $notifiable->relationLoaded('pushTokens')) {
            return $notifiable->pushTokens
                ->where('provider', 'webpush')
                ->isNotEmpty();
        }

        return $notifiable->pushTokens()->where('provider', 'webpush')->exists();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $task = $this->reminder->task;
        $message = $this->reminder->message ?: "Reminder for task '{$task->title}'";

        return (new MailMessage)
            ->subject("Reminder: {$task->title}")
            ->greeting("Hi {$notifiable->name},")
            ->line($message)
            ->action('Open Wevie', url('/tasks'))
            ->line('You are receiving this because you set a reminder in Wevie.');
    }

    /**
     * Get the APNs (native push) representation of the notification. The custom
     * task_id / reminder_id payload lets the iOS shell deep-link on tap.
     */
    public function toApn(object $notifiable): ApnMessage
    {
        $task = $this->reminder->task;
        $body = $this->reminder->message ?: "Reminder for task '{$task->title}'";

        return ApnMessage::create()
            ->title('Reminder')
            ->body($body)
            ->custom('task_id', $this->reminder->task_id)
            ->custom('reminder_id', $this->reminder->id);
    }

    /**
     * The web-push (browser) representation. `url` deep-links to the task; `tag`
     * collapses repeated pushes for the same reminder.
     *
     * @return array<string, mixed>
     */
    public function toWebPush(object $notifiable): array
    {
        $task = $this->reminder->task;

        return [
            'title' => 'Reminder',
            'body' => $this->reminder->message ?: "Reminder for task '{$task->title}'",
            'url' => url('/tasks?task='.$this->reminder->task_id),
            'tag' => 'reminder-'.$this->reminder->id,
        ];
    }

    /**
     * The stable bell payload. The frontend depends on `type`, `title`,
     * `message`, and `task_id` — do not rename these keys.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $task = $this->reminder->task;

        return [
            'type' => $this->reminder->type,
            'title' => 'Reminder',
            'message' => $this->reminder->message ?: "Reminder for task '{$task->title}'",
            'task_id' => $this->reminder->task_id,
            'reminder_id' => $this->reminder->id,
            'remind_at' => $this->reminder->remind_at,
        ];
    }
}
