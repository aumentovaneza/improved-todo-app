<?php

use App\Models\User;
use App\Modules\Points\Enums\PointLedgerType;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use App\Modules\Points\Services\PointsWalletService;
use App\Services\DashboardService;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Insert a ledger entry with an explicit created_at so ordering/boundary
 * assertions are deterministic. Setting created_at before save() keeps Eloquent
 * from overwriting it with now().
 */
function insertLedgerEntry(User $user, PointLedgerType $type, PointSource $source, int $amount, Carbon $createdAt, int $balanceAfter = 0): PointLedgerEntry
{
    $entry = new PointLedgerEntry([
        'user_id' => $user->id,
        'type' => $type->value,
        'source' => $source->value,
        'amount' => $amount,
        'balance_after' => $balanceAfter,
    ]);
    $entry->created_at = $createdAt;
    $entry->updated_at = $createdAt;
    $entry->save();

    return $entry;
}

it('renders the points page with balance, streak, and a transformed ledger', function () {
    $user = User::factory()->create();

    $wallet = app(PointsWalletService::class)->ensureWallet($user->id);
    $wallet->current_streak_days = 4;
    $wallet->save();

    app(PointsWalletService::class)->credit($user->id, 100, PointSource::TaskCompletion);
    app(PointsWalletService::class)->debit($user->id, 30, PointSource::StorePurchase);

    $this->withoutVite();

    $response = $this->actingAs($user)->get(route('points.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        // The page component (Points/Index.jsx) is delivered by the frontend agent.
        ->component('Points/Index', false)
        ->where('balance', 70)
        ->where('streak', 4)
        ->has('ledger.data', 2)
        // Standard Laravel paginator metadata is preserved.
        ->has('ledger.current_page')
        ->has('ledger.per_page')
        ->has('ledger.total')
        // Newest first: the spend was written last.
        ->has('ledger.data.0', fn (Assert $entry) => $entry
            ->where('type', PointLedgerType::Spend->value)
            ->where('source', PointSource::StorePurchase->value)
            ->where('source_label', 'Store purchase')
            ->where('amount', -30)
            ->where('balance_after', 70)
            ->has('id')
            ->has('created_at'))
        ->has('ledger.data.1', fn (Assert $entry) => $entry
            ->where('type', PointLedgerType::Earn->value)
            ->where('source', PointSource::TaskCompletion->value)
            ->where('source_label', 'Task completed')
            ->where('amount', 100)
            ->where('balance_after', 100)
            ->has('id')
            ->has('created_at')));
});

it('paginates a user ledger newest first', function () {
    $user = User::factory()->create();

    $older = insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 10, Carbon::parse('2026-01-01 10:00:00'));
    $newer = insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 20, Carbon::parse('2026-02-01 10:00:00'));

    $page = app(PointLedgerRepositoryInterface::class)->paginateForUser($user->id);

    expect($page->total())->toBe(2);
    expect($page->items()[0]->id)->toBe($newer->id);
    expect($page->items()[1]->id)->toBe($older->id);
});

it('builds the weekly earn breakdown grouped by source, excluding spends and old entries', function () {
    $user = User::factory()->create();
    $since = Carbon::now()->startOfWeek();

    // This week's earns across two sources.
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 10, $since->copy()->addHour());
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 5, $since->copy()->addHours(2));
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::PomodoroSession, 8, $since->copy()->addHours(3));

    // A spend this week must be excluded.
    insertLedgerEntry($user, PointLedgerType::Spend, PointSource::StorePurchase, -50, $since->copy()->addHours(4));

    // An earn before the boundary must be excluded.
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 999, $since->copy()->subDay());

    $breakdown = app(PointLedgerRepositoryInterface::class)->weeklyEarnBreakdown($user->id, $since);

    // Ordered by total desc: task (15) then pomodoro (8).
    expect($breakdown)->toBe([
        ['source' => PointSource::TaskCompletion->value, 'total' => 15],
        ['source' => PointSource::PomodoroSession->value, 'total' => 8],
    ]);
});

it('produces the dashboard points widget payload only when enabled', function () {
    $user = User::factory()->create();
    $since = Carbon::now()->startOfWeek();

    $wallet = app(PointsWalletService::class)->ensureWallet($user->id);
    $wallet->balance = 42;
    $wallet->current_streak_days = 3;
    $wallet->save();

    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 15, $since->copy()->addHour());
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::PomodoroSession, 8, $since->copy()->addHours(2));
    insertLedgerEntry($user, PointLedgerType::Spend, PointSource::StorePurchase, -50, $since->copy()->addHours(3));
    insertLedgerEntry($user, PointLedgerType::Earn, PointSource::TaskCompletion, 999, $since->copy()->subDay());

    $service = app(DashboardService::class);

    // Disabled: no payload.
    expect($service->getWidgetData($user->fresh(), []))->not->toHaveKey('points');

    $payload = $service->getWidgetData($user->fresh(), ['points'])['points'];

    expect($payload['balance'])->toBe(42);
    expect($payload['streak'])->toBe(3);
    expect($payload['earned_this_week'])->toBe(23);
    expect($payload['by_source'])->toBe([
        ['source' => PointSource::TaskCompletion->value, 'source_label' => 'Task completed', 'total' => 15],
        ['source' => PointSource::PomodoroSession->value, 'source_label' => 'Focus session', 'total' => 8],
    ]);
});
