<?php

use App\Models\DailySummary;
use App\Models\Task;
use App\Models\User;
use App\Services\DashboardService;

it('includes a recurring task occurrence in today\'s tasks (recurrence-aware)', function () {
    $user = User::factory()->create();
    $today = $user->todayInUserTimezone();

    // Weekly recurring task whose base due_date is weeks ago, but which recurs
    // on today's weekday — the bug was that this never showed as "due today".
    Task::create([
        'user_id' => $user->id,
        'title' => 'Hyrox Class',
        'status' => 'pending',
        'priority' => 'medium',
        'due_date' => $today->copy()->subWeeks(2),
        'is_recurring' => true,
        'recurrence_type' => 'weekly',
        'recurrence_config' => ['days_of_week' => [(int) $today->dayOfWeek]],
        'recurring_until' => $today->copy()->addMonth(),
    ]);

    $todayTasks = app(DashboardService::class)->todayTasks($user);

    expect($todayTasks)->toHaveCount(1)
        ->and($todayTasks->first()->title)->toBe('Hyrox Class');
});

it('renders the dashboard with the widget props contract', function () {
    $user = User::factory()->create();

    $this->withoutVite();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('availableWidgets')
            ->has('widgetLayout')
            ->has('widgetData')
            ->has('categories')
            ->has('gettingStarted')
            ->where('canUseDailySummary', true)
            ->where('dailySummaryEnabled', true)
            ->where('dailySummaryTime', '08:00')
            ->where('dailySummary', null)
        );
});

it('surfaces a cached daily summary in the dashboard props', function () {
    $user = User::factory()->create();

    DailySummary::factory()->create([
        'user_id' => $user->id,
        'summary_date' => $user->nowInUserTimezone()->toDateString(),
        'content' => 'Today looks manageable.',
        'provider' => 'anthropic',
        'model' => 'claude-sonnet-5',
    ]);

    $this->withoutVite();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('dailySummary.content', 'Today looks manageable.')
            ->where('dailySummary.provider', 'anthropic')
        );
});

it('refresh endpoint regenerates the summary and redirects back', function () {
    $user = User::factory()->create();

    $this->app->bind(\App\Services\Ai\Contracts\TextGenerator::class, fn () => new class implements \App\Services\Ai\Contracts\TextGenerator
    {
        public function generate(string $system, string $prompt, array $options = []): string
        {
            return 'Fresh summary generated on demand.';
        }
    });

    $this->actingAs($user)
        ->from(route('dashboard'))
        ->post(route('dashboard.summary.refresh'))
        ->assertRedirect();

    $this->assertDatabaseHas('daily_summaries', [
        'user_id' => $user->id,
        'content' => 'Fresh summary generated on demand.',
    ]);
});
