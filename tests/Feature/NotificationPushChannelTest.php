<?php

use App\Models\PushToken;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskDueReminder;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Notification;
use NotificationChannels\Apn\ApnChannel;

/**
 * Phase 3 native push: via() must gate the APNs channel on
 * push_notifications_enabled + reminder_notifications_enabled AND the presence
 * of an active apns device token.
 */
function makePushTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Ship the release',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addDays(2),
    ]);
}

it('includes the apn channel when push is enabled and an apns token exists', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    PushToken::factory()->for($user)->create(['provider' => 'apns']);
    $task = makePushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => in_array(ApnChannel::class, $channels, true)
    );
});

it('excludes the apn channel when the user has no apns token', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    $task = makePushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => ! in_array(ApnChannel::class, $channels, true)
    );
});

it('excludes the apn channel when push notifications are disabled', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => false]);
    PushToken::factory()->for($user)->create(['provider' => 'apns']);
    $task = makePushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => ! in_array(ApnChannel::class, $channels, true)
    );
});

it('excludes the apn channel when only a non-apns (fcm) token exists', function () {
    Notification::fake();

    $user = User::factory()->create(['push_notifications_enabled' => true]);
    PushToken::factory()->for($user)->create(['provider' => 'fcm', 'platform' => 'android']);
    $task = makePushTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => ! in_array(ApnChannel::class, $channels, true)
    );
});
