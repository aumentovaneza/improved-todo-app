<?php

namespace App\Services;

use App\Models\ListItem;
use App\Models\TaskList;
use Illuminate\Support\Facades\DB;

class ListItemService
{
    /**
     * Create a new list item, validating ownership of the parent list.
     */
    public function createItem(array $data, int $userId): ListItem
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate list ownership
            TaskList::where('id', $data['task_list_id'])
                ->where('user_id', $userId)
                ->firstOrFail();

            $data['is_completed'] = $data['is_completed'] ?? false;
            $data['position'] = $this->getNextPositionForList($data['task_list_id']);

            $item = ListItem::create($data);

            return $item->load('taskList');
        });
    }

    /**
     * Update an existing list item.
     */
    public function updateItem(ListItem $item, array $data, int $userId): ListItem
    {
        return DB::transaction(function () use ($item, $data, $userId) {
            if ($item->taskList->user_id !== $userId) {
                throw new \InvalidArgumentException('You do not have permission to update this item.');
            }

            // Keep completed_at consistent when is_completed is explicitly set.
            if (array_key_exists('is_completed', $data)) {
                $data['completed_at'] = $data['is_completed'] ? ($item->completed_at ?? now()) : null;
            }

            $item->update($data);

            return $item->fresh(['taskList']);
        });
    }

    /**
     * Delete a list item.
     */
    public function deleteItem(ListItem $item, int $userId): bool
    {
        if ($item->taskList->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to delete this item.');
        }

        return DB::transaction(function () use ($item) {
            return $item->delete();
        });
    }

    /**
     * Toggle a list item's completion status.
     */
    public function toggleItem(ListItem $item, int $userId): ListItem
    {
        if ($item->taskList->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to update this item.');
        }

        return DB::transaction(function () use ($item) {
            $newStatus = ! $item->is_completed;

            $item->update([
                'is_completed' => $newStatus,
                'completed_at' => $newStatus ? now() : null,
            ]);

            return $item->fresh(['taskList']);
        });
    }

    /**
     * Reorder items within a list.
     */
    public function reorderItems(array $itemIds, int $userId): bool
    {
        return DB::transaction(function () use ($itemIds, $userId) {
            // Verify all items belong to the user (via their parent list)
            $items = ListItem::whereIn('id', $itemIds)
                ->whereHas('taskList', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->get();

            if ($items->count() !== count($itemIds)) {
                throw new \InvalidArgumentException('Some items do not belong to the user or do not exist.');
            }

            foreach ($itemIds as $index => $itemId) {
                ListItem::where('id', $itemId)->update(['position' => $index + 1]);
            }

            return true;
        });
    }

    /**
     * Get the next position for an item within a list.
     */
    private function getNextPositionForList(int $taskListId): int
    {
        $maxPosition = ListItem::where('task_list_id', $taskListId)->max('position');

        return ($maxPosition ?? 0) + 1;
    }
}
