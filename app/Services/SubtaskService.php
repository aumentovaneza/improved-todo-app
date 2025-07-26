<?php

namespace App\Services;

use App\Models\Subtask;
use App\Models\Task;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SubtaskService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get all subtasks for a task
     */
    public function getSubtasksForTask(int $taskId, int $userId): Collection
    {
        return Subtask::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('task_id', $taskId)
            ->orderBy('position')
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Get completed subtasks for a task
     */
    public function getCompletedSubtasksForTask(int $taskId, int $userId): Collection
    {
        return $this->getSubtasksForTask($taskId, $userId)
            ->where('is_completed', true);
    }

    /**
     * Get pending subtasks for a task
     */
    public function getPendingSubtasksForTask(int $taskId, int $userId): Collection
    {
        return $this->getSubtasksForTask($taskId, $userId)
            ->where('is_completed', false);
    }

    /**
     * Create a new subtask with validation
     */
    public function createSubtask(array $data, int $userId): Subtask
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate task ownership
            $task = Task::where('id', $data['task_id'])
                ->where('user_id', $userId)
                ->firstOrFail();

            // Set defaults
            $data['is_completed'] = $data['is_completed'] ?? false;
            $data['position'] = $this->getNextPositionForTask($data['task_id']);

            // Create the subtask
            $subtask = Subtask::create($data);

            // Log activity
            $this->activityLogService->logSubtaskActivity(
                'create',
                $subtask->id,
                $subtask->title,
                null,
                $data,
                $userId
            );

            // Update parent task completion status if needed
            $this->updateParentTaskCompletion($task);

            return $subtask->load('task');
        });
    }

    /**
     * Update an existing subtask
     */
    public function updateSubtask(Subtask $subtask, array $data, int $userId): Subtask
    {
        return DB::transaction(function () use ($subtask, $data, $userId) {
            // Ensure user owns the task associated with this subtask
            if ($subtask->task->user_id !== $userId) {
                throw new \InvalidArgumentException('You do not have permission to update this subtask.');
            }

            $oldValues = $subtask->toArray();
            $wasCompleted = $subtask->is_completed;

            // Update the subtask
            $subtask->update($data);

            // Log activity
            $this->activityLogService->logSubtaskActivity(
                'update',
                $subtask->id,
                $subtask->title,
                $oldValues,
                $data,
                $userId
            );

            // If completion status changed, log specific activity
            if (isset($data['is_completed']) && $data['is_completed'] !== $wasCompleted) {
                $action = $data['is_completed'] ? 'complete' : 'reopen';
                $this->activityLogService->logSubtaskActivity(
                    $action,
                    $subtask->id,
                    $subtask->title,
                    ['is_completed' => $wasCompleted],
                    ['is_completed' => $data['is_completed']],
                    $userId
                );
            }

            // Update parent task completion status if needed
            $this->updateParentTaskCompletion($subtask->task);

            return $subtask->fresh(['task']);
        });
    }

    /**
     * Delete a subtask
     */
    public function deleteSubtask(Subtask $subtask, int $userId): bool
    {
        // Ensure user owns the task associated with this subtask
        if ($subtask->task->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to delete this subtask.');
        }

        return DB::transaction(function () use ($subtask, $userId) {
            $oldValues = $subtask->toArray();
            $task = $subtask->task;

            // Log activity before deletion
            $this->activityLogService->logSubtaskActivity(
                'delete',
                $subtask->id,
                $subtask->title,
                $oldValues,
                null,
                $userId
            );

            $result = $subtask->delete();

            // Update parent task completion status
            $this->updateParentTaskCompletion($task);

            return $result;
        });
    }

    /**
     * Toggle subtask completion status
     */
    public function toggleSubtaskCompletion(Subtask $subtask, int $userId): Subtask
    {
        // Ensure user owns the task associated with this subtask
        if ($subtask->task->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to update this subtask.');
        }

        return DB::transaction(function () use ($subtask, $userId) {
            $wasCompleted = $subtask->is_completed;
            $newStatus = !$wasCompleted;

            $subtask->update(['is_completed' => $newStatus]);

            // Log activity
            $action = $newStatus ? 'complete' : 'reopen';
            $this->activityLogService->logSubtaskActivity(
                $action,
                $subtask->id,
                $subtask->title,
                ['is_completed' => $wasCompleted],
                ['is_completed' => $newStatus],
                $userId
            );

            // Update parent task completion status
            $this->updateParentTaskCompletion($subtask->task);

            return $subtask->fresh(['task']);
        });
    }

    /**
     * Reorder subtasks within a task
     */
    public function reorderSubtasks(array $subtaskIds, int $userId): bool
    {
        return DB::transaction(function () use ($subtaskIds, $userId) {
            // Verify all subtasks belong to the user
            $subtasks = Subtask::whereIn('id', $subtaskIds)
                ->whereHas('task', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->get();

            if ($subtasks->count() !== count($subtaskIds)) {
                throw new \InvalidArgumentException('Some subtasks do not belong to the user or do not exist.');
            }

            // Update positions
            foreach ($subtaskIds as $index => $subtaskId) {
                Subtask::where('id', $subtaskId)->update(['position' => $index + 1]);
            }

            return true;
        });
    }

    /**
     * Create multiple subtasks for a task
     */
    public function createMultipleSubtasks(int $taskId, array $subtasksData, int $userId): Collection
    {
        return DB::transaction(function () use ($taskId, $subtasksData, $userId) {
            // Validate task ownership
            $task = Task::where('id', $taskId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $subtasks = collect();

            foreach ($subtasksData as $subtaskData) {
                $data = array_merge($subtaskData, ['task_id' => $taskId]);
                $subtask = $this->createSubtask($data, $userId);
                $subtasks->push($subtask);
            }

            return $subtasks;
        });
    }

    /**
     * Get subtask statistics for a task
     */
    public function getSubtaskStatsForTask(int $taskId, int $userId): array
    {
        $subtasks = $this->getSubtasksForTask($taskId, $userId);
        $totalSubtasks = $subtasks->count();
        $completedSubtasks = $subtasks->where('is_completed', true)->count();
        $pendingSubtasks = $totalSubtasks - $completedSubtasks;

        return [
            'total_subtasks' => $totalSubtasks,
            'completed_subtasks' => $completedSubtasks,
            'pending_subtasks' => $pendingSubtasks,
            'completion_percentage' => $totalSubtasks > 0 ? round(($completedSubtasks / $totalSubtasks) * 100, 2) : 0,
        ];
    }

    /**
     * Get subtask statistics for a user
     */
    public function getSubtaskStatsForUser(int $userId): array
    {
        $baseQuery = Subtask::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        });

        $totalSubtasks = $baseQuery->count();
        $completedSubtasks = $baseQuery->where('is_completed', true)->count();
        $pendingSubtasks = $totalSubtasks - $completedSubtasks;

        return [
            'total_subtasks' => $totalSubtasks,
            'completed_subtasks' => $completedSubtasks,
            'pending_subtasks' => $pendingSubtasks,
            'completion_percentage' => $totalSubtasks > 0 ? round(($completedSubtasks / $totalSubtasks) * 100, 2) : 0,
        ];
    }

    /**
     * Mark all subtasks as completed for a task
     */
    public function completeAllSubtasksForTask(int $taskId, int $userId): int
    {
        return DB::transaction(function () use ($taskId, $userId) {
            $pendingSubtasks = $this->getPendingSubtasksForTask($taskId, $userId);
            $completedCount = 0;

            foreach ($pendingSubtasks as $subtask) {
                $this->toggleSubtaskCompletion($subtask, $userId);
                $completedCount++;
            }

            return $completedCount;
        });
    }

    /**
     * Mark all subtasks as pending for a task
     */
    public function reopenAllSubtasksForTask(int $taskId, int $userId): int
    {
        return DB::transaction(function () use ($taskId, $userId) {
            $completedSubtasks = $this->getCompletedSubtasksForTask($taskId, $userId);
            $reopenedCount = 0;

            foreach ($completedSubtasks as $subtask) {
                $this->toggleSubtaskCompletion($subtask, $userId);
                $reopenedCount++;
            }

            return $reopenedCount;
        });
    }

    /**
     * Delete all subtasks for a task
     */
    public function deleteAllSubtasksForTask(int $taskId, int $userId): int
    {
        return DB::transaction(function () use ($taskId, $userId) {
            $subtasks = $this->getSubtasksForTask($taskId, $userId);
            $deletedCount = 0;

            foreach ($subtasks as $subtask) {
                $this->deleteSubtask($subtask, $userId);
                $deletedCount++;
            }

            return $deletedCount;
        });
    }

    /**
     * Find subtask by ID with user validation
     */
    public function findSubtaskForUser(int $subtaskId, int $userId): ?Subtask
    {
        return Subtask::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('id', $subtaskId)
            ->with('task')
            ->first();
    }

    /**
     * Get next position for subtask in a task
     */
    private function getNextPositionForTask(int $taskId): int
    {
        $maxPosition = Subtask::where('task_id', $taskId)->max('position');
        return ($maxPosition ?? 0) + 1;
    }

    /**
     * Update parent task completion status based on subtasks
     */
    private function updateParentTaskCompletion(Task $task): void
    {
        $subtaskStats = $this->getSubtaskStatsForTask($task->id, $task->user_id);

        // Only auto-complete task if all subtasks are completed and there are subtasks
        if ($subtaskStats['total_subtasks'] > 0 && $subtaskStats['pending_subtasks'] === 0) {
            // Auto-complete the parent task if it's not already completed
            if ($task->status !== 'completed') {
                $task->update([
                    'status' => 'completed',
                    'completed_at' => now()
                ]);

                // Log the auto-completion
                $this->activityLogService->logTaskActivity(
                    'auto_complete',
                    $task->id,
                    $task->title,
                    ['status' => 'pending'],
                    ['status' => 'completed', 'completed_at' => now()->toDateTimeString()],
                    $task->user_id
                );
            }
        } elseif ($task->status === 'completed' && $subtaskStats['pending_subtasks'] > 0) {
            // Reopen the task if it was completed but now has pending subtasks
            $task->update([
                'status' => 'pending',
                'completed_at' => null
            ]);

            // Log the auto-reopening
            $this->activityLogService->logTaskActivity(
                'auto_reopen',
                $task->id,
                $task->title,
                ['status' => 'completed'],
                ['status' => 'pending', 'completed_at' => null],
                $task->user_id
            );
        }
    }
}
