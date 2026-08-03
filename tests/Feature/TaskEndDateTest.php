<?php

use App\Models\Task;
use App\Models\User;

/**
 * Tasks may span multiple days via an optional end_date. These tests lock in
 * that a valid end_date persists, that an end_date before the due_date is
 * rejected by validation, and that the full end date/time attribute uses the
 * end_date when one is present.
 */
it('persists a valid end_date when creating a task', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from('/calendar')
        ->post(route('tasks.store'), [
            'title' => 'Multi-day task',
            'priority' => 'medium',
            'due_date' => '2026-08-04',
            'end_date' => '2026-08-06',
        ]);

    $response->assertRedirect('/calendar');
    $response->assertSessionHasNoErrors();

    $task = Task::where('user_id', $user->id)->firstOrFail();

    expect($task->end_date)->not->toBeNull();
    expect($task->end_date->format('Y-m-d'))->toBe('2026-08-06');
});

it('rejects an end_date that is before the due_date', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from('/calendar')
        ->post(route('tasks.store'), [
            'title' => 'Backwards span',
            'priority' => 'medium',
            'due_date' => '2026-08-06',
            'end_date' => '2026-08-04',
        ]);

    $response->assertSessionHasErrors('end_date');

    expect(Task::where('user_id', $user->id)->count())->toBe(0);
});

it('uses end_date for the full end date/time attribute when present', function () {
    $user = User::factory()->create();

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Spanning task',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => '2026-08-04',
        'end_date' => '2026-08-06',
        'is_all_day' => true,
    ]);

    $fullEnd = $task->full_end_date_time;

    expect($fullEnd)->not->toBeNull();
    // All-day task falls to the end of the end_date's day.
    expect($fullEnd->format('Y-m-d'))->toBe('2026-08-06');
    expect($fullEnd->format('H:i:s'))->toBe('23:59:59');
});

it('falls back to due_date for the full end date/time when no end_date is set', function () {
    $user = User::factory()->create();

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Single day task',
        'priority' => 'medium',
        'status' => 'pending',
        'due_date' => '2026-08-04',
        'is_all_day' => true,
    ]);

    expect($task->full_end_date_time->format('Y-m-d'))->toBe('2026-08-04');
});
