<?php

namespace App\Services;

use App\Models\Tag;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TagService
{
    public function __construct(
        private TagRepositoryInterface $tagRepository,
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get all tags
     */
    public function getAllTags(): Collection
    {
        return $this->tagRepository->getAllTags();
    }

    /**
     * Get paginated tags with filters
     */
    public function getPaginatedTags(array $filters = []): LengthAwarePaginator
    {
        return $this->tagRepository->getPaginatedTags($filters);
    }

    /**
     * Create a new tag with validation and business logic
     */
    public function createTag(array $data): Tag
    {
        return DB::transaction(function () use ($data) {
            // Check if tag name already exists
            if ($this->tagRepository->nameExists($data['name'])) {
                throw new \InvalidArgumentException('A tag with this name already exists.');
            }

            // Set default color if not provided
            $data['color'] = $data['color'] ?? '#6B7280';

            // Create the tag
            $tag = $this->tagRepository->create($data);

            // Log activity
            $this->activityLogService->logTagActivity(
                'create',
                $tag->id,
                $tag->name,
                null,
                $data
            );

            return $tag;
        });
    }

    /**
     * Update an existing tag
     */
    public function updateTag(Tag $tag, array $data): Tag
    {
        return DB::transaction(function () use ($tag, $data) {
            $oldValues = $tag->toArray();

            // Check if tag name already exists (excluding current tag)
            if (isset($data['name']) && $this->tagRepository->nameExists($data['name'], $tag->id)) {
                throw new \InvalidArgumentException('A tag with this name already exists.');
            }

            // Update the tag
            $updatedTag = $this->tagRepository->update($tag, $data);

            // Log activity
            $this->activityLogService->logTagActivity(
                'update',
                $updatedTag->id,
                $updatedTag->name,
                $oldValues,
                $data
            );

            return $updatedTag;
        });
    }

    /**
     * Delete a tag
     */
    public function deleteTag(Tag $tag): bool
    {
        // Check if tag is in use
        $usageCount = $tag->tasks()->count()
            + $tag->categories()->count()
            + $tag->financeTransactions()->count();
        if ($usageCount > 0) {
            throw new \InvalidArgumentException("Cannot delete tag '{$tag->name}'. It is used by {$usageCount} item(s). Please remove the tag from all items first.");
        }

        return DB::transaction(function () use ($tag) {
            $oldValues = $tag->toArray();

            // Log activity before deletion
            $this->activityLogService->logTagActivity(
                'delete',
                $tag->id,
                $tag->name,
                $oldValues,
                null
            );

            return $this->tagRepository->delete($tag);
        });
    }

    /**
     * Find tag by ID
     */
    public function findTag(int $id): ?Tag
    {
        return $this->tagRepository->findWithRelations($id, ['tasks', 'categories', 'financeTransactions']);
    }

    /**
     * Find tag by name
     */
    public function findTagByName(string $name): ?Tag
    {
        return $this->tagRepository->findByName($name);
    }

    /**
     * Get tags with usage counts
     */
    public function getTagsWithUsageCounts(): Collection
    {
        return $this->tagRepository->getTagsWithUsageCounts();
    }

    /**
     * Get popular tags
     */
    public function getPopularTags(int $limit = 10): Collection
    {
        return $this->tagRepository->getPopularTags($limit);
    }

    /**
     * Get unused tags
     */
    public function getUnusedTags(): Collection
    {
        return $this->tagRepository->getUnusedTags();
    }

    /**
     * Search tags by name
     */
    public function searchTags(string $search, int $limit = 10): Collection
    {
        return $this->tagRepository->searchByName($search, $limit);
    }

    /**
     * Get or create tag by name
     */
    public function getOrCreateTag(string $name, array $attributes = []): Tag
    {
        $tag = $this->tagRepository->findByName($name);

        if ($tag) {
            return $tag;
        }

        // Create new tag
        $data = array_merge([
            'name' => $name,
            'color' => '#6B7280',
        ], $attributes);

        return $this->createTag($data);
    }

    /**
     * Process tag data for creation/updating (used by other services)
     */
    public function processTagsData(array $tagsData): array
    {
        $tagIds = [];

        foreach ($tagsData as $tagData) {
            if (!empty($tagData['is_new']) && $tagData['is_new']) {
                // Create new tag
                $tag = $this->tagRepository->firstOrCreate(
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
            } elseif (!empty($tagData['name'])) {
                // Try to find existing tag by name, create if not found
                $tag = $this->getOrCreateTag($tagData['name'], [
                    'color' => $tagData['color'] ?? '#6B7280',
                    'description' => $tagData['description'] ?? null,
                ]);
                $tagIds[] = $tag->id;
            }
        }

        return $tagIds;
    }

    /**
     * Bulk delete unused tags
     */
    public function deleteUnusedTags(): int
    {
        $unusedTags = $this->tagRepository->getUnusedTags();
        $deletedCount = 0;

        DB::transaction(function () use ($unusedTags, &$deletedCount) {
            foreach ($unusedTags as $tag) {
                // Log activity before deletion
                $this->activityLogService->logTagActivity(
                    'bulk_delete',
                    $tag->id,
                    $tag->name,
                    $tag->toArray(),
                    null
                );

                $this->tagRepository->delete($tag);
                $deletedCount++;
            }
        });

        return $deletedCount;
    }

    /**
     * Get tag statistics
     */
    public function getTagStatistics(): array
    {
        $totalTags = Tag::count();
        $usedTags = Tag::whereHas('tasks')
            ->orWhereHas('categories')
            ->orWhereHas('financeTransactions')
            ->count();
        $unusedTags = $totalTags - $usedTags;

        $popularTags = $this->tagRepository->getPopularTags(5);
        $recentTags = Tag::latest()->limit(5)->get();

        return [
            'total_tags' => $totalTags,
            'used_tags' => $usedTags,
            'unused_tags' => $unusedTags,
            'usage_percentage' => $totalTags > 0 ? round(($usedTags / $totalTags) * 100, 2) : 0,
            'popular_tags' => $popularTags,
            'recent_tags' => $recentTags,
        ];
    }

    /**
     * Get tags by color distribution
     */
    public function getTagColorDistribution(): array
    {
        return Tag::selectRaw('color, COUNT(*) as count')
            ->groupBy('color')
            ->orderBy('count', 'desc')
            ->get()
            ->pluck('count', 'color')
            ->toArray();
    }

    /**
     * Merge tags (move all associations from source to target, then delete source)
     */
    public function mergeTags(Tag $sourceTag, Tag $targetTag): bool
    {
        if ($sourceTag->id === $targetTag->id) {
            throw new \InvalidArgumentException('Cannot merge a tag with itself.');
        }

        return DB::transaction(function () use ($sourceTag, $targetTag) {
            // Move task associations
            $sourceTag->tasks()->each(function ($task) use ($targetTag) {
                if (!$task->tags()->where('tag_id', $targetTag->id)->exists()) {
                    $task->tags()->attach($targetTag->id);
                }
            });
            $sourceTag->tasks()->detach();

            // Move category associations
            $sourceTag->categories()->each(function ($category) use ($targetTag) {
                if (!$category->tags()->where('tag_id', $targetTag->id)->exists()) {
                    $category->tags()->attach($targetTag->id);
                }
            });
            $sourceTag->categories()->detach();

            // Move finance transaction associations
            $sourceTag->financeTransactions()->each(function ($transaction) use ($targetTag) {
                if (!$transaction->tags()->where('tag_id', $targetTag->id)->exists()) {
                    $transaction->tags()->attach($targetTag->id);
                }
            });
            $sourceTag->financeTransactions()->detach();

            // Log the merge activity
            $this->activityLogService->logTagActivity(
                'merge',
                $sourceTag->id,
                $sourceTag->name,
                ['merged_into' => $targetTag->name],
                null
            );

            // Delete the source tag
            return $this->tagRepository->delete($sourceTag);
        });
    }
}
