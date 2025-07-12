<?php

namespace App\Repositories\Eloquent;

use App\Models\Task;
use App\Models\User;
use App\Models\Tag;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class TaskRepository implements TaskRepositoryInterface
{
    /**
     * Get all tasks for a user with optional filters
     */
    public function getTasksForUser(int $userId, array $filters = [], array $relations = ['category', 'subtasks', 'tags']): Collection
    {
        $query = Task::with($relations)
            ->where('user_id', $userId)
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ]);

        $this->applyFilters($query, $filters);
        $this->applyDefaultOrdering($query);

        // Apply limit if specified
        if (!empty($filters['limit'])) {
            $query->limit($filters['limit']);
        }

        return $query->get();
    }

    /**
     * Get paginated tasks for a user by category
     */
    public function getPaginatedTasksByCategory(int $userId, ?int $categoryId, array $filters = [], int $perPage = 5): LengthAwarePaginator
    {
        $query = Task::with(['category', 'subtasks', 'tags'])
            ->where('user_id', $userId)
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ]);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $this->applyFilters($query, $filters);
        $this->applyDefaultOrdering($query);

        return $query->paginate($perPage, ['*'], "category_{$categoryId}_page");
    }

    /**
     * Get uncategorized tasks for a user
     */
    public function getUncategorizedTasks(int $userId, array $filters = [], int $perPage = 5): LengthAwarePaginator
    {
        $query = Task::with(['category', 'subtasks', 'tags'])
            ->where('user_id', $userId)
            ->whereNull('category_id')
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ]);

        $this->applyFilters($query, $filters);
        $this->applyDefaultOrdering($query);

        return $query->paginate($perPage, ['*'], 'uncategorized_page');
    }

    /**
     * Create a new task
     */
    public function create(array $data): Task
    {
        return Task::create($data);
    }

    /**
     * Update a task
     */
    public function update(Task $task, array $data): Task
    {
        $task->update($data);
        return $task->fresh();
    }

    /**
     * Delete a task
     */
    public function delete(Task $task): bool
    {
        return $task->delete();
    }

    /**
     * Find task by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Task
    {
        return Task::with($relations)->find($id);
    }

    /**
     * Get overdue tasks for a user
     */
    public function getOverdueTasksForUser(User $user): Collection
    {
        return Task::overdueForUser($user)->get();
    }

    /**
     * Get tasks due today for a user
     */
    public function getTasksDueTodayForUser(User $user): Collection
    {
        return Task::dueTodayForUser($user)->get();
    }

    /**
     * Get tasks in date range with occurrences
     */
    public function getTasksInDateRange(int $userId, Carbon $startDate, Carbon $endDate): Collection
    {
        $tasks = Task::where('user_id', $userId)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('due_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($endDate) {
                        $q->where('is_recurring', true)
                            ->where('recurring_until', '>=', $endDate);
                    });
            })
            ->with(['category', 'tags'])
            ->get();

        // Generate occurrences for recurring tasks
        $allOccurrences = [];
        foreach ($tasks as $task) {
            $occurrences = $task->getOccurrencesInRange($startDate, $endDate);
            $allOccurrences = array_merge($allOccurrences, $occurrences->all());
        }

        // Return as Eloquent Collection
        return new Collection($allOccurrences);
    }

    /**
     * Reorder tasks
     */
    public function reorderTasks(array $taskIds): bool
    {
        foreach ($taskIds as $index => $taskId) {
            Task::where('id', $taskId)->update(['position' => $index + 1]);
        }
        return true;
    }

    /**
     * Toggle task status
     */
    public function toggleStatus(Task $task, string $status): Task
    {
        $updateData = ['status' => $status];

        if ($status === 'completed') {
            $updateData['completed_at'] = now();
        } else {
            $updateData['completed_at'] = null;
        }

        $task->update($updateData);
        return $task->fresh();
    }

    /**
     * Get task statistics for user
     */
    public function getTaskStatsForUser(int $userId): array
    {
        $baseQuery = Task::where('user_id', $userId);

        return [
            'total' => (clone $baseQuery)->count(),
            'completed' => (clone $baseQuery)->where('status', 'completed')->count(),
            'pending' => (clone $baseQuery)->where('status', 'pending')->count(),
            'in_progress' => (clone $baseQuery)->where('status', 'in_progress')->count(),
            'overdue' => (clone $baseQuery)->overdue()->count(),
            'due_today' => (clone $baseQuery)->whereDate('due_date', today())->count(),
        ];
    }

    /**
     * Get recurring tasks that need reset
     */
    public function getRecurringTasksForReset(): Collection
    {
        return Task::where('is_recurring', true)
            ->where('status', 'completed')
            ->whereNotNull('recurring_until')
            ->where('recurring_until', '>=', now())
            ->get();
    }

    /**
     * Attach tags to task
     */
    public function attachTags(Task $task, array $tagIds): void
    {
        $task->tags()->attach($tagIds);
    }

    /**
     * Sync tags for task
     */
    public function syncTags(Task $task, array $tagIds): void
    {
        $task->tags()->sync($tagIds);
    }

    /**
     * Apply filters to query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        // Search functionality
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'not_completed') {
                $query->where('status', '!=', 'completed');
            } else {
                $query->where('status', $filters['status']);
            }
        }

        // Filter by priority
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Filter by overdue tasks
        if (!empty($filters['overdue'])) {
            $query->overdue();
        }

        // Filter by specific due date
        if (!empty($filters['due_date'])) {
            $query->whereDate('due_date', $filters['due_date']);
        }

        // Filter by due date range
        if (!empty($filters['due_date_from'])) {
            $query->whereDate('due_date', '>=', $filters['due_date_from']);
        }

        if (!empty($filters['due_date_to'])) {
            $query->whereDate('due_date', '<=', $filters['due_date_to']);
        }

        // Filter by due date
        if (!empty($filters['due_date_filter'])) {
            $filter = $filters['due_date_filter'];
            switch ($filter) {
                case 'today':
                    $query->whereDate('due_date', Carbon::today());
                    break;
                case 'tomorrow':
                    $query->whereDate('due_date', Carbon::tomorrow());
                    break;
                case 'this_week':
                    $query->whereBetween('due_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'overdue':
                    $query->overdue();
                    break;
            }
        }
    }

    /**
     * Apply default ordering to query
     */
    private function applyDefaultOrdering(Builder $query): void
    {
        $query->orderByRaw("CASE 
                WHEN status = 'in_progress' THEN 1 
                WHEN status = 'pending' THEN 2 
                WHEN status = 'cancelled' THEN 3 
                WHEN status = 'completed' THEN 4 
                ELSE 5 
            END")
            ->orderByRaw("CASE 
                WHEN priority = 'urgent' THEN 1 
                WHEN priority = 'high' THEN 2 
                WHEN priority = 'medium' THEN 3 
                WHEN priority = 'low' THEN 4 
                ELSE 5 
            END")
            ->orderBy('position');
    }
}
