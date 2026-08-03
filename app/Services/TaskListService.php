<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskList;
use App\Repositories\Contracts\TaskListRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class TaskListService
{
    public function __construct(
        private TaskListRepositoryInterface $taskListRepository
    ) {}

    /**
     * Get all task lists for a user.
     */
    public function getTaskListsForUser(int $userId, array $relations = ['items']): Collection
    {
        return $this->taskListRepository->getTaskListsForUser($userId, $relations);
    }

    /**
     * Get task lists with item + task counts for a user.
     */
    public function getTaskListsWithCounts(int $userId): Collection
    {
        return $this->taskListRepository->getTaskListsWithCounts($userId);
    }

    /**
     * Find a task list for a user.
     */
    public function findTaskListForUser(int $taskListId, int $userId): ?TaskList
    {
        return $this->taskListRepository->findForUser($taskListId, $userId, ['items']);
    }

    /**
     * Get a task list with its items and attached tasks.
     */
    public function getTaskListWithContents(int $taskListId, int $userId): ?TaskList
    {
        return $this->taskListRepository->getTaskListWithContents($taskListId, $userId);
    }

    /**
     * Create a new task list with validation and business logic.
     */
    public function createTaskList(array $data, int $userId): TaskList
    {
        return DB::transaction(function () use ($data, $userId) {
            // Check if the task list name already exists for the user
            if ($this->taskListRepository->nameExistsForUser($data['name'], $userId)) {
                throw new \InvalidArgumentException('A list with this name already exists.');
            }

            // Set user_id and next position
            $data['user_id'] = $userId;
            $data['position'] = $this->getNextPositionForUser($userId);

            $taskList = $this->taskListRepository->create($data);

            // Attach tasks (filtered to the user's own tasks)
            if (array_key_exists('tasks', $data)) {
                $taskIds = $this->resolveOwnedTaskIds($data['tasks'] ?? [], $userId);
                $this->taskListRepository->syncTasks($taskList, $taskIds);
            }

            return $taskList->load(['items', 'tasks']);
        });
    }

    /**
     * Update an existing task list.
     */
    public function updateTaskList(TaskList $taskList, array $data, int $userId): TaskList
    {
        // Ensure the user owns the list
        if ($taskList->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to update this list.');
        }

        return DB::transaction(function () use ($taskList, $data, $userId) {
            // Check for a duplicate name (excluding this list)
            if (isset($data['name']) && $this->taskListRepository->nameExistsForUser($data['name'], $userId, $taskList->id)) {
                throw new \InvalidArgumentException('A list with this name already exists.');
            }

            $updatedTaskList = $this->taskListRepository->update($taskList, $data);

            // Sync tasks when provided (filtered to the user's own tasks)
            if (array_key_exists('tasks', $data)) {
                $taskIds = $this->resolveOwnedTaskIds($data['tasks'] ?? [], $userId);
                $this->taskListRepository->syncTasks($updatedTaskList, $taskIds);
            }

            return $updatedTaskList->load(['items', 'tasks']);
        });
    }

    /**
     * Delete a task list. Attached tasks are NOT blocked — the cascade clears the
     * pivot rows and list items while leaving the tasks themselves intact.
     */
    public function deleteTaskList(TaskList $taskList, int $userId): bool
    {
        if ($taskList->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to delete this list.');
        }

        return DB::transaction(function () use ($taskList) {
            return $this->taskListRepository->delete($taskList);
        });
    }

    /**
     * Attach a task to a list, enforcing ownership of BOTH.
     */
    public function attachTask(TaskList $taskList, Task $task, int $userId): void
    {
        $this->assertOwnership($taskList, $task, $userId);

        $this->taskListRepository->attachTask($taskList, $task);
    }

    /**
     * Detach a task from a list, enforcing ownership of BOTH.
     */
    public function detachTask(TaskList $taskList, Task $task, int $userId): void
    {
        $this->assertOwnership($taskList, $task, $userId);

        $this->taskListRepository->detachTask($taskList, $task);
    }

    /**
     * Ensure the user owns both the list and the task.
     */
    private function assertOwnership(TaskList $taskList, Task $task, int $userId): void
    {
        if ($taskList->user_id !== $userId || $task->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to modify this list.');
        }
    }

    /**
     * Filter the given task ids down to those owned by the user.
     *
     * @return array<int, int>
     */
    private function resolveOwnedTaskIds(array $taskIds, int $userId): array
    {
        if (empty($taskIds)) {
            return [];
        }

        return Task::whereIn('id', $taskIds)
            ->where('user_id', $userId)
            ->pluck('id')
            ->all();
    }

    /**
     * Get the next position for the user's lists.
     */
    private function getNextPositionForUser(int $userId): int
    {
        $maxPosition = TaskList::where('user_id', $userId)->max('position');

        return ($maxPosition ?? 0) + 1;
    }
}
