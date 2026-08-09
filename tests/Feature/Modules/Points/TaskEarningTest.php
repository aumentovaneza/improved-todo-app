<?php

use App\Models\Task;
use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Services\PointsWalletService;

/**
 * Local task helper (uniquely named — the suite has a pre-existing global
 * makeTask() collision we must not reintroduce).
 */
function pointsEarnTask(User $user, array $overrides = []): Task
{
    return Task::create(array_merge([
        'user_id' => $user->id,
        'title' => 'Focus task',
        'status' => 'pending',
        'position' => 1,
    ], $overrides));
}

it('awards config points for completing a task and floors the streak bonus', function () {
    $user = User::factory()->create();
    $task = pointsEarnTask($user);

    $task->update(['status' => 'completed', 'completed_at' => now()]);

    $wallet = PointWallet::where('user_id', $user->id)->first();
    // task_completion (10) + first-day streak bonus (5)
    expect($wallet->balance)->toBe(15);

    $this->assertDatabaseHas('point_ledger_entries', [
        'user_id' => $user->id,
        'source' => PointSource::TaskCompletion->value,
        'amount' => 10,
    ]);
});

it('does not double-award when completed_at changes but stays set', function () {
    $user = User::factory()->create();
    $task = pointsEarnTask($user);

    $task->update(['status' => 'completed', 'completed_at' => now()]);
    // A later re-save that keeps completed_at non-null must not re-award.
    $task->update(['completed_at' => now()->addMinute()]);

    $taskEntries = \App\Modules\Points\Models\PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::TaskCompletion->value)
        ->count();

    expect($taskEntries)->toBe(1);
});

it('reverses points when a task is un-completed', function () {
    $user = User::factory()->create();
    $task = pointsEarnTask($user);

    $task->update(['status' => 'completed', 'completed_at' => now()]);
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(15);

    $task->update(['status' => 'pending', 'completed_at' => null]);

    // The 10 task points are reversed; the streak bonus (5) is not tied to the
    // task sourceable and remains.
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(5);
});

it('clamps reversals so the balance never goes below zero', function () {
    $user = User::factory()->create();
    $task = pointsEarnTask($user);

    $task->update(['status' => 'completed', 'completed_at' => now()]);
    // Spend everything (simulating a store purchase drain).
    app(PointsWalletService::class)->debit($user->id, 15, PointSource::StorePurchase);
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(0);

    $task->update(['status' => 'pending', 'completed_at' => null]);

    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(0);
});

it('re-awards a recurring task after it is reset and completed again', function () {
    $user = User::factory()->create();
    $task = pointsEarnTask($user);

    $task->update(['status' => 'completed', 'completed_at' => now()]);
    $task->update(['status' => 'pending', 'completed_at' => null]);   // recurring reset
    $task->update(['status' => 'completed', 'completed_at' => now()]); // completed again

    $earnEntries = \App\Modules\Points\Models\PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::TaskCompletion->value)
        ->where('amount', '>', 0)
        ->count();

    // Two positive awards + one clamped/adjust reversal in between.
    expect($earnEntries)->toBe(2);
    // Net task contribution is 10 (10 - 10 + 10); plus streak 5 = 15.
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(15);
});
