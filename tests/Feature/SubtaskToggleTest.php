<?php

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;

function makeTaskWithSubtask(User $user, bool $completed = false): Subtask
{
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Parent task',
        'status' => 'pending',
        'priority' => 'medium',
    ]);

    return Subtask::create([
        'task_id' => $task->id,
        'title' => 'A subtask',
        'is_completed' => $completed,
        'completed_at' => $completed ? now() : null,
        'position' => 1,
    ]);
}

it('returns the toggled subtask as JSON for a background XHR', function () {
    $user = User::factory()->create();
    $subtask = makeTaskWithSubtask($user);

    $this->actingAs($user)
        ->postJson(route('subtasks.toggle', $subtask->id))
        ->assertOk()
        ->assertJsonPath('subtask.id', $subtask->id)
        ->assertJsonPath('subtask.is_completed', true);

    $subtask->refresh();
    expect($subtask->is_completed)->toBeTrue()
        ->and($subtask->completed_at)->not->toBeNull();
});

it('clears completed_at when toggling a subtask back to pending', function () {
    $user = User::factory()->create();
    $subtask = makeTaskWithSubtask($user, completed: true);

    $this->actingAs($user)
        ->postJson(route('subtasks.toggle', $subtask->id))
        ->assertOk()
        ->assertJsonPath('subtask.is_completed', false);

    $subtask->refresh();
    expect($subtask->is_completed)->toBeFalse()
        ->and($subtask->completed_at)->toBeNull();
});

it('persists every toggle when several subtasks are ticked in succession', function () {
    // Reproduces the reported bug: rapid, independent toggle requests must each
    // persist. (Inertia visit cancellation used to drop all but the last one.)
    $user = User::factory()->create();

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Parent task',
        'status' => 'pending',
        'priority' => 'medium',
    ]);

    $subtasks = collect(range(1, 3))->map(fn ($i) => Subtask::create([
        'task_id' => $task->id,
        'title' => "Subtask {$i}",
        'is_completed' => false,
        'position' => $i,
    ]));

    foreach ($subtasks as $subtask) {
        $this->actingAs($user)
            ->postJson(route('subtasks.toggle', $subtask->id))
            ->assertOk();
    }

    foreach ($subtasks as $subtask) {
        expect($subtask->fresh()->is_completed)->toBeTrue();
    }
});

it('forbids toggling a subtask that belongs to another user', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $subtask = makeTaskWithSubtask($owner);

    // Ownership is enforced in SubtaskService; the controller catches it and
    // returns a 500 JSON error rather than silently toggling.
    $this->actingAs($intruder)
        ->postJson(route('subtasks.toggle', $subtask->id))
        ->assertStatus(500);

    expect($subtask->fresh()->is_completed)->toBeFalse();
});
