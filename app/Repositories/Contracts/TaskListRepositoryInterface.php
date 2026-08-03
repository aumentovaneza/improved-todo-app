<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Database\Eloquent\Collection;

interface TaskListRepositoryInterface
{
    /**
     * Get all task lists for a user (sorted by decrypted name in PHP).
     */
    public function getTaskListsForUser(int $userId, array $relations = ['items']): Collection;

    /**
     * Get task lists with item + task counts for a user.
     */
    public function getTaskListsWithCounts(int $userId): Collection;

    /**
     * Create a new task list.
     */
    public function create(array $data): TaskList;

    /**
     * Update a task list.
     */
    public function update(TaskList $taskList, array $data): TaskList;

    /**
     * Delete a task list.
     */
    public function delete(TaskList $taskList): bool;

    /**
     * Find task list by ID for specific user.
     */
    public function findForUser(int $id, int $userId, array $relations = []): ?TaskList;

    /**
     * Get a task list with its items and attached tasks.
     */
    public function getTaskListWithContents(int $id, int $userId): ?TaskList;

    /**
     * Check if a task list name exists for the user (PHP decrypt-compare).
     */
    public function nameExistsForUser(string $name, int $userId, ?int $excludeId = null): bool;

    /**
     * Sync attached tasks for the list.
     */
    public function syncTasks(TaskList $taskList, array $taskIds): void;

    /**
     * Attach a single task to the list.
     */
    public function attachTask(TaskList $taskList, Task $task): void;

    /**
     * Detach a single task from the list.
     */
    public function detachTask(TaskList $taskList, Task $task): void;
}
