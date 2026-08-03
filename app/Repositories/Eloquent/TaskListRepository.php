<?php

namespace App\Repositories\Eloquent;

use App\Models\Task;
use App\Models\TaskList;
use App\Repositories\Contracts\TaskListRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class TaskListRepository implements TaskListRepositoryInterface
{
    /**
     * Get all task lists for a user (sorted by decrypted name in PHP).
     */
    public function getTaskListsForUser(int $userId, array $relations = ['items']): Collection
    {
        $taskLists = TaskList::with($relations)
            ->where('user_id', $userId)
            ->get();

        return $this->sortByName($taskLists);
    }

    /**
     * Get task lists with item + task counts for a user.
     */
    public function getTaskListsWithCounts(int $userId): Collection
    {
        $taskLists = TaskList::withCount(['items', 'tasks'])
            ->where('user_id', $userId)
            ->get();

        return $this->sortByName($taskLists);
    }

    /**
     * Create a new task list.
     */
    public function create(array $data): TaskList
    {
        return TaskList::create($data);
    }

    /**
     * Update a task list.
     */
    public function update(TaskList $taskList, array $data): TaskList
    {
        $taskList->update($data);

        return $taskList->fresh();
    }

    /**
     * Delete a task list.
     */
    public function delete(TaskList $taskList): bool
    {
        return $taskList->delete();
    }

    /**
     * Find task list by ID for specific user.
     */
    public function findForUser(int $id, int $userId, array $relations = []): ?TaskList
    {
        return TaskList::with($relations)
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Get a task list with its items and attached tasks.
     */
    public function getTaskListWithContents(int $id, int $userId): ?TaskList
    {
        return TaskList::with([
            'items' => function ($query) {
                $query->orderBy('position');
            },
            'tasks' => function ($query) {
                $query->with(['tags', 'subtasks'])
                    ->withCount([
                        'subtasks',
                        'subtasks as completed_subtasks_count' => function ($query) {
                            $query->where('is_completed', true);
                        },
                    ]);
            },
        ])
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Check if a task list name exists for the user.
     *
     * `task_lists.name` is encrypted, so a SQL equality check would never match.
     * Compare the decrypted names in PHP instead (case-insensitive, mirroring the
     * default MySQL collation).
     */
    public function nameExistsForUser(string $name, int $userId, ?int $excludeId = null): bool
    {
        $needle = mb_strtolower(trim($name));

        return TaskList::where('user_id', $userId)
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->get(['id', 'name'])
            ->contains(fn (TaskList $taskList) => mb_strtolower(trim((string) $taskList->name)) === $needle);
    }

    /**
     * Sync attached tasks for the list.
     */
    public function syncTasks(TaskList $taskList, array $taskIds): void
    {
        $taskList->tasks()->sync($taskIds);
    }

    /**
     * Attach a single task to the list.
     */
    public function attachTask(TaskList $taskList, Task $task): void
    {
        $taskList->tasks()->syncWithoutDetaching([$task->id]);
    }

    /**
     * Detach a single task from the list.
     */
    public function detachTask(TaskList $taskList, Task $task): void
    {
        $taskList->tasks()->detach($task->id);
    }

    /**
     * Sort a task-list collection by decrypted name (case-insensitive, ascending).
     */
    private function sortByName(Collection $taskLists): Collection
    {
        return $taskLists
            ->sortBy(fn (TaskList $taskList) => mb_strtolower(trim((string) $taskList->name)))
            ->values();
    }
}
