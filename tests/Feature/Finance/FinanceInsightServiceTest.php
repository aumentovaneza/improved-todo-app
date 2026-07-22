<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceInsight;
use App\Modules\Finance\Services\FinanceInsightService;
use App\Services\Ai\Contracts\TextGenerator;

function fakeInsightGenerator(callable $handler): TextGenerator
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

it('generates and upserts an insight using the text generator', function () {
    $user = User::factory()->create();

    $this->app->bind(TextGenerator::class, fn () => fakeInsightGenerator(
        fn () => 'Here is your friendly spending insight for this period.'
    ));

    $service = $this->app->make(FinanceInsightService::class);
    $insight = $service->generateForUser($user);

    expect($insight)->toBeInstanceOf(FinanceInsight::class)
        ->and($insight->content)->toBe('Here is your friendly spending insight for this period.')
        ->and($insight->provider)->not->toBe('fallback');

    $this->assertDatabaseCount('finance_insights', 1);
    $this->assertDatabaseHas('finance_insights', ['user_id' => $user->id]);

    // Re-generating the same period upserts rather than duplicating.
    $service->generateForUser($user);
    $this->assertDatabaseCount('finance_insights', 1);
});

it('falls back to a deterministic template when the provider fails', function () {
    $user = User::factory()->create();

    $this->app->bind(TextGenerator::class, fn () => fakeInsightGenerator(
        fn () => throw new RuntimeException('provider down')
    ));

    $service = $this->app->make(FinanceInsightService::class);
    $insight = $service->generateForUser($user);

    expect($insight->provider)->toBe('fallback')
        ->and($insight->model)->toBe('template')
        ->and($insight->content)->toContain('spent')
        ->and($insight->content)->toContain('savings')
        ->and($insight->content)->toContain('₱');

    $this->assertDatabaseCount('finance_insights', 1);
});

it('returns the cached insight for the current period', function () {
    $user = User::factory()->create();

    $service = $this->app->make(FinanceInsightService::class);
    expect($service->getCachedForCurrentPeriod($user))->toBeNull();

    $this->app->bind(TextGenerator::class, fn () => fakeInsightGenerator(
        fn () => 'Cached insight content.'
    ));

    $this->app->make(FinanceInsightService::class)->generateForUser($user);

    expect($service->getCachedForCurrentPeriod($user))->not->toBeNull();
});

it('honors the open-beta flag and falls back to the premium tier when off', function () {
    $freeUser = User::factory()->create(['role' => 'member']);
    $premiumUser = User::factory()->create(['role' => 'admin']);

    $service = $this->app->make(FinanceInsightService::class);

    config()->set('ai.open_beta.finance_insights', true);
    expect($service->userCanUseInsights($freeUser))->toBeTrue();

    config()->set('ai.open_beta.finance_insights', false);
    expect($service->userCanUseInsights($freeUser))->toBeFalse()
        ->and($service->userCanUseInsights($premiumUser))->toBeTrue();
});
