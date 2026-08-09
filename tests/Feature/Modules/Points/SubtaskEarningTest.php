<?php

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointWallet;
use App\Services\SubtaskService;

function pointsSubtaskTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Task with subtasks',
        'status' => 'pending',
        'position' => 1,
    ]);
}

it('awards subtask points when a subtask is completed directly', function () {
    $user = User::factory()->create();
    $task = pointsSubtaskTask($user);
    $subtask = Subtask::create([
        'task_id' => $task->id,
        'title' => 'Step one',
        'is_completed' => false,
        'position' => 1,
    ]);

    $subtask->update(['is_completed' => true, 'completed_at' => now()]);

    $this->assertDatabaseHas('point_ledger_entries', [
        'user_id' => $user->id,
        'source' => PointSource::SubtaskCompletion->value,
        'amount' => 2,
    ]);
});

it('reverses subtask points when a subtask is un-completed', function () {
    $user = User::factory()->create();
    $task = pointsSubtaskTask($user);
    $subtask = Subtask::create([
        'task_id' => $task->id,
        'title' => 'Step one',
        'is_completed' => false,
        'position' => 1,
    ]);

    $subtask->update(['is_completed' => true, 'completed_at' => now()]);
    $subtask->update(['is_completed' => false, 'completed_at' => null]);

    $net = \App\Modules\Points\Models\PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::SubtaskCompletion->value)
        ->sum('amount');

    expect((int) $net)->toBe(0);
});

it('awards both subtask and task points when the last subtask auto-completes the task', function () {
    $user = User::factory()->create();
    $task = pointsSubtaskTask($user);
    $subtask = Subtask::create([
        'task_id' => $task->id,
        'title' => 'Only step',
        'is_completed' => false,
        'position' => 1,
    ]);

    // Going through the service auto-completes the parent task, firing both
    // the subtask observer and the task observer.
    app(SubtaskService::class)->toggleSubtaskCompletion($subtask, $user->id);

    $wallet = PointWallet::where('user_id', $user->id)->first();
    // subtask (2) + task (10) + first-day streak (5)
    expect($wallet->balance)->toBe(17);

    $this->assertDatabaseHas('point_ledger_entries', [
        'user_id' => $user->id,
        'source' => PointSource::SubtaskCompletion->value,
    ]);
    $this->assertDatabaseHas('point_ledger_entries', [
        'user_id' => $user->id,
        'source' => PointSource::TaskCompletion->value,
    ]);
});
