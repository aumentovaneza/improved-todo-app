<?php

use App\Models\User;
use App\Services\Ai\Contracts\TextGenerator;

function bindFakeCaptureGenerator($app, callable $handler): void
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

beforeEach(function () {
    // Open the beta so a normal (free) user can exercise the happy path.
    config()->set('ai.open_beta.task_capture', true);
});

it('extracts a structured recurring task from natural language', function () {
    $user = User::factory()->create(['role' => 'member']);

    bindFakeCaptureGenerator($this->app, fn () => json_encode([
        'title' => 'Pay rent',
        'description' => null,
        'priority' => 'high',
        'due_date' => null,
        'start_time' => '09:00',
        'end_time' => null,
        'is_all_day' => false,
        'is_recurring' => true,
        'recurrence_type' => 'monthly',
        'recurrence_config' => ['day_of_month' => 1],
        'recurring_until' => null,
        'category_id' => null,
        'tags' => ['home'],
    ]));

    $response = $this->actingAs($user)
        ->postJson(route('tasks.capture'), ['input' => 'pay rent every 1st at 9am, high priority']);

    $response->assertOk();

    $task = $response->json('task');

    expect($task['title'])->toBe('Pay rent')
        ->and($task['priority'])->toBe('high')
        ->and($task['start_time'])->toBe('09:00')
        ->and($task['is_all_day'])->toBeFalse()
        ->and($task['is_recurring'])->toBeTrue()
        ->and($task['recurrence_type'])->toBe('monthly')
        ->and($task['recurrence_config'])->toBe(['day_of_month' => 1])
        ->and($task['recurring_until'])->not->toBeNull()   // defaulted to keep the form submit-ready
        ->and($task['tags'][0]['name'])->toBe('home')
        ->and($task['tags'][0]['is_new'])->toBeTrue();
});

it('returns a friendly 422 when the AI response is not valid JSON', function () {
    $user = User::factory()->create(['role' => 'member']);

    bindFakeCaptureGenerator($this->app, fn () => 'Sorry, I could not parse that.');

    $this->actingAs($user)
        ->postJson(route('tasks.capture'), ['input' => 'do the thing'])
        ->assertStatus(422)
        ->assertJsonStructure(['message']);
});

it('returns a friendly 422 when the provider throws', function () {
    $user = User::factory()->create(['role' => 'member']);

    bindFakeCaptureGenerator($this->app, fn () => throw new RuntimeException('provider down'));

    $this->actingAs($user)
        ->postJson(route('tasks.capture'), ['input' => 'buy milk tomorrow'])
        ->assertStatus(422)
        ->assertJsonStructure(['message']);
});

it('blocks a non-premium user when the feature is not in open beta', function () {
    config()->set('ai.open_beta.task_capture', false);

    $user = User::factory()->create(['role' => 'member']);
    bindFakeCaptureGenerator($this->app, fn () => 'should never run');

    $this->actingAs($user)
        ->postJson(route('tasks.capture'), ['input' => 'buy milk tomorrow'])
        ->assertStatus(403);
});

it('allows a premium (admin) user even when the feature is not in open beta', function () {
    config()->set('ai.open_beta.task_capture', false);

    $user = User::factory()->create(['role' => 'admin']);
    bindFakeCaptureGenerator($this->app, fn () => json_encode([
        'title' => 'Buy milk',
        'priority' => 'medium',
        'is_recurring' => false,
    ]));

    $this->actingAs($user)
        ->postJson(route('tasks.capture'), ['input' => 'buy milk'])
        ->assertOk()
        ->assertJsonPath('task.title', 'Buy milk');
});

it('requires an input string', function () {
    $user = User::factory()->create(['role' => 'member']);

    $this->actingAs($user)
        ->postJson(route('tasks.capture'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('input');
});
