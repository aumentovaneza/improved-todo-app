<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Tag;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class CategoryService
{
    public function __construct(
        private CategoryRepositoryInterface $categoryRepository,
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get all categories for a user
     */
    public function getCategoriesForUser(int $userId, bool $activeOnly = true): Collection
    {
        return $this->categoryRepository->getCategoriesForUser($userId, $activeOnly);
    }

    /**
     * Get active categories for user (alias method for clarity)
     */
    public function getActiveCategoriesForUser(int $userId): Collection
    {
        return $this->getCategoriesForUser($userId, true);
    }

    /**
     * Get paginated categories for user
     */
    public function getPaginatedCategoriesForUser(int $userId, array $filters = []): LengthAwarePaginator
    {
        return $this->categoryRepository->getPaginatedCategoriesForUser($userId, $filters);
    }

    /**
     * Create a new category with validation and business logic
     */
    public function createCategory(array $data, int $userId): Category
    {
        return DB::transaction(function () use ($data, $userId) {
            // Check if category name already exists for user
            if ($this->categoryRepository->nameExistsForUser($data['name'], $userId)) {
                throw new \InvalidArgumentException('A category with this name already exists.');
            }

            // Set user_id
            $data['user_id'] = $userId;
            $data['is_active'] = $data['is_active'] ?? true;

            // Create the category
            $category = $this->categoryRepository->create($data);

            // Handle tags
            if (!empty($data['tags'])) {
                $tagIds = $this->processCategoryTags($data['tags']);
                $this->categoryRepository->syncTags($category, $tagIds);
            }

            // Log activity
            $this->activityLogService->logCategoryActivity('create', $category->id, $category->name, null, $data);

            return $category->load(['tags']);
        });
    }

    /**
     * Update an existing category
     */
    public function updateCategory(Category $category, array $data, int $userId): Category
    {
        // Ensure user owns the category
        if ($category->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to update this category.');
        }

        return DB::transaction(function () use ($category, $data) {
            $oldValues = $category->toArray();

            // Check if category name already exists for user (excluding current category)
            if (isset($data['name']) && $this->categoryRepository->nameExistsForUser($data['name'], $category->user_id, $category->id)) {
                throw new \InvalidArgumentException('A category with this name already exists.');
            }

            // Update the category
            $updatedCategory = $this->categoryRepository->update($category, $data);

            // Handle tags
            if (array_key_exists('tags', $data)) {
                $tagIds = !empty($data['tags']) ? $this->processCategoryTags($data['tags']) : [];
                $this->categoryRepository->syncTags($updatedCategory, $tagIds);
            }

            // Log activity
            $this->activityLogService->logCategoryActivity('update', $updatedCategory->id, $updatedCategory->name, $oldValues, $data);

            return $updatedCategory->load(['tags']);
        });
    }

    /**
     * Delete a category
     */
    public function deleteCategory(Category $category, int $userId): bool
    {
        // Ensure user owns the category
        if ($category->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to delete this category.');
        }

        // Check if category has tasks
        $taskCount = $category->tasks()->where('user_id', $userId)->count();
        if ($taskCount > 0) {
            throw new \InvalidArgumentException("Cannot delete category. It contains {$taskCount} task(s). Please move or delete the tasks first.");
        }

        return DB::transaction(function () use ($category) {
            $oldValues = $category->toArray();

            // Log activity before deletion
            $this->activityLogService->logCategoryActivity('delete', $category->id, $category->name, $oldValues, null);

            return $this->categoryRepository->delete($category);
        });
    }

    /**
     * Get category with tasks for user
     */
    public function getCategoryWithTasks(int $categoryId, int $userId): ?Category
    {
        return $this->categoryRepository->getCategoryWithTasks($categoryId, $userId);
    }

    /**
     * Find category for user
     */
    public function findCategoryForUser(int $categoryId, int $userId): ?Category
    {
        return $this->categoryRepository->findForUser($categoryId, $userId, ['tags']);
    }

    /**
     * Get categories with task counts
     */
    public function getCategoriesWithTaskCounts(int $userId): Collection
    {
        return $this->categoryRepository->getCategoriesWithTaskCounts($userId);
    }

    /**
     * Get categories by tag
     */
    public function getCategoriesByTag(int $tagId, int $userId): Collection
    {
        return $this->categoryRepository->getCategoriesByTag($tagId, $userId);
    }

    /**
     * Get global category statistics (for admin dashboard)
     */
    public function getGlobalCategoryStats(): array
    {
        return [
            'total_categories' => Category::count(),
        ];
    }

    /**
     * Deactivate a category (soft delete alternative)
     */
    public function deactivateCategory(Category $category, int $userId): Category
    {
        // Ensure user owns the category
        if ($category->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to deactivate this category.');
        }

        return DB::transaction(function () use ($category) {
            $oldValues = $category->toArray();

            $updatedCategory = $this->categoryRepository->update($category, ['is_active' => false]);

            // Log activity
            $this->activityLogService->logCategoryActivity('deactivate', $updatedCategory->id, $updatedCategory->name, $oldValues, ['is_active' => false]);

            return $updatedCategory;
        });
    }

    /**
     * Reactivate a category
     */
    public function reactivateCategory(Category $category, int $userId): Category
    {
        // Ensure user owns the category
        if ($category->user_id !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to reactivate this category.');
        }

        return DB::transaction(function () use ($category) {
            $oldValues = $category->toArray();

            $updatedCategory = $this->categoryRepository->update($category, ['is_active' => true]);

            // Log activity
            $this->activityLogService->logCategoryActivity('reactivate', $updatedCategory->id, $updatedCategory->name, $oldValues, ['is_active' => true]);

            return $updatedCategory;
        });
    }

    /**
     * Process category tags (create new ones if needed)
     */
    private function processCategoryTags(array $tags): array
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
}
