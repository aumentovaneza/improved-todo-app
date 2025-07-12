<?php

namespace App\Repositories\Contracts;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface CategoryRepositoryInterface
{
    /**
     * Get all categories for a user
     */
    public function getCategoriesForUser(int $userId, bool $activeOnly = true, array $relations = ['tags']): Collection;

    /**
     * Get paginated categories for user
     */
    public function getPaginatedCategoriesForUser(int $userId, array $filters = [], int $perPage = 20): LengthAwarePaginator;

    /**
     * Create a new category
     */
    public function create(array $data): Category;

    /**
     * Update a category
     */
    public function update(Category $category, array $data): Category;

    /**
     * Delete a category
     */
    public function delete(Category $category): bool;

    /**
     * Find category by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Category;

    /**
     * Find category by ID for specific user
     */
    public function findForUser(int $id, int $userId, array $relations = []): ?Category;

    /**
     * Get category with tasks for user
     */
    public function getCategoryWithTasks(int $categoryId, int $userId): ?Category;

    /**
     * Check if category name exists for user
     */
    public function nameExistsForUser(string $name, int $userId, ?int $excludeId = null): bool;

    /**
     * Get categories with task counts for user
     */
    public function getCategoriesWithTaskCounts(int $userId): Collection;

    /**
     * Attach tags to category
     */
    public function attachTags(Category $category, array $tagIds): void;

    /**
     * Sync tags for category
     */
    public function syncTags(Category $category, array $tagIds): void;

    /**
     * Get categories by tag
     */
    public function getCategoriesByTag(int $tagId, int $userId): Collection;
}
