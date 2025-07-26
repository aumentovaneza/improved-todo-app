<?php

namespace App\Repositories\Contracts;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface TagRepositoryInterface
{
    /**
     * Get all tags
     */
    public function getAllTags(array $relations = []): Collection;

    /**
     * Get paginated tags with filters
     */
    public function getPaginatedTags(array $filters = [], int $perPage = 20): LengthAwarePaginator;

    /**
     * Create a new tag
     */
    public function create(array $data): Tag;

    /**
     * Update a tag
     */
    public function update(Tag $tag, array $data): Tag;

    /**
     * Delete a tag
     */
    public function delete(Tag $tag): bool;

    /**
     * Find tag by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Tag;

    /**
     * Find tag by name
     */
    public function findByName(string $name): ?Tag;

    /**
     * Check if tag name exists
     */
    public function nameExists(string $name, ?int $excludeId = null): bool;

    /**
     * Get tags with usage counts
     */
    public function getTagsWithUsageCounts(): Collection;

    /**
     * Get popular tags (most used)
     */
    public function getPopularTags(int $limit = 10): Collection;

    /**
     * Get tags by color
     */
    public function getTagsByColor(string $color): Collection;

    /**
     * Get unused tags
     */
    public function getUnusedTags(): Collection;

    /**
     * Search tags by name
     */
    public function searchByName(string $search, int $limit = 10): Collection;

    /**
     * Get tags used in tasks
     */
    public function getTagsUsedInTasks(): Collection;

    /**
     * Get tags used in categories
     */
    public function getTagsUsedInCategories(): Collection;

    /**
     * First or create tag
     */
    public function firstOrCreate(array $searchAttributes, array $createAttributes = []): Tag;
}
