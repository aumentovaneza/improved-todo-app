<?php

use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * The task <-> list many-to-many. Attaching happens both on task save (via the
 * `lists` payload) and through the dedicated attach/detach endpoints. Both sides
 * enforce ownership of the list and the task.
 */
function ownedList(User $user, string $name = 'List'): TaskList
{
    return TaskList::create([
        'user_id' => $user->id,
        'name' => $name.' '.uniqid(),
        'color' => '#3B82F6',
        'position' => 1,
    ]);
}

it('writes pivot rows when a task is created with lists', function () {
    $user = User::factory()->create();
    $list = ownedList($user);

    $this->actingAs($user)
        ->from(route('tasks.index'))
        ->post(route('tasks.store'), [
            'title' => 'Task with list',
            'priority' => 'medium',
            'lists' => [$list->id],
        ])
        ->assertSessionHasNoErrors();

    $task = Task::where('user_id', $user->id)->firstOrFail();

    expect($task->lists)->toHaveCount(1)
        ->and($task->lists->first()->id)->toBe($list->id);
});

it('detaches all lists when updating with an empty lists array', function () {
    $user = User::factory()->create();
    $list = ownedList($user);
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Task',
        'priority' => 'medium',
        'status' => 'pending',
    ]);
    $task->lists()->attach($list->id);

    $this->actingAs($user)
        ->from(route('tasks.index'))
        ->put(route('tasks.update', $task), [
            'title' => 'Task',
            'priority' => 'medium',
            'status' => 'pending',
            'lists' => [],
        ])
        ->assertSessionHasNoErrors();

    expect($task->fresh()->lists)->toHaveCount(0);
});

it('leaves attachments intact when updating without the lists key', function () {
    $user = User::factory()->create();
    $list = ownedList($user);
    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Task',
        'priority' => 'medium',
        'status' => 'pending',
    ]);
    $task->lists()->attach($list->id);

    $this->actingAs($user)
        ->from(route('tasks.index'))
        ->put(route('tasks.update', $task), [
            'title' => 'Task renamed',
            'priority' => 'medium',
            'status' => 'pending',
        ])
        ->assertSessionHasNoErrors();

    expect($task->fresh()->lists)->toHaveCount(1);
});

it('supports a task in many lists and a list with many tasks', function () {
    $user = User::factory()->create();
    $listA = ownedList($user, 'A');
    $listB = ownedList($user, 'B');

    $task1 = Task::create(['user_id' => $user->id, 'title' => 'T1', 'priority' => 'medium', 'status' => 'pending']);
    $task2 = Task::create(['user_id' => $user->id, 'title' => 'T2', 'priority' => 'medium', 'status' => 'pending']);

    $task1->lists()->attach([$listA->id, $listB->id]);
    $listA->tasks()->attach($task2->id);

    expect($task1->fresh()->lists)->toHaveCount(2)
        ->and($listA->fresh()->tasks)->toHaveCount(2)
        ->and($listB->fresh()->tasks)->toHaveCount(1);
});

it('rejects attaching another user\'s list id via the task payload', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $otherList = ownedList($other);

    $this->actingAs($user)
        ->from(route('tasks.index'))
        ->post(route('tasks.store'), [
            'title' => 'Task',
            'priority' => 'medium',
            'lists' => [$otherList->id],
        ])
        ->assertSessionHasErrors('lists.0');

    expect(Task::where('user_id', $user->id)->count())->toBe(0);
});

it('attaches a task to a list via the endpoint and is idempotent', function () {
    $user = User::factory()->create();
    $list = ownedList($user);
    $task = Task::create(['user_id' => $user->id, 'title' => 'T', 'priority' => 'medium', 'status' => 'pending']);

    $this->actingAs($user)
        ->from(route('lists.show', $list))
        ->post(route('lists.tasks.attach', $list), ['task_id' => $task->id])
        ->assertSessionHasNoErrors();

    // Attaching again must not create a duplicate pivot row.
    $this->actingAs($user)
        ->from(route('lists.show', $list))
        ->post(route('lists.tasks.attach', $list), ['task_id' => $task->id])
        ->assertSessionHasNoErrors();

    expect(DB::table('list_task')->where('task_list_id', $list->id)->where('task_id', $task->id)->count())->toBe(1);
});

it('blocks attaching when the user does not own the list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $otherList = ownedList($other);
    $task = Task::create(['user_id' => $user->id, 'title' => 'T', 'priority' => 'medium', 'status' => 'pending']);

    $this->actingAs($user)
        ->post(route('lists.tasks.attach', $otherList), ['task_id' => $task->id])
        ->assertForbidden();

    expect(DB::table('list_task')->where('task_list_id', $otherList->id)->count())->toBe(0);
});

it('blocks attaching another user\'s task to your own list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = ownedList($user);
    $otherTask = Task::create(['user_id' => $other->id, 'title' => 'T', 'priority' => 'medium', 'status' => 'pending']);

    $this->actingAs($user)
        ->post(route('lists.tasks.attach', $list), ['task_id' => $otherTask->id])
        ->assertForbidden();

    expect(DB::table('list_task')->where('task_list_id', $list->id)->count())->toBe(0);
});

it('detaches a task via the endpoint and enforces ownership', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = ownedList($user);
    $task = Task::create(['user_id' => $user->id, 'title' => 'T', 'priority' => 'medium', 'status' => 'pending']);
    $list->tasks()->attach($task->id);

    // A different user cannot detach.
    $this->actingAs($other)
        ->delete(route('lists.tasks.detach', [$list, $task]))
        ->assertForbidden();

    expect(DB::table('list_task')->where('task_list_id', $list->id)->count())->toBe(1);

    // The owner can.
    $this->actingAs($user)
        ->from(route('lists.show', $list))
        ->delete(route('lists.tasks.detach', [$list, $task]))
        ->assertSessionHasNoErrors();

    expect(DB::table('list_task')->where('task_list_id', $list->id)->count())->toBe(0);
});
