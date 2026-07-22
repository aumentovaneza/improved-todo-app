<?php

use App\Models\DailySummary;
use App\Models\User;
use App\Services\Ai\Contracts\TextGenerator;
use App\Services\DailySummaryService;

function fakeGenerator(callable $handler): TextGenerator
{
    return new class($handler) implements TextGenerator
    {
        public function __construct(private $handler) {}

        public function generate(string $system, string $prompt, array $options = []): string
        {
            return ($this->handler)($system, $prompt, $options);
        }
    };
}

it('honors the open-beta flag and falls back to the premium tier when off', function () {
    $freeUser = User::factory()->create(['role' => 'member']);
    $premiumUser = User::factory()->create(['role' => 'admin']);

    $service = $this->app->make(DailySummaryService::class);

    config()->set('ai.open_beta.daily_summary', true);
    expect($service->userCanUseSummary($freeUser))->toBeTrue();

    config()->set('ai.open_beta.daily_summary', false);
    expect($service->userCanUseSummary($freeUser))->toBeFalse()
        ->and($service->userCanUseSummary($premiumUser))->toBeTrue();
});

it('generates and upserts a summary using the text generator', function () {
    $user = User::factory()->create();

    $this->app->bind(TextGenerator::class, fn () => fakeGenerator(
        fn () => 'Here is your friendly AI summary for today.'
    ));

    $service = $this->app->make(DailySummaryService::class);
    $summary = $service->generateForUser($user);

    expect($summary)->toBeInstanceOf(DailySummary::class)
        ->and($summary->content)->toBe('Here is your friendly AI summary for today.')
        ->and($summary->provider)->not->toBe('fallback');

    $this->assertDatabaseCount('daily_summaries', 1);
    $this->assertDatabaseHas('daily_summaries', ['user_id' => $user->id]);

    // Re-generating the same day upserts rather than duplicating.
    $service->generateForUser($user);
    $this->assertDatabaseCount('daily_summaries', 1);
});

it('falls back to a deterministic template when the provider fails', function () {
    $user = User::factory()->create();

    $this->app->bind(TextGenerator::class, fn () => fakeGenerator(
        fn () => throw new RuntimeException('provider down')
    ));

    $service = $this->app->make(DailySummaryService::class);
    $summary = $service->generateForUser($user);

    expect($summary->provider)->toBe('fallback')
        ->and($summary->model)->toBe('template')
        ->and($summary->content)->toContain('task')
        ->and($summary->content)->toContain('overdue');

    $this->assertDatabaseCount('daily_summaries', 1);
});

it('returns the cached summary for today', function () {
    $user = User::factory()->create();

    expect(app(DailySummaryService::class)->getCachedForToday($user))->toBeNull();

    DailySummary::factory()->create([
        'user_id' => $user->id,
        'summary_date' => $user->nowInUserTimezone()->toDateString(),
    ]);

    expect(app(DailySummaryService::class)->getCachedForToday($user))
        ->not->toBeNull();
});
