<?php

namespace App\Repositories\Eloquent;

use App\Models\Tag;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TagRepository implements TagRepositoryInterface
{
    /**
     * Get all tags
     */
    public function getAllTags(array $relations = []): Collection
    {
        $query = Tag::query();

        if (!empty($relations)) {
            $query->with($relations);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get paginated tags with filters
     */
    public function getPaginatedTags(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Tag::withCount(['tasks', 'categories', 'financeTransactions']);

        $this->applyFilters($query, $filters);

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Create a new tag
     */
    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    /**
     * Update a tag
     */
    public function update(Tag $tag, array $data): Tag
    {
        $tag->update($data);
        return $tag->fresh();
    }

    /**
     * Delete a tag
     */
    public function delete(Tag $tag): bool
    {
        return $tag->delete();
    }

    /**
     * Find tag by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?Tag
    {
        return Tag::with($relations)->find($id);
    }

    /**
     * Find tag by name
     */
    public function findByName(string $name): ?Tag
    {
        return Tag::where('name', $name)->first();
    }

    /**
     * Check if tag name exists
     */
    public function nameExists(string $name, ?int $excludeId = null): bool
    {
        $query = Tag::where('name', $name);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get tags with usage counts
     */
    public function getTagsWithUsageCounts(): Collection
    {
        return Tag::withCount(['tasks', 'categories', 'financeTransactions'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get popular tags (most used)
     */
    public function getPopularTags(int $limit = 10): Collection
    {
        return Tag::withCount(['tasks', 'categories', 'financeTransactions'])
            ->orderByRaw('(tasks_count + categories_count + finance_transactions_count) DESC')
            ->limit($limit)
            ->get();
    }

    /**
     * Get tags by color
     */
    public function getTagsByColor(string $color): Collection
    {
        return Tag::where('color', $color)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get unused tags
     */
    public function getUnusedTags(): Collection
    {
        return Tag::withCount(['tasks', 'categories', 'financeTransactions'])
            ->having('tasks_count', '=', 0)
            ->having('categories_count', '=', 0)
            ->having('finance_transactions_count', '=', 0)
            ->orderBy('name')
            ->get();
    }

    /**
     * Search tags by name
     */
    public function searchByName(string $search, int $limit = 10): Collection
    {
        return Tag::where('name', 'like', "%{$search}%")
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    /**
     * Get tags used in tasks
     */
    public function getTagsUsedInTasks(): Collection
    {
        return Tag::whereHas('tasks')
            ->withCount('tasks')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get tags used in categories
     */
    public function getTagsUsedInCategories(): Collection
    {
        return Tag::whereHas('categories')
            ->withCount('categories')
            ->orderBy('name')
            ->get();
    }

    /**
     * First or create tag
     */
    public function firstOrCreate(array $searchAttributes, array $createAttributes = []): Tag
    {
        return Tag::firstOrCreate($searchAttributes, $createAttributes);
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

        // Filter by color
        if (!empty($filters['color'])) {
            $query->where('color', $filters['color']);
        }

        // Filter by usage
        if (isset($filters['has_usage'])) {
            if ($filters['has_usage']) {
                $query->where(function ($q) {
                    $q->whereHas('tasks')
                        ->orWhereHas('categories')
                        ->orWhereHas('financeTransactions');
                });
            } else {
                $query->whereDoesntHave('tasks')
                    ->whereDoesntHave('categories')
                    ->whereDoesntHave('financeTransactions');
            }
        }

        // Filter by minimum usage count
        if (!empty($filters['min_usage'])) {
            $query->withCount(['tasks', 'categories', 'financeTransactions'])
                ->havingRaw(
                    '(tasks_count + categories_count + finance_transactions_count) >= ?',
                    [$filters['min_usage']]
                );
        }
    }
}
