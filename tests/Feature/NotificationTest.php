<?php

use App\Models\Reminder;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskDueReminder;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Notification;

/**
 * Phase 1 in-app notifications: the NotificationService must write a real
 * `notifications` DB row through the database channel and set the task's
 * idempotency markers. The bell endpoints expose that data to the frontend.
 */
function makeReminderTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Ship the release',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addDays(2),
    ]);
}

it('writes a database notification and stamps due_notified_at for a due task', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    $notification = $user->fresh()->notifications()->first();

    expect($notification)->not->toBeNull();
    expect($notification->type)->toBe(TaskDueReminder::class);
    expect($notification->data['type'])->toBe('task_due_reminder');
    expect($notification->data['title'])->toBe('Task Due Reminder');
    expect($notification->data['task_id'])->toBe($task->id);
    expect($notification->data['message'])->toContain('is due soon');

    expect($task->fresh()->due_notified_at)->not->toBeNull();
});

it('stamps overdue_notified_at when sending an overdue notification', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskOverdueNotification($task);

    $notification = $user->fresh()->notifications()->first();

    expect($notification->data['type'])->toBe('task_overdue');
    expect($task->fresh()->overdue_notified_at)->not->toBeNull();
});

it('writes a database notification and marks the reminder sent for a custom reminder', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    $reminder = Reminder::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'remind_at' => now()->addHour(),
        'type' => 'notification',
        'message' => 'Custom nudge',
        'is_sent' => false,
    ]);

    app(NotificationService::class)->sendCustomReminder($reminder);

    $notification = $user->fresh()->notifications()->first();

    expect($notification->data['type'])->toBe('notification');
    expect($notification->data['title'])->toBe('Reminder');
    expect($notification->data['message'])->toBe('Custom nudge');
    expect($notification->data['task_id'])->toBe($task->id);
    expect($notification->data['reminder_id'])->toBe($reminder->id);

    expect($reminder->fresh()->is_sent)->toBeTrue();
});

it('routes the queued notification to the database channel via Notification::fake', function () {
    Notification::fake();

    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    Notification::assertSentTo(
        $user,
        TaskDueReminder::class,
        fn ($notification, $channels) => in_array('database', $channels, true)
    );
});

it('feed endpoint returns the latest notifications and the unread count', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    $response = $this->actingAs($user)->getJson(route('notifications.feed'));

    $response->assertOk();
    $response->assertJsonPath('unread_count', 1);
    $response->assertJsonCount(1, 'notifications');
});

it('marks a notification as read', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);
    $notification = $user->fresh()->notifications()->first();

    $this->actingAs($user)
        ->post(route('notifications.read', $notification->id))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();
    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

it('marks all notifications as read', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);
    app(NotificationService::class)->sendTaskOverdueNotification($task);

    expect($user->fresh()->unreadNotifications()->count())->toBe(2);

    $this->actingAs($user)
        ->post(route('notifications.readAll'))
        ->assertRedirect();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

it('shares the unread notification count as an Inertia prop', function () {
    $user = User::factory()->create();
    $task = makeReminderTask($user);

    app(NotificationService::class)->sendTaskDueReminder($task);

    $this->withoutVite();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertInertia(fn ($page) => $page->where('auth.unreadNotifications', 1));
});
