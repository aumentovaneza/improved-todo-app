<?php

use App\Models\Task;
use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Models\PointWallet;
use Carbon\Carbon;

function pointsStreakTask(User $user): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => 'Daily task',
        'status' => 'pending',
        'position' => 1,
    ]);
}

afterEach(fn () => Carbon::setTestNow());

it('awards the streak bonus only once per day', function () {
    Carbon::setTestNow('2026-08-09 09:00:00');
    $user = User::factory()->create(['timezone' => 'UTC']);

    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);
    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);

    $streakEntries = PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::DailyStreak->value)
        ->count();

    expect($streakEntries)->toBe(1);
    expect(PointWallet::where('user_id', $user->id)->value('current_streak_days'))->toBe(1);
});

it('increments the streak on consecutive days', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);

    Carbon::setTestNow('2026-08-09 09:00:00');
    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);

    Carbon::setTestNow('2026-08-10 09:00:00');
    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);

    $wallet = PointWallet::where('user_id', $user->id)->first();
    expect($wallet->current_streak_days)->toBe(2);
    expect($wallet->longest_streak_days)->toBe(2);
});

it('resets the streak after a missed day', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);

    Carbon::setTestNow('2026-08-09 09:00:00');
    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);

    // Skip 2026-08-10 entirely.
    Carbon::setTestNow('2026-08-11 09:00:00');
    pointsStreakTask($user)->update(['status' => 'completed', 'completed_at' => now()]);

    $wallet = PointWallet::where('user_id', $user->id)->first();
    expect($wallet->current_streak_days)->toBe(1);
    expect($wallet->longest_streak_days)->toBe(1);
});
