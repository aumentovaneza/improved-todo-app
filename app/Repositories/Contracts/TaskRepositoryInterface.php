<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

interface TaskRepositoryInterface
{
    /**
     * Get all tasks for a user with optional filters
     */
    public function getTasksForUser(int $userId, array $filters = [], array $relations = ['category', 'subtasks', 'tags']): Collection;

    /**
     * Get paginated tasks for a user by category
     */
    public function getPaginatedTasksByCategory(int $userId, ?int $categoryId, array $filters = [], int $perPage = 5): LengthAwarePaginator;

    /**
     * Get uncategorized tasks for a user
     */
    public function getUncategorizedTasks(int $userId, array $filters = [], int $perPage = 5): LengthAwarePaginator;

    /**
     * Create a new task
     */
    public function create(array $data): Task;

    /**
     * Update a task
     */
    public function update(Task $task, array $data): Task;

    /**
     * Delete a task
     */
    public function delete(Task $task): bool;

    /**
     * Find task by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Task;

    /**
     * Get overdue tasks for a user
     */
    public function getOverdueTasksForUser(User $user): Collection;

    /**
     * Get tasks due today for a user
     */
    public function getTasksDueTodayForUser(User $user): Collection;

    /**
     * Get tasks in date range with occurrences
     */
    public function getTasksInDateRange(int $userId, Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Reorder tasks
     */
    public function reorderTasks(array $taskIds): bool;

    /**
     * Toggle task status
     */
    public function toggleStatus(Task $task, string $status): Task;

    /**
     * Get task statistics for user
     */
    public function getTaskStatsForUser(int $userId): array;

    /**
     * Get recurring tasks that need reset
     */
    public function getRecurringTasksForReset(): Collection;

    /**
     * Attach tags to task
     */
    public function attachTags(Task $task, array $tagIds): void;

    /**
     * Sync tags for task
     */
    public function syncTags(Task $task, array $tagIds): void;
}
