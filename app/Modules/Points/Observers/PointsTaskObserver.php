<?php

namespace App\Modules\Points\Observers;

use App\Models\Task;
use App\Modules\Points\Services\PointsAwardService;

/**
 * Awards / reverses task-completion points off the `completed_at` transition,
 * so it uniformly catches manual toggles, subtask-driven auto-completes, and
 * recurring resets — regardless of which code path changed the task.
 */
class PointsTaskObserver
{
    public function __construct(
        private PointsAwardService $awardService,
    ) {}

    public function updated(Task $task): void
    {
        if (! $task->wasChanged('completed_at')) {
            return;
        }

        if ($task->completed_at !== null) {
            $this->awardService->awardForTask($task);

            return;
        }

        $this->awardService->reverseForTask($task);
    }
}
