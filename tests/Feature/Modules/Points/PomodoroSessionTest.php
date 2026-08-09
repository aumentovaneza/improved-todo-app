<?php

use App\Models\User;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Models\PomodoroSession;
use App\Modules\Points\Services\PomodoroSessionService;
use Illuminate\Support\Str;

function recordPomodoro(User $user, array $overrides = []): PomodoroSession
{
    return app(PomodoroSessionService::class)->record($user, array_merge([
        'type' => 'work',
        'duration_seconds' => 1500,
        'started_at' => now()->subMinutes(25)->toIso8601String(),
        'completed_at' => now()->toIso8601String(),
        'client_request_id' => (string) Str::uuid(),
    ], $overrides));
}

it('awards points for a valid work session', function () {
    $user = User::factory()->create();

    $session = recordPomodoro($user);

    expect($session->awarded_points)->toBe(8);
    expect($session->point_ledger_entry_id)->not->toBeNull();
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(8 + 5); // + streak bonus
});

it('records a below-minimum session without awarding', function () {
    $user = User::factory()->create();

    $session = recordPomodoro($user, ['duration_seconds' => 60]);

    expect($session->awarded_points)->toBe(0);
    expect($session->point_ledger_entry_id)->toBeNull();
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(0);
});

it('does not award break sessions', function () {
    $user = User::factory()->create();

    $session = recordPomodoro($user, ['type' => 'short_break']);

    expect($session->awarded_points)->toBe(0);
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(0);
});

it('is idempotent for a repeated client_request_id', function () {
    $user = User::factory()->create();
    $crid = (string) Str::uuid();

    $first = recordPomodoro($user, ['client_request_id' => $crid]);
    $second = recordPomodoro($user, ['client_request_id' => $crid]);

    expect($second->id)->toBe($first->id);
    expect(PomodoroSession::where('user_id', $user->id)->count())->toBe(1);
    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(8 + 5);
});

it('stops awarding once the daily cap is reached', function () {
    config()->set('points.pomodoro.daily_award_cap', 2);
    $user = User::factory()->create();

    recordPomodoro($user);
    recordPomodoro($user);
    $third = recordPomodoro($user);

    expect($third->awarded_points)->toBe(0);
    expect(PomodoroSession::where('user_id', $user->id)->where('awarded_points', '>', 0)->count())->toBe(2);
});

it('counts backdated sessions against the daily cap by server time', function () {
    config()->set('points.pomodoro.daily_award_cap', 2);
    $user = User::factory()->create();

    // Backdating completed_at must not let sessions escape the daily cap.
    $backdated = ['completed_at' => now()->subDay()->toIso8601String()];
    recordPomodoro($user, $backdated);
    recordPomodoro($user, $backdated);
    $third = recordPomodoro($user, $backdated);

    expect($third->awarded_points)->toBe(0);
    expect(PomodoroSession::where('user_id', $user->id)->where('awarded_points', '>', 0)->count())->toBe(2);
});

it('rejects a future completed_at at the request layer', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('store.index'))
        ->post(route('pomodoro.sessions.store'), [
            'type' => 'work',
            'duration_seconds' => 1500,
            'started_at' => now()->toIso8601String(),
            'completed_at' => now()->addHour()->toIso8601String(),
            'client_request_id' => (string) Str::uuid(),
        ])
        ->assertSessionHasErrors('completed_at');

    expect(PomodoroSession::where('user_id', $user->id)->count())->toBe(0);
});
