<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Models\Tag;
use App\Models\Category;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class TaskService
{
    public function __construct(
        private TaskRepositoryInterface $taskRepository,
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get categorized tasks for index page
     */
    public function getCategorizedTasksForUser(int $userId, array $filters = []): array
    {
        $user = User::findOrFail($userId);
        $categories = Category::where('is_active', true)
            ->where('user_id', $userId)
            ->get();

        $categorizedTasks = [];

        // Handle tasks with categories
        foreach ($categories as $category) {
            $tasks = $this->taskRepository->getPaginatedTasksByCategory(
                $userId,
                $category->id,
                $filters
            );

            $categorizedTasks[] = [
                'category' => $category,
                'tasks' => $tasks
            ];
        }

        // Handle uncategorized tasks
        $uncategorizedTasks = $this->taskRepository->getUncategorizedTasks($userId, $filters);

        if ($uncategorizedTasks->total() > 0) {
            $categorizedTasks[] = [
                'category' => (object) [
                    'id' => null,
                    'name' => 'Uncategorized',
                    'color' => '#6B7280',
                    'is_active' => true
                ],
                'tasks' => $uncategorizedTasks
            ];
        }

        return $categorizedTasks;
    }

    /**
     * Create a new task with validation and business logic
     */
    public function createTask(array $data, int $userId): Task
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate recurring task logic
            if (!empty($data['is_recurring']) && $data['is_recurring']) {
                if (empty($data['recurring_until'])) {
                    throw new \InvalidArgumentException('Recurring until date is required for recurring tasks.');
                }

                if (!empty($data['recurrence_type']) && !in_array($data['recurrence_type'], ['daily', 'weekly', 'monthly', 'yearly'])) {
                    throw new \InvalidArgumentException('Invalid recurrence type.');
                }

                if (Carbon::parse($data['recurring_until'])->isPast()) {
                    throw new \InvalidArgumentException('Recurring until date must be in the future.');
                }
            }

            // Validate time logic
            if (!empty($data['start_time']) && !empty($data['end_time'])) {
                $startTime = Carbon::createFromFormat('H:i', $data['start_time']);
                $endTime = Carbon::createFromFormat('H:i', $data['end_time']);

                if ($startTime->gte($endTime)) {
                    throw new \InvalidArgumentException('Start time must be before end time.');
                }
            }

            // Set user_id and defaults
            $data['user_id'] = $userId;
            $data['status'] = $data['status'] ?? 'pending';
            $data['position'] = $this->getNextPositionForUser($userId);

            // Create the task
            $task = $this->taskRepository->create($data);

            // Handle tags
            if (!empty($data['tags'])) {
                $tagIds = $this->processTaskTags($data['tags']);
                $this->taskRepository->syncTags($task, $tagIds);
            }

            // Log activity
            $this->logActivity('create', $task, null, $data);

            return $task->load(['category', 'subtasks', 'tags']);
        });
    }

    /**
     * Update an existing task
     */
    public function updateTask(Task $task, array $data, int $userId): Task
    {
        // Ensure user owns the task
        if ($task->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to update this task.');
        }

        return DB::transaction(function () use ($task, $data) {
            $oldValues = $task->toArray();

            // Validate recurring task logic (same as create)
            if (!empty($data['is_recurring']) && $data['is_recurring']) {
                if (empty($data['recurring_until'])) {
                    throw new \InvalidArgumentException('Recurring until date is required for recurring tasks.');
                }

                if (!empty($data['recurrence_type']) && !in_array($data['recurrence_type'], ['daily', 'weekly', 'monthly', 'yearly'])) {
                    throw new \InvalidArgumentException('Invalid recurrence type.');
                }

                if (Carbon::parse($data['recurring_until'])->isPast()) {
                    throw new \InvalidArgumentException('Recurring until date must be in the future.');
                }
            }

            // Validate time logic
            if (!empty($data['start_time']) && !empty($data['end_time'])) {
                $startTime = Carbon::createFromFormat('H:i', $data['start_time']);
                $endTime = Carbon::createFromFormat('H:i', $data['end_time']);

                if ($startTime->gte($endTime)) {
                    throw new \InvalidArgumentException('Start time must be before end time.');
                }
            }

            // Update the task
            $updatedTask = $this->taskRepository->update($task, $data);

            // Handle tags
            if (array_key_exists('tags', $data)) {
                $tagIds = !empty($data['tags']) ? $this->processTaskTags($data['tags']) : [];
                $this->taskRepository->syncTags($updatedTask, $tagIds);
            }

            // Log activity
            $this->logActivity('update', $updatedTask, $oldValues, $data);

            return $updatedTask->load(['category', 'subtasks', 'tags']);
        });
    }

    /**
     * Delete a task
     */
    public function deleteTask(Task $task, int $userId): bool
    {
        // Ensure user owns the task
        if ($task->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to delete this task.');
        }

        return DB::transaction(function () use ($task) {
            $oldValues = $task->toArray();

            // Log activity before deletion
            $this->logActivity('delete', $task, $oldValues, null);

            return $this->taskRepository->delete($task);
        });
    }

    /**
     * Reorder tasks
     */
    public function reorderTasks(array $taskIds, int $userId): bool
    {
        // Verify all tasks belong to the user
        $tasks = Task::whereIn('id', $taskIds)->where('user_id', $userId)->get();

        if ($tasks->count() !== count($taskIds)) {
            throw new \InvalidArgumentException('Some tasks do not belong to the user or do not exist.');
        }

        return $this->taskRepository->reorderTasks($taskIds);
    }

    /**
     * Toggle task status
     */
    public function toggleTaskStatus(Task $task, string $status, int $userId): Task
    {
        // Ensure user owns the task
        if ($task->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to update this task.');
        }

        if (!in_array($status, ['pending', 'in_progress', 'completed', 'cancelled'])) {
            throw new \InvalidArgumentException('Invalid task status.');
        }

        $oldStatus = $task->status;
        $updatedTask = $this->taskRepository->toggleStatus($task, $status);

        // Log activity
        $this->logActivity('status_change', $updatedTask, ['status' => $oldStatus], ['status' => $status]);

        return $updatedTask;
    }

    /**
     * Get task statistics for user
     */
    public function getTaskStatsForUser(int $userId): array
    {
        $stats = $this->taskRepository->getTaskStatsForUser($userId);

        // Transform keys to match frontend expectations and add completion rate
        return [
            'total_tasks' => $stats['total'] ?? 0,
            'completed_tasks' => $stats['completed'] ?? 0,
            'pending_tasks' => $stats['pending'] ?? 0,
            'in_progress_tasks' => $stats['in_progress'] ?? 0,
            'overdue_tasks' => $stats['overdue'] ?? 0,
            'due_today_tasks' => $stats['due_today'] ?? 0,
            'completion_rate' => $this->calculateCompletionRate($stats['total'] ?? 0, $stats['completed'] ?? 0),
        ];
    }

    /**
     * Get global task statistics (for admin dashboard)
     */
    public function getGlobalTaskStats(): array
    {
        return [
            'total_tasks' => Task::count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'overdue_tasks' => Task::overdue()->count(),
        ];
    }

    /**
     * Get tasks for calendar view
     */
    public function getTasksForCalendar(int $userId, Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->taskRepository->getTasksInDateRange($userId, $startDate, $endDate);
    }

    /**
     * Get overdue tasks for user
     */
    public function getOverdueTasksForUser(int $userId, int $limit = null): Collection
    {
        $filters = ['overdue' => true, 'status' => 'not_completed'];
        if ($limit) {
            $filters['limit'] = $limit;
        }
        return $this->taskRepository->getTasksForUser($userId, $filters);
    }

    /**
     * Get tasks due today for user
     */
    public function getTodayTasksForUser(int $userId, int $limit = null): Collection
    {
        $user = User::findOrFail($userId);
        $today = $user->todayInUserTimezone()->format('Y-m-d');

        $filters = ['due_date' => $today, 'status' => 'not_completed'];
        if ($limit) {
            $filters['limit'] = $limit;
        }
        return $this->taskRepository->getTasksForUser($userId, $filters);
    }

    /**
     * Get upcoming tasks for user
     */
    public function getUpcomingTasksForUser(int $userId, int $limit = null): Collection
    {
        $user = User::findOrFail($userId);
        $tomorrow = $user->todayInUserTimezone()->addDay()->format('Y-m-d');
        $nextWeek = $user->todayInUserTimezone()->addDays(7)->format('Y-m-d');

        $filters = [
            'due_date_from' => $tomorrow,
            'due_date_to' => $nextWeek,
            'status' => 'not_completed'
        ];
        if ($limit) {
            $filters['limit'] = $limit;
        }
        return $this->taskRepository->getTasksForUser($userId, $filters);
    }

    /**
     * Get in-progress tasks for user
     */
    public function getInProgressTasksForUser(int $userId, int $limit = null): Collection
    {
        $filters = ['status' => 'in_progress'];
        if ($limit) {
            $filters['limit'] = $limit;
        }
        return $this->taskRepository->getTasksForUser($userId, $filters);
    }

    /**
     * Get tasks in a date range for user
     */
    public function getTasksInDateRange(int $userId, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate): Collection
    {
        return $this->taskRepository->getTasksInDateRange($userId, $startDate, $endDate);
    }

    /**
     * Reset recurring tasks (for scheduled command)
     */
    public function resetRecurringTasks(): int
    {
        $recurringTasks = $this->taskRepository->getRecurringTasksForReset();
        $resetCount = 0;

        foreach ($recurringTasks as $task) {
            if ($this->shouldResetRecurringTask($task)) {
                $this->resetRecurringTask($task);
                $resetCount++;
            }
        }

        return $resetCount;
    }

    /**
     * Process task tags (create new ones if needed)
     */
    private function processTaskTags(array $tags): array
    {
        $tagIds = [];

        foreach ($tags as $tagData) {
            if (!empty($tagData['is_new']) && $tagData['is_new']) {
                // Create new tag
                $tag = Tag::firstOrCreate(
                    ['name' => $tagData['name']],
                    [
                        'color' => $tagData['color'] ?? '#6B7280',
                        'description' => $tagData['description'] ?? null,
                    ]
                );
                $tagIds[] = $tag->id;
            } elseif (!empty($tagData['id'])) {
                // Existing tag
                $tagIds[] = $tagData['id'];
            }
        }

        return $tagIds;
    }

    /**
     * Get next position for user's tasks
     */
    private function getNextPositionForUser(int $userId): int
    {
        $maxPosition = Task::where('user_id', $userId)->max('position');
        return ($maxPosition ?? 0) + 1;
    }

    /**
     * Check if recurring task should be reset
     */
    private function shouldResetRecurringTask(Task $task): bool
    {
        if (!$task->is_recurring || !$task->recurring_until || !$task->recurrence_type) {
            return false;
        }

        if ($task->recurring_until->isPast()) {
            return false;
        }

        // Check if enough time has passed based on recurrence type
        $lastCompleted = $task->completed_at ?? $task->updated_at;
        $now = now();

        return match ($task->recurrence_type) {
            'daily' => $lastCompleted->diffInHours($now) >= 24,
            'weekly' => $lastCompleted->diffInDays($now) >= 7,
            'monthly' => $lastCompleted->diffInDays($now) >= 30,
            'yearly' => $lastCompleted->diffInDays($now) >= 365,
            default => false,
        };
    }

    /**
     * Reset a recurring task
     */
    private function resetRecurringTask(Task $task): void
    {
        $this->taskRepository->update($task, [
            'status' => 'pending',
            'completed_at' => null,
        ]);

        // Log activity
        $this->logActivity('recurring_reset', $task, null, ['status' => 'pending']);
    }

    /**
     * Calculate completion rate percentage
     */
    private function calculateCompletionRate(int $total, int $completed): int
    {
        if ($total === 0) {
            return 0;
        }

        return (int) round(($completed / $total) * 100);
    }

    /**
     * Log activity for task operations
     */
    private function logActivity(string $action, Task $task, ?array $oldValues, ?array $newValues): void
    {
        $this->activityLogService->logTaskActivity(
            $action,
            $task->id,
            $task->title,
            $oldValues,
            $newValues,
            Auth::id() ?? $task->user_id
        );
    }
}
