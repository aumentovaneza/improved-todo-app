<?php

use App\Models\PushToken;
use App\Models\Task;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use App\Notifications\TaskDueReminder;
use App\Notifications\TestNotification;
use App\Services\NotificationService;
use GuzzleHttp\Psr7\Request as GuzzleRequest;
use GuzzleHttp\Psr7\Response as GuzzleResponse;
use Illuminate\Support\Facades\Notification;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\WebPush;

/**
 * Web Push channel: via() must gate WebPushChannel on push_notifications_enabled
 * AND the presence of a registered webpush subscription; the channel must prune
 * a subscription the push service reports as expired (404/410).
 */
function makeWebPushTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Ship the release',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addDays(2),
    ]);
}

function makeWebPushToken(User $user, string $endpoint = 'https://push.example.com/abc'): PushToken
{
    return PushToken::factory()->for($user)->create([
        'provider' => 'webpush',
        'platform' => 'web',
        'token' => hash('sha256', $endpoint),
        'meta' => [
            'endpoint' => $endpoint,
            'keys' => ['p256dh' => 'test-p256dh', 'auth' => 'test-auth'],
        ],
    ]);
}

it('includes the web-push channel for the test notification when a subscription exists', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    makeWebPushToken($user);

    $user->notify(new TestNotification);

    Notification::assertSentTo(
        $user,
        TestNotification::class,
        fn ($notification, $channels) => in_array(WebPushChannel::class, $channels, true)
    );
});

it('excludes the web-push channel from the test notification when no subscription exists', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);

    $user->notify(new TestNotification);

    Notification::assertSentTo(
        $user,
        TestNotification::class,
        fn ($notification, $channels) => ! in_array(WebPushChannel::class, $channels, true)
    );
});

it('includes the web-push channel for reminders when push is enabled and a subscription exists', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    makeWebPushToken($user);
    $task = makeWebPushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => in_array(WebPushChannel::class, $channels, true)
    );
});

it('excludes the web-push channel when push notifications are disabled', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => false]);
    makeWebPushToken($user);
    $task = makeWebPushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => ! in_array(WebPushChannel::class, $channels, true)
    );
});

it('prunes a web-push subscription when the push service reports it expired', function () {
    config()->set('services.vapid', [
        'public_key' => 'test-public',
        'private_key' => 'test-private',
        'subject' => 'mailto:test@example.com',
    ]);

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    $endpoint = 'https://push.example.com/gone';
    $token = makeWebPushToken($user, $endpoint);

    // A 410 Gone report — the push service dropped this subscription.
    $report = new MessageSentReport(
        new GuzzleRequest('POST', $endpoint),
        new GuzzleResponse(410),
        false,
        'Gone'
    );

    $webPush = Mockery::mock(WebPush::class);
    $webPush->shouldReceive('queueNotification')->once();
    // flush() is declared to return a Generator, so yield the report.
    $webPush->shouldReceive('flush')->once()->andReturnUsing(function () use ($report) {
        yield $report;
    });

    $channel = new class($webPush) extends WebPushChannel
    {
        public function __construct(private WebPush $stub) {}

        protected function makeWebPush(array $auth): WebPush
        {
            return $this->stub;
        }
    };

    $channel->send($user, new TestNotification);

    expect(PushToken::find($token->id))->toBeNull();
});
