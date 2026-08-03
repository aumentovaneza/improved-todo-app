<?php

use App\Models\ListItem;
use App\Models\TaskList;
use App\Models\User;

/**
 * JSON (background XHR) CRUD + toggle + reorder for list items. Ownership is
 * enforced through the parent list on every mutation.
 */
function makeList(User $user): TaskList
{
    return TaskList::create([
        'user_id' => $user->id,
        'name' => 'List '.uniqid(),
        'color' => '#3B82F6',
        'position' => 1,
    ]);
}

it('stores an item and returns it as JSON', function () {
    $user = User::factory()->create();
    $list = makeList($user);

    $response = $this->actingAs($user)
        ->postJson(route('list-items.store'), [
            'task_list_id' => $list->id,
            'content' => 'Buy milk',
        ]);

    $response->assertOk()
        ->assertJsonPath('item.content', 'Buy milk')
        ->assertJsonPath('item.task_list_id', $list->id)
        ->assertJsonPath('item.is_completed', false);

    expect(ListItem::where('task_list_id', $list->id)->count())->toBe(1);
});

it('validates that content is required on store', function () {
    $user = User::factory()->create();
    $list = makeList($user);

    $this->actingAs($user)
        ->postJson(route('list-items.store'), [
            'task_list_id' => $list->id,
            'content' => '',
        ])
        ->assertJsonValidationErrors(['content']);
});

it('cannot add an item to another user\'s list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = makeList($other);

    $this->actingAs($user)
        ->postJson(route('list-items.store'), [
            'task_list_id' => $list->id,
            'content' => 'Sneaky',
        ])
        ->assertStatus(500);

    expect(ListItem::where('task_list_id', $list->id)->count())->toBe(0);
});

it('toggles completion and sets/clears completed_at', function () {
    $user = User::factory()->create();
    $list = makeList($user);
    $item = ListItem::create(['task_list_id' => $list->id, 'content' => 'Task', 'position' => 1]);

    $this->actingAs($user)
        ->postJson(route('list-items.toggle', $item))
        ->assertOk()
        ->assertJsonPath('item.is_completed', true);

    $item->refresh();
    expect($item->is_completed)->toBeTrue()
        ->and($item->completed_at)->not->toBeNull();

    $this->actingAs($user)
        ->postJson(route('list-items.toggle', $item))
        ->assertOk()
        ->assertJsonPath('item.is_completed', false);

    $item->refresh();
    expect($item->is_completed)->toBeFalse()
        ->and($item->completed_at)->toBeNull();
});

it('updates an item', function () {
    $user = User::factory()->create();
    $list = makeList($user);
    $item = ListItem::create(['task_list_id' => $list->id, 'content' => 'Old', 'position' => 1]);

    $this->actingAs($user)
        ->putJson(route('list-items.update', $item), [
            'content' => 'Updated',
            'is_completed' => true,
        ])
        ->assertOk()
        ->assertJsonPath('item.content', 'Updated')
        ->assertJsonPath('item.is_completed', true);

    expect($item->fresh()->content)->toBe('Updated');
});

it('deletes an item', function () {
    $user = User::factory()->create();
    $list = makeList($user);
    $item = ListItem::create(['task_list_id' => $list->id, 'content' => 'Bye', 'position' => 1]);

    $this->actingAs($user)
        ->deleteJson(route('list-items.destroy', $item))
        ->assertOk()
        ->assertJsonPath('deleted', true);

    expect(ListItem::find($item->id))->toBeNull();
});

it('reorders items within a list', function () {
    $user = User::factory()->create();
    $list = makeList($user);
    $a = ListItem::create(['task_list_id' => $list->id, 'content' => 'A', 'position' => 1]);
    $b = ListItem::create(['task_list_id' => $list->id, 'content' => 'B', 'position' => 2]);

    $this->actingAs($user)
        ->postJson(route('list-items.reorder'), ['itemIds' => [$b->id, $a->id]])
        ->assertOk();

    expect($b->fresh()->position)->toBe(1)
        ->and($a->fresh()->position)->toBe(2);
});

it('enforces ownership on update, delete, and toggle', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $list = makeList($other);
    $item = ListItem::create(['task_list_id' => $list->id, 'content' => 'Theirs', 'position' => 1]);

    $this->actingAs($user)
        ->putJson(route('list-items.update', $item), ['content' => 'Hacked'])
        ->assertStatus(500);

    $this->actingAs($user)
        ->postJson(route('list-items.toggle', $item))
        ->assertStatus(500);

    $this->actingAs($user)
        ->deleteJson(route('list-items.destroy', $item))
        ->assertStatus(500);

    $item->refresh();
    expect($item->content)->toBe('Theirs')
        ->and($item->is_completed)->toBeFalse()
        ->and(ListItem::find($item->id))->not->toBeNull();
});
