<?php

namespace App\Repositories\Eloquent;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class CategoryRepository implements CategoryRepositoryInterface
{
    /**
     * Get all categories for a user
     */
    public function getCategoriesForUser(int $userId, bool $activeOnly = true, array $relations = ['tags']): Collection
    {
        $query = Category::with($relations)->where('user_id', $userId);

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get paginated categories for user
     */
    public function getPaginatedCategoriesForUser(int $userId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Category::withCount(['tasks' => function ($query) use ($userId) {
            $query->where('user_id', $userId);
        }])
            ->where('user_id', $userId)
            ->where('is_active', true);

        $this->applyFilters($query, $filters);

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Create a new category
     */
    public function create(array $data): Category
    {
        return Category::create($data);
    }

    /**
     * Update a category
     */
    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category->fresh();
    }

    /**
     * Delete a category
     */
    public function delete(Category $category): bool
    {
        return $category->delete();
    }

    /**
     * Find category by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Category
    {
        return Category::with($relations)->find($id);
    }

    /**
     * Find category by ID for specific user
     */
    public function findForUser(int $id, int $userId, array $relations = []): ?Category
    {
        return Category::with($relations)
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Get category with tasks for user
     */
    public function getCategoryWithTasks(int $categoryId, int $userId): ?Category
    {
        return Category::with(['tasks' => function ($query) use ($userId) {
            $query->where('user_id', $userId)
                ->with(['tags', 'subtasks'])
                ->withCount([
                    'subtasks',
                    'subtasks as completed_subtasks_count' => function ($query) {
                        $query->where('is_completed', true);
                    }
                ])
                ->orderByRaw("
                    CASE 
                        WHEN status = 'pending' THEN 1
                        WHEN status = 'in_progress' THEN 2
                        WHEN status = 'completed' THEN 3
                        WHEN status = 'cancelled' THEN 4
                        ELSE 5
                    END
                ")
                ->orderByRaw("
                    CASE priority
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'medium' THEN 3
                        WHEN 'low' THEN 4
                        ELSE 5
                    END
                ")
                ->orderBy('position')
                ->orderBy('created_at', 'desc');
        }, 'tags'])
            ->where('id', $categoryId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Check if category name exists for user
     */
    public function nameExistsForUser(string $name, int $userId, ?int $excludeId = null): bool
    {
        $query = Category::where('name', $name)->where('user_id', $userId);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get categories with task counts for user
     */
    public function getCategoriesWithTaskCounts(int $userId): Collection
    {
        return Category::withCount(['tasks' => function ($query) use ($userId) {
            $query->where('user_id', $userId);
        }])
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Attach tags to category
     */
    public function attachTags(Category $category, array $tagIds): void
    {
        $category->tags()->attach($tagIds);
    }

    /**
     * Sync tags for category
     */
    public function syncTags(Category $category, array $tagIds): void
    {
        $category->tags()->sync($tagIds);
    }

    /**
     * Get categories by tag
     */
    public function getCategoriesByTag(int $tagId, int $userId): Collection
    {
        return Category::whereHas('tags', function ($query) use ($tagId) {
            $query->where('tag_id', $tagId);
        })
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
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
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
