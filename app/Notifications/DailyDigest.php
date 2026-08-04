<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyDigest extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $digestData  The payload built by
     *                                            NotificationService::sendDailyDigest (today_tasks / overdue_tasks /
     *                                            upcoming_tasks + counts).
     */
    public function __construct(
        public array $digestData
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * The digest is an email-first surface, gated on the daily-digest opt-in
     * (which itself implies the user wants email). It also drops a bell entry.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (($notifiable->email_notifications_enabled ?? true)
            && ($notifiable->daily_digest_enabled ?? true)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Wevie daily digest')
            ->view('emails.daily-digest', [
                'user' => $notifiable,
                'digest' => $this->digestData,
                'url' => url('/tasks'),
            ]);
    }

    /**
     * The bell payload. Counts only — the full task lists live in the email.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'daily_digest',
            'title' => 'Daily Task Digest',
            'message' => 'Your daily task digest is ready.',
            'today_count' => $this->digestData['today_tasks']->count(),
            'overdue_count' => $this->digestData['overdue_tasks']->count(),
            'upcoming_count' => $this->digestData['upcoming_tasks']->count(),
        ];
    }
}
