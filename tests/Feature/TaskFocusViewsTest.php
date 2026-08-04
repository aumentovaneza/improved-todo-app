<?php

use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;

function focusTask(User $user, string $title, ?string $dueDate, string $status = 'pending'): Task
{
    return Task::create([
        'user_id' => $user->id,
        'title' => $title,
        'priority' => 'medium',
        'status' => $status,
        'position' => 1,
        'due_date' => $dueDate,
        'completed_at' => $status === 'completed' ? now() : null,
    ]);
}

it('defaults to today and separates focus-view counts in the user timezone', function () {
    CarbonImmutable::setTestNow('2026-09-14T16:30:00Z');
    $user = User::factory()->create(['timezone' => 'Asia/Manila']);
    focusTask($user, 'Overdue', '2026-09-14');
    focusTask($user, 'Today', '2026-09-15');
    focusTask($user, 'Upcoming', '2026-09-16');
    focusTask($user, 'Inbox', null);
    focusTask($user, 'Done', '2026-09-15', 'completed');

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tasks/Index')
            ->where('view', 'today')
            ->where('today', '2026-09-15')
            ->has('tasks', 2)
            ->where('taskCounts.today', 2)
            ->where('taskCounts.overdue', 1)
            ->where('taskCounts.upcoming', 1)
            ->where('taskCounts.inbox', 1)
            ->where('taskCounts.completed', 1));
});

it('returns upcoming inbox all and completed focus views', function (string $view, string $expectedTitle) {
    $user = User::factory()->create(['timezone' => 'UTC']);
    CarbonImmutable::setTestNow('2026-09-15T12:00:00Z');
    focusTask($user, 'Today', '2026-09-15');
    focusTask($user, 'Upcoming', '2026-09-16');
    focusTask($user, 'Inbox', null);
    focusTask($user, 'Done', '2026-09-14', 'completed');

    $this->actingAs($user)
        ->get(route('tasks.index', ['view' => $view]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('view', $view)
            ->where('tasks.0.title', $expectedTitle));
})->with([
    ['upcoming', 'Upcoming'],
    ['inbox', 'Inbox'],
    ['completed', 'Done'],
]);

it('keeps encrypted search and filters within the selected focus view', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);
    CarbonImmutable::setTestNow('2026-09-15T12:00:00Z');
    focusTask($user, 'Read private syllabus', '2026-09-20');
    focusTask($user, 'Read private notes', '2026-09-15');

    $this->actingAs($user)
        ->get(route('tasks.index', ['view' => 'upcoming', 'search' => 'syllabus']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks', 1)
            ->where('tasks.0.title', 'Read private syllabus'));
});

it('does not let a legacy status query override a focus view', function () {
    $user = User::factory()->create(['timezone' => 'UTC']);
    focusTask($user, 'Pending task', '2026-09-15');
    focusTask($user, 'Completed task', '2026-09-15', 'completed');

    $this->actingAs($user)
        ->get(route('tasks.index', ['view' => 'completed', 'status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks', 1)
            ->where('tasks.0.title', 'Completed task'));
});

it('applies date filters against the user-local day', function () {
    CarbonImmutable::setTestNow('2026-09-14T16:30:00Z');
    $user = User::factory()->create(['timezone' => 'Asia/Manila']);
    focusTask($user, 'Local today', '2026-09-15');
    focusTask($user, 'Local tomorrow', '2026-09-16');

    $this->actingAs($user)
        ->get(route('tasks.index', ['view' => 'all', 'due_date_filter' => 'tomorrow']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tasks', 1)
            ->where('tasks.0.title', 'Local tomorrow'));
});
