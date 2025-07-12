<?php

namespace App\Services;

use App\Models\Task;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SearchService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

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

        // Log search activity
        $this->activityLogService->logUserActivity(
            'global_search',
            $userId,
            User::find($userId)->name,
            null,
            [
                'query' => $query,
                'results_count' => array_sum(array_map('count', $searchResults))
            ]
        );

        return $searchResults;
    }

    /**
     * Advanced task search with multiple filters
     */
    public function advancedTaskSearch(int $userId, array $filters): LengthAwarePaginator
    {
        $query = Task::where('user_id', $userId)->with(['category', 'tags', 'subtasks']);

        // Text search
        if (!empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        // Status filter
        if (!empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        // Priority filter
        if (!empty($filters['priority'])) {
            if (is_array($filters['priority'])) {
                $query->whereIn('priority', $filters['priority']);
            } else {
                $query->where('priority', $filters['priority']);
            }
        }

        // Category filter
        if (!empty($filters['category_id'])) {
            if (is_array($filters['category_id'])) {
                $query->whereIn('category_id', $filters['category_id']);
            } else {
                $query->where('category_id', $filters['category_id']);
            }
        }

        // Tags filter
        if (!empty($filters['tags'])) {
            $tagIds = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('tag_id', $tagIds);
            });
        }

        // Date range filters
        if (!empty($filters['created_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['created_from']));
        }
        if (!empty($filters['created_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['created_to'])->endOfDay());
        }
        if (!empty($filters['due_from'])) {
            $query->where('due_date', '>=', $filters['due_from']);
        }
        if (!empty($filters['due_to'])) {
            $query->where('due_date', '<=', $filters['due_to']);
        }

        // Completion date filters
        if (!empty($filters['completed_from'])) {
            $query->where('completed_at', '>=', Carbon::parse($filters['completed_from']));
        }
        if (!empty($filters['completed_to'])) {
            $query->where('completed_at', '<=', Carbon::parse($filters['completed_to'])->endOfDay());
        }

        // Recurring filter
        if (isset($filters['is_recurring'])) {
            $query->where('is_recurring', $filters['is_recurring']);
        }

        // Overdue filter
        if (!empty($filters['is_overdue'])) {
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

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        switch ($sortBy) {
            case 'title':
                $query->orderBy('title', $sortOrder);
                break;
            case 'due_date':
                $query->orderBy('due_date', $sortOrder);
                break;
            case 'priority':
                $priorityOrder = ['urgent', 'high', 'medium', 'low'];
                if ($sortOrder === 'desc') {
                    $priorityOrder = array_reverse($priorityOrder);
                }
                $query->orderByRaw("FIELD(priority, '" . implode("','", $priorityOrder) . "')");
                break;
            case 'status':
                $query->orderBy('status', $sortOrder);
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
        }

        $perPage = $filters['per_page'] ?? 15;
        return $query->paginate($perPage);
    }

    /**
     * Search tasks by text
     */
    public function searchTasks(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 10;

        return Task::where('user_id', $userId)
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->with(['category', 'tags'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Search categories by text
     */
    public function searchCategories(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 10;

        return Category::where('user_id', $userId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            })
            ->with(['tags'])
            ->orderBy('name')
            ->limit($limit)
            ->get();
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
            'tasks' => Task::where('user_id', $userId)
                ->where('title', 'like', "%{$query}%")
                ->select('id', 'title', 'status', 'priority')
                ->limit($limit)
                ->get(),
            'categories' => Category::where('user_id', $userId)
                ->where('name', 'like', "%{$query}%")
                ->select('id', 'name', 'color')
                ->limit($limit)
                ->get(),
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
        // Get recent search terms from activity logs
        $recentSearches = $this->activityLogService->getActivityLogs([
            'user_id' => $userId,
            'action' => 'global_search'
        ], $limit);

        $suggestions = [];
        foreach ($recentSearches as $activity) {
            if (!empty($activity->new_values['query'])) {
                $suggestions[] = $activity->new_values['query'];
            }
        }

        // Get popular task titles and category names
        $popularTasks = Task::where('user_id', $userId)
            ->select('title')
            ->groupBy('title')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(5)
            ->pluck('title')
            ->toArray();

        $popularCategories = Category::where('user_id', $userId)
            ->select('name')
            ->orderBy('name')
            ->limit(5)
            ->pluck('name')
            ->toArray();

        return [
            'recent_searches' => array_unique($suggestions),
            'popular_tasks' => $popularTasks,
            'popular_categories' => $popularCategories,
        ];
    }

    /**
     * Full-text search with relevance scoring
     */
    public function fullTextSearch(int $userId, string $query, array $options = []): Collection
    {
        $limit = $options['limit'] ?? 20;

        // Use MySQL MATCH AGAINST for better full-text search
        // Note: This requires FULLTEXT indexes on the columns
        $tasks = DB::table('tasks')
            ->select('*')
            ->selectRaw("
                MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score
            ", [$query])
            ->where('user_id', $userId)
            ->whereRaw("MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE)", [$query])
            ->orderBy('relevance_score', 'desc')
            ->limit($limit)
            ->get();

        // Convert to Task models
        return Task::hydrate($tasks->toArray())->load(['category', 'tags']);
    }

    /**
     * Search with filters and facets
     */
    public function searchWithFacets(int $userId, array $filters = []): array
    {
        $baseQuery = Task::where('user_id', $userId);

        // Apply filters
        if (!empty($filters['search'])) {
            $baseQuery->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        // Get results
        $results = $baseQuery->with(['category', 'tags'])->get();

        // Calculate facets
        $facets = [
            'status' => $this->calculateStatusFacets($userId, $filters),
            'priority' => $this->calculatePriorityFacets($userId, $filters),
            'categories' => $this->calculateCategoryFacets($userId, $filters),
            'tags' => $this->calculateTagFacets($userId, $filters),
        ];

        return [
            'results' => $results,
            'facets' => $facets,
            'total' => $results->count(),
        ];
    }

    /**
     * Calculate status facets
     */
    private function calculateStatusFacets(int $userId, array $filters): array
    {
        $query = Task::where('user_id', $userId);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Calculate priority facets
     */
    private function calculatePriorityFacets(int $userId, array $filters): array
    {
        $query = Task::where('user_id', $userId);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->groupBy('priority')
            ->selectRaw('priority, COUNT(*) as count')
            ->pluck('count', 'priority')
            ->toArray();
    }

    /**
     * Calculate category facets
     */
    private function calculateCategoryFacets(int $userId, array $filters): array
    {
        $query = Task::where('user_id', $userId)->with('category');

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->groupBy('category_id')
            ->selectRaw('category_id, COUNT(*) as count')
            ->with('category:id,name')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->category->name ?? 'Uncategorized' => $item->count];
            })
            ->toArray();
    }

    /**
     * Calculate tag facets
     */
    private function calculateTagFacets(int $userId, array $filters): array
    {
        $query = Task::where('user_id', $userId);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->join('task_tag', 'tasks.id', '=', 'task_tag.task_id')
            ->join('tags', 'task_tag.tag_id', '=', 'tags.id')
            ->groupBy('tags.id', 'tags.name')
            ->selectRaw('tags.name, COUNT(*) as count')
            ->pluck('count', 'name')
            ->toArray();
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
            'filename' => "tasks_export_" . now()->format('Y-m-d_H-i-s') . ".{$format}",
            'total' => $exportData->count(),
        ];
    }
}
