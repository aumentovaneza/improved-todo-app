<?php

use App\Models\ListItem;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

/**
 * Web (Inertia/redirect) CRUD for user-owned task lists. Names are encrypted at
 * rest, uniqueness is enforced per-user in PHP, and deleting a list cascades its
 * items and pivot rows while leaving attached tasks intact.
 */
it('redirects a guest away from the lists index', function () {
    $this->get(route('lists.index'))->assertRedirect(route('login'));
});

it('shows only the current user\'s lists on the index', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    TaskList::create(['user_id' => $user->id, 'name' => 'Mine', 'color' => '#3B82F6', 'position' => 1]);
    TaskList::create(['user_id' => $other->id, 'name' => 'Theirs', 'color' => '#EF4444', 'position' => 1]);

    $this->actingAs($user)
        ->get(route('lists.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Lists/Index')
            ->has('lists', 1)
            ->where('lists.0.name', 'Mine'));
});

it('creates a list and round-trips the encrypted name', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from(route('lists.index'))
        ->post(route('lists.store'), [
            'name' => 'Grocery List',
            'color' => '#10B981',
            'description' => 'Weekly shop',
        ]);

    $response->assertRedirect(route('lists.index'));
    $response->assertSessionHasNoErrors();

    $list = TaskList::where('user_id', $user->id)->firstOrFail();

    expect($list->name)->toBe('Grocery List')
        ->and($list->description)->toBe('Weekly shop')
        ->and($list->color)->toBe('#10B981');

    // Stored ciphertext must not equal the plaintext.
    $raw = \Illuminate\Support\Facades\DB::table('task_lists')->where('id', $list->id)->value('name');
    expect($raw)->not->toBe('Grocery List');
});

it('rejects a duplicate list name for the same user', function () {
    $user = User::factory()->create();

    TaskList::create(['user_id' => $user->id, 'name' => 'Groceries', 'color' => '#10B981', 'position' => 1]);

    $response = $this->actingAs($user)
        ->from(route('lists.index'))
        ->post(route('lists.store'), [
            'name' => 'Groceries',
            'color' => '#3B82F6',
        ]);

    $response->assertSessionHasErrors('error');
    expect(TaskList::where('user_id', $user->id)->count())->toBe(1);
});

it('allows the same list name across different users', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    TaskList::create(['user_id' => $other->id, 'name' => 'Groceries', 'color' => '#10B981', 'position' => 1]);

    $response = $this->actingAs($user)
        ->from(route('lists.index'))
        ->post(route('lists.store'), [
            'name' => 'Groceries',
            'color' => '#3B82F6',
        ]);

    $response->assertSessionHasNoErrors();
    expect(TaskList::where('user_id', $user->id)->count())->toBe(1);
});

it('validates a missing name and a bad color on store', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('lists.index'))
        ->post(route('lists.store'), ['color' => '#10B981'])
        ->assertSessionHasErrors('name');

    $this->actingAs($user)
        ->from(route('lists.index'))
        ->post(route('lists.store'), ['name' => 'Valid', 'color' => 'blue'])
        ->assertSessionHasErrors('color');
});

it('updates an owned list', function () {
    $user = User::factory()->create();
    $list = TaskList::create(['user_id' => $user->id, 'name' => 'Old', 'color' => '#10B981', 'position' => 1]);

    $response = $this->actingAs($user)
        ->from(route('lists.index'))
        ->put(route('lists.update', $list), [
            'name' => 'New',
            'color' => '#3B82F6',
        ]);

    $response->assertRedirect(route('lists.index'));
    $response->assertSessionHasNoErrors();

    expect($list->fresh()->name)->toBe('New');
});

it('blocks updating another user\'s list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = TaskList::create(['user_id' => $other->id, 'name' => 'Theirs', 'color' => '#10B981', 'position' => 1]);

    $this->actingAs($user)
        ->from(route('lists.index'))
        ->put(route('lists.update', $list), ['name' => 'Hacked', 'color' => '#3B82F6'])
        ->assertSessionHasErrors('error');

    expect($list->fresh()->name)->toBe('Theirs');
});

it('deletes an owned list and cascades its items and pivot rows', function () {
    $user = User::factory()->create();
    $list = TaskList::create(['user_id' => $user->id, 'name' => 'Doomed', 'color' => '#10B981', 'position' => 1]);
    $item = ListItem::create(['task_list_id' => $list->id, 'content' => 'Item', 'position' => 1]);

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Attached',
        'priority' => 'medium',
        'status' => 'pending',
    ]);
    $list->tasks()->attach($task->id);

    $this->actingAs($user)
        ->from(route('lists.index'))
        ->delete(route('lists.destroy', $list))
        ->assertRedirect(route('lists.index'));

    expect(TaskList::find($list->id))->toBeNull()
        ->and(ListItem::find($item->id))->toBeNull()
        ->and(\Illuminate\Support\Facades\DB::table('list_task')->where('task_list_id', $list->id)->count())->toBe(0)
        // The task itself survives.
        ->and(Task::find($task->id))->not->toBeNull();
});

it('blocks deleting another user\'s list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = TaskList::create(['user_id' => $other->id, 'name' => 'Theirs', 'color' => '#10B981', 'position' => 1]);

    $this->actingAs($user)
        ->from(route('lists.index'))
        ->delete(route('lists.destroy', $list))
        ->assertSessionHasErrors('error');

    expect(TaskList::find($list->id))->not->toBeNull();
});

it('returns 404 when showing a list that is not owned', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = TaskList::create(['user_id' => $other->id, 'name' => 'Theirs', 'color' => '#10B981', 'position' => 1]);

    $this->actingAs($user)
        ->get(route('lists.show', $list))
        ->assertNotFound();
});
