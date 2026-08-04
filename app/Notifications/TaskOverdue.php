<?php

namespace App\Notifications;

use App\Models\Task;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Apn\ApnChannel;
use NotificationChannels\Apn\ApnMessage;

class TaskOverdue extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task
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
        return (new MailMessage)
            ->subject("Task overdue: {$this->task->title}")
            ->view('emails.task-overdue', [
                'user' => $notifiable,
                'task' => $this->task,
                'url' => url('/tasks'),
            ]);
    }

    /**
     * Get the APNs (native push) representation of the notification. The custom
     * `task_id` payload lets the iOS shell deep-link to the task on tap.
     */
    public function toApn(object $notifiable): ApnMessage
    {
        return ApnMessage::create()
            ->title('Task Overdue')
            ->body("Your task '{$this->task->title}' is now overdue.")
            ->custom('task_id', $this->task->id);
    }

    /**
     * The web-push (browser) representation. `url` deep-links to the task; `tag`
     * collapses repeated pushes for the same task.
     *
     * @return array<string, mixed>
     */
    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'Task Overdue',
            'body' => "Your task '{$this->task->title}' is now overdue.",
            'url' => url('/tasks?task='.$this->task->id),
            'tag' => 'task-'.$this->task->id,
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
        return [
            'type' => 'task_overdue',
            'title' => 'Task Overdue',
            'message' => "Your task '{$this->task->title}' is now overdue.",
            'task_id' => $this->task->id,
            'due_date' => $this->task->due_date,
            'priority' => $this->task->priority,
        ];
    }
}
