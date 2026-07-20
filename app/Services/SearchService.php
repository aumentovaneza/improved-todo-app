<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use App\Support\EncryptedSearch;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SearchService
{
    /**
     * Global search across all entities for a user
     */
    public function globalSearch(int $userId, string $query, array $options = []): array
    {
        $searchResults = [
            'tasks' => $this->searchTasks($userId, $query, $options),
            'categories' => $this->searchCategories($userId, $query, $options),
            'tags' => $this->searchTags($query, $options),
        ];

        return $searchResults;
    }

    /**
     * Advanced task search with multiple filters
     */
    public function advancedTaskSearch(int $userId, array $filters): LengthAwarePaginator
    {
        $query = Task::where('user_id', $userId)->with(['category', 'tags', 'subtasks']);

        // Text search is applied in PHP (title/description are encrypted at rest).

        // Status filter
        if (! empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        // Priority filter
        if (! empty($filters['priority'])) {
            if (is_array($filters['priority'])) {
                $query->whereIn('priority', $filters['priority']);
            } else {
                $query->where('priority', $filters['priority']);
            }
        }

        // Category filter
        if (! empty($filters['category_id'])) {
            if (is_array($filters['category_id'])) {
                $query->whereIn('category_id', $filters['category_id']);
            } else {
                $query->where('category_id', $filters['category_id']);
            }
        }

        // Tags filter
        if (! empty($filters['tags'])) {
            $tagIds = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('tag_id', $tagIds);
            });
        }

        // Date range filters
        if (! empty($filters['created_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['created_from']));
        }
        if (! empty($filters['created_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['created_to'])->endOfDay());
        }
        if (! empty($filters['due_from'])) {
            $query->where('due_date', '>=', $filters['due_from']);
        }
        if (! empty($filters['due_to'])) {
            $query->where('due_date', '<=', $filters['due_to']);
        }

        // Completion date filters
        if (! empty($filters['completed_from'])) {
            $query->where('completed_at', '>=', Carbon::parse($filters['completed_from']));
        }
        if (! empty($filters['completed_to'])) {
            $query->where('completed_at', '<=', Carbon::parse($filters['completed_to'])->endOfDay());
        }

        // Recurring filter
        if (isset($filters['is_recurring'])) {
            $query->where('is_recurring', $filters['is_recurring']);
        }

        // Overdue filter
        if (! empty($filters['is_overdue'])) {
            $query->where('due_date', '<', now())
                ->where('status', '!=', 'completed');
        }

        // Has subtasks filter
        if (isset($filters['has_subtasks'])) {
            if ($filters['has_subtasks']) {
                $query->has('subtasks');
            } else {
                $query->doesntHave('subtasks');
            }
        }

        // Sorting. `title` is encrypted, so it can only be ordered in PHP.
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $sortInPhp = $sortBy === 'title';

        if (! $sortInPhp) {
            switch ($sortBy) {
                case 'due_date':
                    $query->orderBy('due_date', $sortOrder);
                    break;
                case 'priority':
                    $priorityOrder = ['urgent', 'high', 'medium', 'low'];
                    if ($sortOrder === 'desc') {
                        $priorityOrder = array_reverse($priorityOrder);
                    }
                    $query->orderByRaw("FIELD(priority, '".implode("','", $priorityOrder)."')");
                    break;
                case 'status':
                    $query->orderBy('status', $sortOrder);
                    break;
                default:
                    $query->orderBy('created_at', $sortOrder);
            }
        }

        $perPage = $filters['per_page'] ?? 15;
        $search = trim((string) ($filters['search'] ?? ''));

        // Fast path: no encrypted predicate/ordering involved.
        if ($search === '' && ! $sortInPhp) {
            return $query->paginate($perPage);
        }

        $results = $query->get();

        if ($search !== '') {
            $results = $results->filter(function (Task $task) use ($search) {
                return EncryptedSearch::matches($task->title, $search)
                    || EncryptedSearch::matches($task->description, $search);
            })->values();
        }

        if ($sortInPhp) {
            $results = $sortOrder === 'desc'
                ? $results->sortByDesc(fn (Task $task) => mb_strtolower((string) $task->title))->values()
                : $results->sortBy(fn (Task $task) => mb_strtolower((string) $task->title))->values();
        }

        return EncryptedSearch::paginate($results, $perPage);
    }

    /**
     * Search tasks by text
     */
    public function searchTasks(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 10;

        // title/description are encrypted, so match in PHP against decrypted values.
        return Task::where('user_id', $userId)
            ->with(['category', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function (Task $task) use ($query) {
                return EncryptedSearch::matches($task->title, $query)
                    || EncryptedSearch::matches($task->description, $query);
            })
            ->take($limit)
            ->values();
    }

    /**
     * Search categories by text
     */
    public function searchCategories(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 10;

        // name/description are encrypted, so match and order in PHP.
        return Category::where('user_id', $userId)
            ->with(['tags'])
            ->get()
            ->filter(function (Category $category) use ($query) {
                return EncryptedSearch::matches($category->name, $query)
                    || EncryptedSearch::matches($category->description, $query);
            })
            ->sortBy(fn (Category $category) => mb_strtolower(trim((string) $category->name)))
            ->take($limit)
            ->values();
    }

    /**
     * Search tags by text
     */
    public function searchTags(string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 10;

        return Tag::where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%");
        })
            ->orderBy('name')
            ->limit($limit)
            ->get();
    }

    /**
     * Quick search for autocomplete/suggestions
     */
    public function quickSearch(int $userId, string $query, int $limit = 5): array
    {
        $results = [
            // title/name are encrypted, so match in PHP against decrypted values.
            'tasks' => Task::where('user_id', $userId)
                ->get(['id', 'title', 'status', 'priority'])
                ->filter(fn (Task $task) => EncryptedSearch::matches($task->title, $query))
                ->take($limit)
                ->values(),
            'categories' => Category::where('user_id', $userId)
                ->get(['id', 'name', 'color'])
                ->filter(fn (Category $category) => EncryptedSearch::matches($category->name, $query))
                ->take($limit)
                ->values(),
            // tags.name is plaintext, so this stays a SQL LIKE.
            'tags' => Tag::where('name', 'like', "%{$query}%")
                ->select('id', 'name', 'color')
                ->limit($limit)
                ->get(),
        ];

        return $results;
    }

    /**
     * Search by date range
     */
    public function searchByDateRange(int $userId, Carbon $startDate, Carbon $endDate, string $dateField = 'created_at'): Collection
    {
        return Task::where('user_id', $userId)
            ->whereBetween($dateField, [$startDate, $endDate])
            ->with(['category', 'tags'])
            ->orderBy($dateField, 'desc')
            ->get();
    }

    /**
     * Search tasks by priority
     */
    public function searchByPriority(int $userId, array $priorities): Collection
    {
        return Task::where('user_id', $userId)
            ->whereIn('priority', $priorities)
            ->with(['category', 'tags'])
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->get();
    }

    /**
     * Search tasks by status
     */
    public function searchByStatus(int $userId, array $statuses): Collection
    {
        return Task::where('user_id', $userId)
            ->whereIn('status', $statuses)
            ->with(['category', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Search tasks by tags
     */
    public function searchByTags(int $userId, array $tagIds): Collection
    {
        return Task::where('user_id', $userId)
            ->whereHas('tags', function ($query) use ($tagIds) {
                $query->whereIn('tag_id', $tagIds);
            })
            ->with(['category', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get search suggestions based on user's search history
     */
    public function getSearchSuggestions(int $userId, int $limit = 10): array
    {
        // Get popular task titles and category names. title/name are encrypted,
        // so aggregation and ordering happen in PHP against decrypted values.
        $popularTasks = Task::where('user_id', $userId)
            ->get(['title'])
            ->pluck('title')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(5)
            ->keys()
            ->values()
            ->all();

        $popularCategories = Category::where('user_id', $userId)
            ->get(['name'])
            ->pluck('name')
            ->filter()
            ->sortBy(fn ($name) => mb_strtolower(trim((string) $name)))
            ->take(5)
            ->values()
            ->all();

        return [
            'recent_searches' => [],
            'popular_tasks' => $popularTasks,
            'popular_categories' => $popularCategories,
        ];
    }

    /**
     * Full-text style search.
     *
     * title/description are encrypted at rest, so MySQL FULLTEXT (MATCH ...
     * AGAINST) cannot be used. This falls back to a case-insensitive substring
     * match against the decrypted values.
     */
    public function fullTextSearch(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 20;

        return Task::where('user_id', $userId)
            ->with(['category', 'tags'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function (Task $task) use ($query) {
                return EncryptedSearch::matches($task->title, $query)
                    || EncryptedSearch::matches($task->description, $query);
            })
            ->take($limit)
            ->values();
    }

    /**
     * Search with filters and facets
     */
    public function searchWithFacets(int $userId, array $filters = []): array
    {
        // The search predicate hits encrypted title/description, so the matched
        // set is resolved in PHP; facet counts are then derived from that set
        // (grouping keys — status/priority/category_id/tags — are plaintext).
        $search = trim((string) ($filters['search'] ?? ''));

        $results = Task::where('user_id', $userId)
            ->with(['category', 'tags'])
            ->get();

        if ($search !== '') {
            $results = $results->filter(function (Task $task) use ($search) {
                return EncryptedSearch::matches($task->title, $search)
                    || EncryptedSearch::matches($task->description, $search);
            })->values();
        }

        $facets = [
            'status' => $results->countBy(fn (Task $task) => $task->status)->toArray(),
            'priority' => $results->countBy(fn (Task $task) => $task->priority)->toArray(),
            'categories' => $results->countBy(fn (Task $task) => $task->category->name ?? 'Uncategorized')->toArray(),
            'tags' => $this->calculateTagFacets($results),
        ];

        return [
            'results' => $results,
            'facets' => $facets,
            'total' => $results->count(),
        ];
    }

    /**
     * Calculate tag facets from an already-resolved task collection.
     */
    private function calculateTagFacets(Collection $tasks): array
    {
        $counts = [];

        foreach ($tasks as $task) {
            foreach ($task->tags as $tag) {
                $counts[$tag->name] = ($counts[$tag->name] ?? 0) + 1;
            }
        }

        return $counts;
    }

    /**
     * Export search results
     */
    public function exportSearchResults(int $userId, array $filters, string $format = 'csv'): array
    {
        $results = $this->advancedTaskSearch($userId, $filters);

        // Convert to export format
        $exportData = $results->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'category' => $task->category->name ?? '',
                'tags' => $task->tags->pluck('name')->implode(', '),
                'due_date' => $task->due_date,
                'created_at' => $task->created_at,
                'completed_at' => $task->completed_at,
            ];
        });

        return [
            'data' => $exportData,
            'format' => $format,
            'filename' => 'tasks_export_'.now()->format('Y-m-d_H-i-s').".{$format}",
            'total' => $exportData->count(),
        ];
    }
}
