<?php

use App\Jobs\DispatchTaskNotificationJob;
use App\Jobs\ProcessDueReminderJob;
use App\Models\Reminder;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

/**
 * Phase 2 scheduled dispatch: `notifications:dispatch` enqueues one job per due
 * reminder, due-soon task and overdue task — and never re-enqueues once the
 * idempotency markers (is_sent / due_notified_at / overdue_notified_at) are set.
 */
function dispatchUser(): User
{
    return User::factory()->create([
        'email_notifications_enabled' => true,
        'reminder_notifications_enabled' => true,
    ]);
}

it('dispatches jobs for due-soon tasks, overdue tasks and due reminders', function () {
    Queue::fake();

    $user = dispatchUser();

    $dueSoon = Task::create([
        'user_id' => $user->id,
        'title' => 'Due soon',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addMinutes(15),
    ]);

    $overdue = Task::create([
        'user_id' => $user->id,
        'title' => 'Overdue',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->subHour(),
    ]);

    $reminderTask = Task::create([
        'user_id' => $user->id,
        'title' => 'Has a reminder',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => now()->addDay(),
    ]);

    Reminder::create([
        'task_id' => $reminderTask->id,
        'user_id' => $user->id,
        'remind_at' => now()->subMinute(),
        'type' => 'notification',
        'message' => 'Ping',
        'is_sent' => false,
    ]);

    $this->artisan('notifications:dispatch')->assertSuccessful();

    Queue::assertPushed(DispatchTaskNotificationJob::class, 2);
    Queue::assertPushed(
        DispatchTaskNotificationJob::class,
        fn (DispatchTaskNotificationJob $job) => $job->taskId === $dueSoon->id && $job->kind === 'due'
    );
    Queue::assertPushed(
        DispatchTaskNotificationJob::class,
        fn (DispatchTaskNotificationJob $job) => $job->taskId === $overdue->id && $job->kind === 'overdue'
    );
    Queue::assertPushed(ProcessDueReminderJob::class, 1);
});

it('does not dispatch for tasks that are not yet due, already notified or completed', function () {
    Queue::fake();

    $user = dispatchUser();

    // Far in the future — outside the due-soon window.
    Task::create([
        'user_id' => $user->id,
        'title' => 'Later',
        'priority' => 'low',
        'status' => 'pending',
        'due_date' => now()->addDays(2),
    ]);

    // Overdue but already notified.
    Task::create([
        'user_id' => $user->id,
        'title' => 'Already flagged overdue',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->subHour(),
        'overdue_notified_at' => now(),
    ]);

    // Overdue but completed.
    Task::create([
        'user_id' => $user->id,
        'title' => 'Done',
        'priority' => 'high',
        'status' => 'completed',
        'due_date' => now()->subHour(),
    ]);

    $this->artisan('notifications:dispatch')->assertSuccessful();

    Queue::assertNothingPushed();
});

it('is idempotent once the notify markers and is_sent are set', function () {
    Queue::fake();

    $user = dispatchUser();

    // Already notified due-soon task.
    Task::create([
        'user_id' => $user->id,
        'title' => 'Due soon (notified)',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->addMinutes(15),
        'due_notified_at' => now(),
    ]);

    // Already notified overdue task.
    Task::create([
        'user_id' => $user->id,
        'title' => 'Overdue (notified)',
        'priority' => 'high',
        'status' => 'pending',
        'due_date' => now()->subHour(),
        'overdue_notified_at' => now(),
    ]);

    $reminderTask = Task::create([
        'user_id' => $user->id,
        'title' => 'Reminder sent',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => now()->addDay(),
    ]);

    // Reminder already sent.
    Reminder::create([
        'task_id' => $reminderTask->id,
        'user_id' => $user->id,
        'remind_at' => now()->subMinute(),
        'type' => 'notification',
        'message' => 'Ping',
        'is_sent' => true,
        'sent_at' => now(),
    ]);

    $this->artisan('notifications:dispatch')->assertSuccessful();

    Queue::assertNothingPushed();
});
