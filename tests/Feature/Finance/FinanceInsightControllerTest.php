<?php

use App\Models\User;
use App\Services\Ai\Contracts\TextGenerator;

function bindFakeInsightGenerator($app, callable $handler): void
{
    $app->bind(TextGenerator::class, fn () => new class($handler) implements TextGenerator
    {
        public function __construct(private $handler) {}

        public function generate(string $system, string $prompt, array $options = []): string
        {
            return ($this->handler)($system, $prompt, $options);
        }
    });
}

it('generates and caches an insight for an entitled user', function () {
    $user = User::factory()->create();
    bindFakeInsightGenerator($this->app, fn () => 'Generated spending insight.');

    $response = $this->actingAs($user)
        ->from(route('weviewallet.dashboard'))
        ->post(route('finance.insights.store'), ['range' => 'this_month']);

    $response->assertRedirect(route('weviewallet.dashboard'));

    $this->assertDatabaseCount('finance_insights', 1);
    $this->assertDatabaseHas('finance_insights', [
        'user_id' => $user->id,
        'content' => 'Generated spending insight.',
    ]);

    // A second request for the same period does not duplicate.
    $this->actingAs($user)
        ->from(route('weviewallet.dashboard'))
        ->post(route('finance.insights.store'), ['range' => 'this_month'])
        ->assertSessionHas('info');

    $this->assertDatabaseCount('finance_insights', 1);
});

it('blocks an unentitled user when the open beta is off', function () {
    config()->set('ai.finance_insights_open_beta', false);

    $user = User::factory()->create(['role' => 'member']);
    bindFakeInsightGenerator($this->app, fn () => 'Should never run.');

    $this->actingAs($user)
        ->from(route('weviewallet.dashboard'))
        ->post(route('finance.insights.store'))
        ->assertRedirect(route('weviewallet.dashboard'))
        ->assertSessionHas('error');

    $this->assertDatabaseCount('finance_insights', 0);
});
