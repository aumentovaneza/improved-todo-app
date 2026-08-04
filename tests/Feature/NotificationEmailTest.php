<?php

use App\Jobs\SendDailyDigestJob;
use App\Models\Task;
use App\Models\User;
use App\Notifications\DailyDigest;
use App\Notifications\TaskDueReminder;
use App\Notifications\TaskOverdue;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Notification;

/**
 * Phase 2 email: the task/reminder notifications append the `mail` channel when
 * the user opts in, and the DailyDigest notification is only sent when the user
 * has tasks + the digest enabled.
 */
function emailTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Send the invoice',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addDay(),
    ]);
}

it('includes the mail channel for a due reminder when email + reminder emails are enabled', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => true,
        'reminder_notifications_enabled' => true,
    ]);
    $task = emailTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );
});

it('excludes the mail channel for a due reminder when email notifications are disabled', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => false,
        'reminder_notifications_enabled' => true,
    ]);
    $task = emailTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => ! in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );
});

it('excludes the mail channel for an overdue task when reminder emails are disabled', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => true,
        'reminder_notifications_enabled' => false,
    ]);
    $task = emailTask($user);

    app(NotificationService::class)->sendTaskOverdueNotification($task);

    Notification::assertSentTo(
        $user,
        TaskOverdue::class,
        fn ($notification, $channels) => ! in_array('mail', $channels, true)
    );
});

it('includes the mail channel for an overdue task when opted in', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => true,
        'reminder_notifications_enabled' => true,
    ]);
    $task = emailTask($user);

    app(NotificationService::class)->sendTaskOverdueNotification($task);

    Notification::assertSentTo(
        $user,
        TaskOverdue::class,
        fn ($notification, $channels) => in_array('mail', $channels, true)
    );
});

it('sends a daily digest with the mail channel to a user who has tasks and the digest enabled', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => true,
        'daily_digest_enabled' => true,
    ]);
    emailTask($user); // upcoming task within the next 3 days

    app(NotificationService::class)->sendDailyDigest($user);

    Notification::assertSentTo(
        $user,
        DailyDigest::class,
        fn ($notification, $channels) => in_array('mail', $channels, true)
    );
});

it('does not send a daily digest when the user has no tasks to report', function () {
    Notification::fake();

    $user = User::factory()->create([
        'daily_digest_enabled' => true,
    ]);

    app(NotificationService::class)->sendDailyDigest($user);

    Notification::assertNothingSentTo($user);
});

it('excludes the mail channel from the digest when the digest is disabled', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email_notifications_enabled' => true,
        'daily_digest_enabled' => false,
    ]);
    emailTask($user);

    app(NotificationService::class)->sendDailyDigest($user);

    Notification::assertSentTo(
        $user,
        DailyDigest::class,
        fn ($notification, $channels) => ! in_array('mail', $channels, true)
    );
});

it('does not deliver a digest job for a user who disabled the daily digest', function () {
    Notification::fake();

    $user = User::factory()->create([
        'daily_digest_enabled' => false,
    ]);
    emailTask($user);

    (new SendDailyDigestJob($user->id))->handle(app(NotificationService::class));

    Notification::assertNothingSentTo($user);
});
