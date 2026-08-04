<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

/**
 * Custom notification channel that delivers Web Push (VAPID) messages to a
 * user's registered browser subscriptions.
 *
 * Subscriptions live in the shared, provider-agnostic `push_tokens` table
 * (provider = 'webpush'): the browser's PushSubscription JSON is stored in the
 * `meta` column and a SHA-256 of the endpoint in `token`. A notification opts in
 * by implementing `toWebPush($notifiable): array` returning at least
 * `['title', 'body']` (plus optional `url`, `tag`, `icon`) — the shape the
 * service worker (`public/push-sw.js`) expects.
 */
class WebPushChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWebPush')) {
            return;
        }

        $tokens = $this->subscriptionsFor($notifiable);
        if ($tokens->isEmpty()) {
            return;
        }

        $config = config('services.vapid');
        if (empty($config['public_key']) || empty($config['private_key'])) {
            Log::warning('[webpush] VAPID keys are not configured; skipping web push. Run `php artisan webpush:vapid`.');

            return;
        }

        $payload = json_encode($notification->toWebPush($notifiable));

        $webPush = $this->makeWebPush([
            'VAPID' => [
                'subject' => $config['subject'],
                'publicKey' => $config['public_key'],
                'privateKey' => $config['private_key'],
            ],
        ]);

        // Map each endpoint back to its PushToken row so dead ones can be pruned.
        $byEndpoint = [];

        foreach ($tokens as $token) {
            $meta = $token->meta ?? [];
            $endpoint = $meta['endpoint'] ?? null;
            $keys = $meta['keys'] ?? [];

            if (! $endpoint || empty($keys['p256dh']) || empty($keys['auth'])) {
                continue;
            }

            $byEndpoint[$endpoint] = $token;

            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $endpoint,
                    'keys' => [
                        'p256dh' => $keys['p256dh'],
                        'auth' => $keys['auth'],
                    ],
                ]),
                $payload,
            );
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                continue;
            }

            $endpoint = $report->getEndpoint();

            // 404/410 mean the browser dropped the subscription — prune it so the
            // store self-heals and we stop pushing to a dead endpoint.
            if ($report->isSubscriptionExpired() && isset($byEndpoint[$endpoint])) {
                $byEndpoint[$endpoint]->delete();

                continue;
            }

            Log::warning('[webpush] delivery failed', [
                'endpoint' => $endpoint,
                'reason' => $report->getReason(),
            ]);
        }
    }

    /**
     * Build the WebPush client. Extracted so tests can substitute a double.
     *
     * @param  array<string, mixed>  $auth
     */
    protected function makeWebPush(array $auth): WebPush
    {
        return new WebPush($auth);
    }

    /**
     * Resolve the notifiable's web-push subscriptions as a collection of
     * PushToken models.
     */
    protected function subscriptionsFor(object $notifiable): Collection
    {
        if (method_exists($notifiable, 'routeNotificationForWebPush')) {
            return collect($notifiable->routeNotificationForWebPush());
        }

        if (method_exists($notifiable, 'pushTokens')) {
            return $notifiable->pushTokens()->where('provider', 'webpush')->get();
        }

        return collect();
    }
}
