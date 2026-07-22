<?php

use App\Models\Task;
use App\Models\User;

/**
 * Task mutations run on POST/PUT/DELETE routes whose paths have no GET
 * counterpart — /tasks/{task} (show is excluded from the resource),
 * /tasks/{task}/toggle-status, and /tasks/reorder. A plain back() that
 * resolves to the request's own URL leaves Inertia following the 302 into a
 * dead endpoint, so the save appears to fail with a 404. These tests lock in
 * that mutations never redirect into a GET-less task endpoint.
 */
function makeTask(User $user, array $attributes = []): Task
{
    return Task::create(array_merge([
        'user_id' => $user->id,
        'title' => 'Original title',
        'priority' => 'medium',
        'status' => 'pending',
        'is_all_day' => true,
    ], $attributes));
}

it('does not redirect a task update into the GET-less task detail endpoint', function () {
    $user = User::factory()->create();
    $task = makeTask($user);

    $response = $this->actingAs($user)
        ->from("/tasks/{$task->id}")
        ->put(route('tasks.update', $task->id), [
            'title' => 'Updated title',
            'priority' => 'high',
            'status' => 'pending',
        ]);

    $response->assertRedirect(route('tasks.index'));
});

it('redirects a task update back to the originating page when it is a real GET route', function () {
    $user = User::factory()->create();
    $task = makeTask($user);

    $response = $this->actingAs($user)
        ->from('/calendar')
        ->put(route('tasks.update', $task->id), [
            'title' => 'Updated title',
            'priority' => 'high',
            'status' => 'pending',
        ]);

    $response->assertRedirect('/calendar');
});

it('does not redirect a delete into the GET-less task detail endpoint', function () {
    $user = User::factory()->create();
    $task = makeTask($user);

    $response = $this->actingAs($user)
        ->from("/tasks/{$task->id}")
        ->delete(route('tasks.destroy', $task->id));

    $response->assertRedirect(route('tasks.index'));
});

it('does not redirect a status toggle into its own GET-less endpoint', function () {
    $user = User::factory()->create();
    $task = makeTask($user);

    $response = $this->actingAs($user)
        ->from("/tasks/{$task->id}/toggle-status")
        ->post(route('tasks.toggle-status', $task->id), ['status' => 'completed']);

    $response->assertRedirect(route('tasks.index'));
});

it('does not redirect a reorder into its own GET-less endpoint', function () {
    $user = User::factory()->create();
    $task = makeTask($user);

    $response = $this->actingAs($user)
        ->from('/tasks/reorder')
        ->post(route('tasks.reorder'), ['taskIds' => [$task->id]]);

    $response->assertRedirect(route('tasks.index'));
});
