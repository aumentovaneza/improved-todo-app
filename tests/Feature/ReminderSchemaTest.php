<?php

use App\Models\Reminder;
use App\Models\Task;
use App\Models\User;

/**
 * The reminders table/model previously spoke `reminder_time` + an enum type and
 * had no `message` column, while the Service/Controller spoke `remind_at` +
 * `message` + a string type — so every CRUD path threw a DB error. These tests
 * lock in the repaired schema.
 */
function reminderTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Prepare deck',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => now()->addDays(3),
    ]);
}

it('creates a reminder with remind_at, type and message', function () {
    $user = User::factory()->create();
    $task = reminderTask($user);

    $this->actingAs($user)
        ->from('/reminders')
        ->post(route('reminders.store'), [
            'task_id' => $task->id,
            'remind_at' => now()->addHour()->toDateTimeString(),
            'type' => 'notification',
            'message' => 'Do not forget',
        ])
        ->assertSessionHasNoErrors();

    $reminder = Reminder::where('task_id', $task->id)->firstOrFail();

    expect($reminder->remind_at)->not->toBeNull();
    expect($reminder->type)->toBe('notification');
    expect($reminder->message)->toBe('Do not forget');
});

it('rejects an unsupported reminder type', function () {
    $user = User::factory()->create();
    $task = reminderTask($user);

    $this->actingAs($user)
        ->post(route('reminders.store'), [
            'task_id' => $task->id,
            'remind_at' => now()->addHour()->toDateTimeString(),
            'type' => 'carrier-pigeon',
            'message' => null,
        ])
        ->assertSessionHasErrors('type');

    expect(Reminder::count())->toBe(0);
});

it('accepts the extended app-level type set (push)', function () {
    $user = User::factory()->create();
    $task = reminderTask($user);

    $this->actingAs($user)
        ->post(route('reminders.store'), [
            'task_id' => $task->id,
            'remind_at' => now()->addHour()->toDateTimeString(),
            'type' => 'push',
        ])
        ->assertSessionHasNoErrors();

    expect(Reminder::where('type', 'push')->count())->toBe(1);
});

it('updates and deletes a reminder', function () {
    $user = User::factory()->create();
    $task = reminderTask($user);

    $reminder = Reminder::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'remind_at' => now()->addHour(),
        'type' => 'notification',
        'message' => 'Original',
        'is_sent' => false,
    ]);

    $this->actingAs($user)
        ->put(route('reminders.update', $reminder), [
            'remind_at' => now()->addHours(2)->toDateTimeString(),
            'type' => 'email',
            'message' => 'Updated',
        ])
        ->assertSessionHasNoErrors();

    expect($reminder->fresh()->message)->toBe('Updated');
    expect($reminder->fresh()->type)->toBe('email');

    $this->actingAs($user)
        ->delete(route('reminders.destroy', $reminder))
        ->assertSessionHasNoErrors();

    expect(Reminder::find($reminder->id))->toBeNull();
});
