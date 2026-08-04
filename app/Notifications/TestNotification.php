<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestNotification extends Notification
{
    public string $title;

    public string $body;

    public function __construct(?string $message = null)
    {
        $this->title = 'Test notification';
        $this->body = $message ?: 'This is a test notification sent from the Wevie admin Tools page.';
    }

    /**
     * Delivery channels: email + database (so it appears in the in-app bell).
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title.' - '.config('app.name'))
            ->greeting('Hello '.($notifiable->name ?? '').'!')
            ->line($this->body)
            ->line('No action is required — this is only a test.');
    }

    /**
     * Data stored for the database channel / in-app bell.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'test',
            'title' => $this->title,
            'body' => $this->body,
        ];
    }
}
