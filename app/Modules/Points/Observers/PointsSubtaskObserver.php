<?php

namespace App\Modules\Points\Observers;

use App\Models\Subtask;
use App\Modules\Points\Services\PointsAwardService;

/**
 * Awards / reverses subtask-completion points off the `is_completed`
 * transition. When the last subtask completes the parent task auto-completes
 * too — awarding both subtask and task points is intended.
 */
class PointsSubtaskObserver
{
    public function __construct(
        private PointsAwardService $awardService,
    ) {}

    public function updated(Subtask $subtask): void
    {
        if (! $subtask->wasChanged('is_completed')) {
            return;
        }

        if ($subtask->is_completed) {
            $this->awardService->awardForSubtask($subtask);

            return;
        }

        $this->awardService->reverseForSubtask($subtask);
    }
}
