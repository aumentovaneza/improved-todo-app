<?php

use App\Models\User;
use App\Services\Ai\Contracts\TextGenerator;
use App\Support\DashboardWidgets;

it('generates today\'s summary on refresh but blocks a second generation the same day', function () {
    $user = User::factory()->create();

    $this->app->bind(TextGenerator::class, fn () => new class implements TextGenerator
    {
        public function generate(string $system, string $prompt, array $options = []): string
        {
            return 'Your AI daily summary.';
        }
    });

    $this->actingAs($user)
        ->post(route('dashboard.summary.refresh'))
        ->assertRedirect();
    $this->assertDatabaseCount('daily_summaries', 1);

    // A second refresh the same day must not regenerate.
    $this->actingAs($user)
        ->post(route('dashboard.summary.refresh'))
        ->assertRedirect();
    $this->assertDatabaseCount('daily_summaries', 1);
});

it('persists a valid widget layout', function () {
    $user = User::factory()->create();

    $layout = [
        ['key' => 'task_stats', 'size' => 'lg', 'enabled' => true],
        ['key' => 'pomodoro', 'size' => 'sm', 'enabled' => false],
    ];

    $this->actingAs($user)
        ->post(route('dashboard.layout.update'), ['widgets' => $layout])
        ->assertRedirect();

    $user->refresh();

    expect($user->dashboard_widgets)->toBe($layout);
});

it('rejects unknown widget keys', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('dashboard.layout.update'), [
            'widgets' => [
                ['key' => 'not_a_widget', 'size' => 'md', 'enabled' => true],
            ],
        ])
        ->assertSessionHasErrors('widgets.0.key');

    expect($user->fresh()->dashboard_widgets)->toBeNull();
});

it('rejects an invalid size value', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('dashboard.layout.update'), [
            'widgets' => [
                ['key' => 'task_stats', 'size' => 'xl', 'enabled' => true],
            ],
        ])
        ->assertSessionHasErrors('widgets.0.size');
});

it('rejects a size not allowed for that specific widget', function () {
    $user = User::factory()->create();

    // weather only allows sm|md, so lg must be rejected.
    $this->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('dashboard.layout.update'), [
            'widgets' => [
                ['key' => 'weather', 'size' => 'lg', 'enabled' => true],
            ],
        ])
        ->assertSessionHasErrors('widgets.0.size');
});

it('exposes every registry key with the default layout', function () {
    $keys = DashboardWidgets::keys();

    expect($keys)->toContain('task_stats', 'pomodoro', 'weather')
        ->and(DashboardWidgets::defaultLayout())->toHaveCount(count($keys));
});
