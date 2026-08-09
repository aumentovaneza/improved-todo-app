<?php

use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;

/**
 * The tasks:reset-recurring command must reset subtasks through an
 * event-firing path so the points observers reverse their completion awards.
 * A bulk relationship update() would skip observers, leaving the award cycle
 * permanently open and blocking future earnings.
 */
it('reverses and re-enables subtask awards when the recurring-reset command runs', function () {
    $user = User::factory()->create();

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Daily recurring',
        'status' => 'completed',
        'position' => 1,
        'is_recurring' => true,
        'recurrence_type' => 'daily',
        'completed_at' => now()->subDay(),
        'recurring_until' => now()->addDay(),
    ]);

    $subtask = Subtask::create([
        'task_id' => $task->id,
        'title' => 'Step',
        'is_completed' => false,
        'position' => 1,
    ]);

    // Earn the subtask award (fires the observer).
    $subtask->update(['is_completed' => true, 'completed_at' => now()->subDay()]);

    $this->artisan('tasks:reset-recurring')->assertExitCode(0);

    $subtask->refresh();
    expect($subtask->is_completed)->toBeFalse();

    $net = PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::SubtaskCompletion->value)
        ->sum('amount');
    expect((int) $net)->toBe(0); // reversed

    // The next occurrence's completion earns again.
    $subtask->update(['is_completed' => true, 'completed_at' => now()]);

    $positiveAwards = PointLedgerEntry::where('user_id', $user->id)
        ->where('source', PointSource::SubtaskCompletion->value)
        ->where('amount', '>', 0)
        ->count();
    expect($positiveAwards)->toBe(2);
});
