<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Models\Category;
use App\Models\Tag;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CacheService
{
    // Cache TTL constants (in seconds)
    const USER_CACHE_TTL = 3600; // 1 hour
    const TASK_CACHE_TTL = 1800; // 30 minutes
    const CATEGORY_CACHE_TTL = 7200; // 2 hours
    const STATS_CACHE_TTL = 900; // 15 minutes
    const SEARCH_CACHE_TTL = 600; // 10 minutes
    const DASHBOARD_CACHE_TTL = 300; // 5 minutes

    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Cache user's tasks with smart invalidation
     */
    public function cacheUserTasks(int $userId, array $filters = []): string
    {
        $cacheKey = $this->generateTasksCacheKey($userId, $filters);

        if (!Cache::has($cacheKey)) {
            $tasks = $this->fetchUserTasks($userId, $filters);
            Cache::put($cacheKey, $tasks, self::TASK_CACHE_TTL);

            // Track cache miss
            $this->trackCacheMetric('tasks', 'miss', $cacheKey);
        } else {
            // Track cache hit
            $this->trackCacheMetric('tasks', 'hit', $cacheKey);
        }

        return $cacheKey;
    }

    /**
     * Get cached user tasks
     */
    public function getCachedUserTasks(int $userId, array $filters = []): ?array
    {
        $cacheKey = $this->generateTasksCacheKey($userId, $filters);
        $cached = Cache::get($cacheKey);

        if ($cached) {
            $this->trackCacheMetric('tasks', 'hit', $cacheKey);
            return $cached;
        }

        $this->trackCacheMetric('tasks', 'miss', $cacheKey);
        return null;
    }

    /**
     * Cache user dashboard data
     */
    public function cacheDashboardData(int $userId): array
    {
        $cacheKey = "dashboard:user:{$userId}";

        return Cache::remember($cacheKey, self::DASHBOARD_CACHE_TTL, function () use ($userId) {
            $user = User::find($userId);

            return [
                'today_tasks' => $user->tasks()->whereDate('due_date', today())->count(),
                'overdue_tasks' => $user->tasks()
                    ->where('due_date', '<', today())
                    ->where('status', '!=', 'completed')
                    ->count(),
                'completed_today' => $user->tasks()
                    ->whereDate('completed_at', today())
                    ->count(),
                'total_pending' => $user->tasks()->where('status', 'pending')->count(),
                'categories_count' => $user->categories()->count(),
                'recent_activity' => $this->activityLogService->getActivityLogs([
                    'user_id' => $userId,
                    'limit' => 5
                ]),
                'cached_at' => now()->toDateTimeString()
            ];
        });
    }

    /**
     * Cache user statistics
     */
    public function cacheUserStats(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        $cacheKey = "stats:user:{$userId}:" . $startDate->format('Y-m-d') . ':' . $endDate->format('Y-m-d');

        return Cache::remember($cacheKey, self::STATS_CACHE_TTL, function () use ($userId, $startDate, $endDate) {
            $user = User::find($userId);

            return [
                'total_tasks' => $user->tasks()->whereBetween('created_at', [$startDate, $endDate])->count(),
                'completed_tasks' => $user->tasks()
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                'completion_rate' => $this->calculateCompletionRate($user, $startDate, $endDate),
                'productivity_score' => $this->calculateProductivityScore($user, $startDate, $endDate),
                'category_breakdown' => $this->getCategoryBreakdown($user, $startDate, $endDate),
                'priority_distribution' => $this->getPriorityDistribution($user, $startDate, $endDate),
                'cached_at' => now()->toDateTimeString()
            ];
        });
    }

    /**
     * Cache search results
     */
    public function cacheSearchResults(int $userId, string $query, array $filters = []): string
    {
        $cacheKey = $this->generateSearchCacheKey($userId, $query, $filters);

        if (!Cache::has($cacheKey)) {
            // This would be populated by SearchService
            Cache::put($cacheKey, [], self::SEARCH_CACHE_TTL);
            $this->trackCacheMetric('search', 'miss', $cacheKey);
        } else {
            $this->trackCacheMetric('search', 'hit', $cacheKey);
        }

        return $cacheKey;
    }

    /**
     * Cache category data
     */
    public function cacheCategoryData(int $userId): array
    {
        $cacheKey = "categories:user:{$userId}";

        return Cache::remember($cacheKey, self::CATEGORY_CACHE_TTL, function () use ($userId) {
            return Category::where('user_id', $userId)
                ->with(['tags'])
                ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                    $query->where('status', 'completed');
                }])
                ->orderBy('name')
                ->get()
                ->toArray();
        });
    }

    /**
     * Cache popular tags
     */
    public function cachePopularTags(int $limit = 20): array
    {
        $cacheKey = "tags:popular:{$limit}";

        return Cache::remember($cacheKey, self::CATEGORY_CACHE_TTL, function () use ($limit) {
            return Tag::withCount('tasks')
                ->orderBy('tasks_count', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        });
    }

    /**
     * Cache global statistics for admin
     */
    public function cacheGlobalStats(): array
    {
        $cacheKey = "stats:global";

        return Cache::remember($cacheKey, self::STATS_CACHE_TTL, function () {
            return [
                'total_users' => User::count(),
                'active_users_today' => User::whereHas('tasks', function ($query) {
                    $query->whereDate('created_at', today());
                })->count(),
                'total_tasks' => Task::count(),
                'completed_tasks_today' => Task::whereDate('completed_at', today())->count(),
                'total_categories' => Category::count(),
                'total_tags' => Tag::count(),
                'avg_tasks_per_user' => round(Task::count() / max(User::count(), 1), 2),
                'completion_rate_today' => $this->getGlobalCompletionRateToday(),
                'cached_at' => now()->toDateTimeString()
            ];
        });
    }

    /**
     * Invalidate user-related caches
     */
    public function invalidateUserCaches(int $userId): void
    {
        $patterns = [
            "dashboard:user:{$userId}",
            "stats:user:{$userId}:*",
            "categories:user:{$userId}",
            "tasks:user:{$userId}:*",
            "search:user:{$userId}:*"
        ];

        foreach ($patterns as $pattern) {
            if (str_contains($pattern, '*')) {
                $this->invalidateByPattern($pattern);
            } else {
                Cache::forget($pattern);
            }
        }

        // Log cache invalidation
        $this->activityLogService->logUserActivity(
            'cache_invalidated',
            $userId,
            User::find($userId)->name ?? 'Unknown',
            null,
            ['patterns' => $patterns]
        );
    }

    /**
     * Invalidate task-related caches
     */
    public function invalidateTaskCaches(int $userId, ?int $categoryId = null): void
    {
        $patterns = [
            "tasks:user:{$userId}:*",
            "dashboard:user:{$userId}",
            "stats:user:{$userId}:*"
        ];

        if ($categoryId) {
            $patterns[] = "categories:user:{$userId}";
        }

        foreach ($patterns as $pattern) {
            if (str_contains($pattern, '*')) {
                $this->invalidateByPattern($pattern);
            } else {
                Cache::forget($pattern);
            }
        }
    }

    /**
     * Invalidate category-related caches
     */
    public function invalidateCategoryCaches(int $userId): void
    {
        $patterns = [
            "categories:user:{$userId}",
            "stats:user:{$userId}:*",
            "dashboard:user:{$userId}"
        ];

        foreach ($patterns as $pattern) {
            if (str_contains($pattern, '*')) {
                $this->invalidateByPattern($pattern);
            } else {
                Cache::forget($pattern);
            }
        }
    }

    /**
     * Invalidate global caches
     */
    public function invalidateGlobalCaches(): void
    {
        $keys = [
            'stats:global',
            'tags:popular:*'
        ];

        foreach ($keys as $key) {
            if (str_contains($key, '*')) {
                $this->invalidateByPattern($key);
            } else {
                Cache::forget($key);
            }
        }
    }

    /**
     * Warm up caches for user
     */
    public function warmUpUserCaches(int $userId): array
    {
        $results = [];

        try {
            // Warm up dashboard
            $results['dashboard'] = $this->cacheDashboardData($userId);

            // Warm up categories
            $results['categories'] = $this->cacheCategoryData($userId);

            // Warm up recent stats
            $startDate = now()->subDays(30);
            $endDate = now();
            $results['stats'] = $this->cacheUserStats($userId, $startDate, $endDate);

            // Warm up common task filters
            $commonFilters = [
                ['status' => 'pending'],
                ['status' => 'completed'],
                ['priority' => 'high'],
                []  // No filters
            ];

            foreach ($commonFilters as $filters) {
                $cacheKey = $this->cacheUserTasks($userId, $filters);
                $results['tasks'][] = $cacheKey;
            }

            Log::info("Cache warmed up for user {$userId}", $results);
        } catch (\Exception $e) {
            Log::error("Failed to warm up cache for user {$userId}: " . $e->getMessage());
            $results['error'] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        try {
            $redis = Redis::connection();

            return [
                'total_keys' => $redis->dbsize(),
                'memory_usage' => $redis->info('memory')['used_memory_human'] ?? 'N/A',
                'hit_rate' => $this->calculateHitRate(),
                'cache_metrics' => $this->getCacheMetrics(),
                'top_cache_keys' => $this->getTopCacheKeys(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get cache stats: ' . $e->getMessage());
            return ['error' => 'Unable to retrieve cache statistics'];
        }
    }

    /**
     * Clear expired caches
     */
    public function clearExpiredCaches(): int
    {
        $cleared = 0;

        try {
            $redis = Redis::connection();
            $keys = $redis->keys('*');

            foreach ($keys as $key) {
                $ttl = $redis->ttl($key);
                if ($ttl === -1) { // No expiration set
                    continue;
                }
                if ($ttl <= 0) { // Expired
                    $redis->del($key);
                    $cleared++;
                }
            }

            Log::info("Cleared {$cleared} expired cache keys");
        } catch (\Exception $e) {
            Log::error('Failed to clear expired caches: ' . $e->getMessage());
        }

        return $cleared;
    }

    /**
     * Optimize cache performance
     */
    public function optimizeCache(): array
    {
        $results = [
            'expired_cleared' => $this->clearExpiredCaches(),
            'memory_before' => $this->getMemoryUsage(),
        ];

        try {
            // Clear low-value caches (old search results, etc.)
            $this->clearLowValueCaches();

            // Compress large cache entries
            $results['compressed'] = $this->compressLargeCaches();

            $results['memory_after'] = $this->getMemoryUsage();
            $results['memory_saved'] = $results['memory_before'] - $results['memory_after'];
        } catch (\Exception $e) {
            Log::error('Cache optimization failed: ' . $e->getMessage());
            $results['error'] = $e->getMessage();
        }

        return $results;
    }

    // Private helper methods

    private function generateTasksCacheKey(int $userId, array $filters): string
    {
        $filterHash = md5(serialize($filters));
        return "tasks:user:{$userId}:filters:{$filterHash}";
    }

    private function generateSearchCacheKey(int $userId, string $query, array $filters): string
    {
        $filterHash = md5(serialize($filters));
        $queryHash = md5($query);
        return "search:user:{$userId}:query:{$queryHash}:filters:{$filterHash}";
    }

    private function fetchUserTasks(int $userId, array $filters): array
    {
        $query = Task::where('user_id', $userId)->with(['category', 'tags']);

        // Apply filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $query->orderBy('created_at', 'desc')->get()->toArray();
    }

    private function invalidateByPattern(string $pattern): void
    {
        try {
            $redis = Redis::connection();
            $keys = $redis->keys($pattern);

            if (!empty($keys)) {
                $redis->del($keys);
            }
        } catch (\Exception $e) {
            Log::error("Failed to invalidate cache pattern {$pattern}: " . $e->getMessage());
        }
    }

    private function trackCacheMetric(string $type, string $result, string $key): void
    {
        try {
            $redis = Redis::connection();
            $metricKey = "cache_metrics:{$type}:{$result}";
            $redis->incr($metricKey);
            $redis->expire($metricKey, 86400); // 24 hours
        } catch (\Exception $e) {
            Log::error("Failed to track cache metric: " . $e->getMessage());
        }
    }

    private function calculateHitRate(): float
    {
        try {
            $redis = Redis::connection();
            $hits = (int) ($redis->get('cache_metrics:*:hit') ?? 0);
            $misses = (int) ($redis->get('cache_metrics:*:miss') ?? 0);

            $total = $hits + $misses;
            return $total > 0 ? round(($hits / $total) * 100, 2) : 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getCacheMetrics(): array
    {
        try {
            $redis = Redis::connection();
            $metrics = [];

            $keys = $redis->keys('cache_metrics:*');
            foreach ($keys as $key) {
                $metrics[$key] = $redis->get($key);
            }

            return $metrics;
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getTopCacheKeys(int $limit = 10): array
    {
        try {
            $redis = Redis::connection();
            $keys = $redis->keys('*');

            $keyData = [];
            foreach (array_slice($keys, 0, 100) as $key) { // Sample first 100 keys
                $size = strlen($redis->get($key) ?? '');
                $ttl = $redis->ttl($key);
                $keyData[] = [
                    'key' => $key,
                    'size' => $size,
                    'ttl' => $ttl
                ];
            }

            // Sort by size descending
            usort($keyData, function ($a, $b) {
                return $b['size'] <=> $a['size'];
            });

            return array_slice($keyData, 0, $limit);
        } catch (\Exception $e) {
            return [];
        }
    }

    private function getMemoryUsage(): int
    {
        try {
            $redis = Redis::connection();
            $info = $redis->info('memory');
            return (int) ($info['used_memory'] ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function clearLowValueCaches(): void
    {
        try {
            $redis = Redis::connection();

            // Clear old search caches (older than 1 hour)
            $searchKeys = $redis->keys('search:*');
            foreach ($searchKeys as $key) {
                $ttl = $redis->ttl($key);
                if ($ttl < 3000) { // Less than 50 minutes remaining
                    $redis->del($key);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to clear low-value caches: ' . $e->getMessage());
        }
    }

    private function compressLargeCaches(): int
    {
        // Placeholder for cache compression logic
        // In a real implementation, you might compress large JSON strings
        return 0;
    }

    // Helper methods for statistics
    private function calculateCompletionRate(User $user, Carbon $startDate, Carbon $endDate): float
    {
        $total = $user->tasks()->whereBetween('created_at', [$startDate, $endDate])->count();
        $completed = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    }

    private function calculateProductivityScore(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $completionRate = $this->calculateCompletionRate($user, $startDate, $endDate);
        $overdueTasks = $user->tasks()
            ->where('due_date', '<', $endDate)
            ->where('status', '!=', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $totalTasks = $user->tasks()->whereBetween('created_at', [$startDate, $endDate])->count();
        $overduePenalty = $totalTasks > 0 ? min(($overdueTasks / $totalTasks) * 50, 50) : 0;

        return max(0, min(100, intval($completionRate - $overduePenalty)));
    }

    private function getCategoryBreakdown(User $user, Carbon $startDate, Carbon $endDate): array
    {
        return $user->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->join('categories', 'tasks.category_id', '=', 'categories.id')
            ->groupBy('categories.id', 'categories.name')
            ->selectRaw('categories.name, COUNT(*) as count')
            ->pluck('count', 'name')
            ->toArray();
    }

    private function getPriorityDistribution(User $user, Carbon $startDate, Carbon $endDate): array
    {
        return $user->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('priority')
            ->selectRaw('priority, COUNT(*) as count')
            ->pluck('count', 'priority')
            ->toArray();
    }

    private function getGlobalCompletionRateToday(): float
    {
        $totalToday = Task::whereDate('created_at', today())->count();
        $completedToday = Task::whereDate('completed_at', today())->count();

        return $totalToday > 0 ? round(($completedToday / $totalToday) * 100, 2) : 0;
    }
}
