<?php

namespace App\Notifications;

use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestNotification extends Notification
{
    public string $title;

    public string $message;

    public function __construct(?string $message = null)
    {
        $this->title = 'Test notification';
        $this->message = $message ?: 'This is a test notification sent from the Wevie admin Tools page.';
    }

    /**
     * Delivery channels for the test notification.
     *
     * The in-app bell (database) fires first and unconditionally so a hiccup on
     * another channel can never suppress it. Web push is appended when the user
     * has opted into push and registered a browser subscription — this is what
     * makes the admin "Send test notification" button deliver a real device
     * notification. Mail is last (and, in local/dev, `MAIL_MAILER=log` means it
     * only lands in the log).
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (($notifiable->push_notifications_enabled ?? true)
            && $this->hasWebPushToken($notifiable)) {
            $channels[] = WebPushChannel::class;
        }

        $channels[] = 'mail';

        return $channels;
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

        return method_exists($notifiable, 'pushTokens')
            && $notifiable->pushTokens()->where('provider', 'webpush')->exists();
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title.' - '.config('app.name'))
            ->greeting('Hello '.($notifiable->name ?? '').'!')
            ->line($this->message)
            ->line('No action is required — this is only a test.');
    }

    /**
     * The web-push (browser/device) representation. The service worker reads
     * `title`, `body`, and `url`; `tag` collapses repeated test pushes.
     *
     * @return array<string, mixed>
     */
    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->message,
            'url' => url('/'),
            'tag' => 'test-notification',
        ];
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
            'message' => $this->message,
        ];
    }
}
