<?php

namespace App\Services;

use App\Services\ActivityLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DatabaseOptimizationService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Analyze query performance
     */
    public function analyzeQueryPerformance(): array
    {
        $analysis = [
            'slow_queries' => $this->getSlowQueries(),
            'query_patterns' => $this->analyzeQueryPatterns(),
            'table_scans' => $this->getFullTableScans(),
            'recommendations' => []
        ];

        // Generate recommendations based on analysis
        $analysis['recommendations'] = $this->generateOptimizationRecommendations($analysis);

        return $analysis;
    }

    /**
     * Check and suggest database indexes
     */
    public function analyzeIndexes(): array
    {
        $indexAnalysis = [
            'missing_indexes' => $this->findMissingIndexes(),
            'unused_indexes' => $this->findUnusedIndexes(),
            'duplicate_indexes' => $this->findDuplicateIndexes(),
            'index_usage_stats' => $this->getIndexUsageStats(),
            'recommendations' => []
        ];

        $indexAnalysis['recommendations'] = $this->generateIndexRecommendations($indexAnalysis);

        return $indexAnalysis;
    }

    /**
     * Optimize database tables
     */
    public function optimizeTables(): array
    {
        $results = [
            'optimized_tables' => [],
            'analyzed_tables' => [],
            'errors' => []
        ];

        $tables = $this->getDatabaseTables();

        foreach ($tables as $table) {
            try {
                // Analyze table
                DB::statement("ANALYZE TABLE {$table}");
                $results['analyzed_tables'][] = $table;

                // Optimize table
                DB::statement("OPTIMIZE TABLE {$table}");
                $results['optimized_tables'][] = $table;

                Log::info("Optimized table: {$table}");
            } catch (\Exception $e) {
                $results['errors'][] = "Failed to optimize {$table}: " . $e->getMessage();
                Log::error("Failed to optimize table {$table}: " . $e->getMessage());
            }
        }

        $this->activityLogService->log(
            'database_optimization',
            'System',
            'tables',
            'Optimized database tables',
            null,
            $results,
            null
        );

        return $results;
    }

    /**
     * Clean up old data
     */
    public function cleanupOldData(int $daysToKeep = 90): array
    {
        $results = [
            'cleaned_tables' => [],
            'records_deleted' => 0,
            'errors' => []
        ];

        $cutoffDate = Carbon::now()->subDays($daysToKeep);

        try {
            // Clean old activity logs
            $deletedLogs = DB::table('activity_logs')
                ->where('created_at', '<', $cutoffDate)
                ->delete();

            if ($deletedLogs > 0) {
                $results['cleaned_tables']['activity_logs'] = $deletedLogs;
                $results['records_deleted'] += $deletedLogs;
            }

            // Clean completed tasks older than cutoff (optional)
            $deletedTasks = DB::table('tasks')
                ->where('status', 'completed')
                ->where('completed_at', '<', $cutoffDate->subDays(30)) // Keep completed tasks longer
                ->delete();

            if ($deletedTasks > 0) {
                $results['cleaned_tables']['old_completed_tasks'] = $deletedTasks;
                $results['records_deleted'] += $deletedTasks;
            }

            // Clean old failed jobs
            $deletedJobs = DB::table('failed_jobs')
                ->where('failed_at', '<', $cutoffDate)
                ->delete();

            if ($deletedJobs > 0) {
                $results['cleaned_tables']['failed_jobs'] = $deletedJobs;
                $results['records_deleted'] += $deletedJobs;
            }

            Log::info("Database cleanup completed", $results);
        } catch (\Exception $e) {
            $results['errors'][] = $e->getMessage();
            Log::error("Database cleanup failed: " . $e->getMessage());
        }

        return $results;
    }

    /**
     * Get database statistics
     */
    public function getDatabaseStats(): array
    {
        try {
            $stats = [
                'database_size' => $this->getDatabaseSize(),
                'table_stats' => $this->getTableStats(),
                'connection_stats' => $this->getConnectionStats(),
                'query_cache_stats' => $this->getQueryCacheStats(),
                'innodb_stats' => $this->getInnoDBStats(),
            ];

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get database stats: ' . $e->getMessage());
            return ['error' => 'Unable to retrieve database statistics'];
        }
    }

    /**
     * Monitor database performance
     */
    public function monitorPerformance(): array
    {
        $performance = [
            'status' => 'healthy',
            'metrics' => [],
            'issues' => [],
            'recommendations' => []
        ];

        try {
            // Check connection count
            $connections = $this->getActiveConnections();
            $performance['metrics']['active_connections'] = $connections;

            if ($connections > 100) {
                $performance['status'] = 'warning';
                $performance['issues'][] = "High connection count: {$connections}";
                $performance['recommendations'][] = "Consider connection pooling or increasing max_connections";
            }

            // Check slow queries
            $slowQueries = $this->getSlowQueryCount();
            $performance['metrics']['slow_queries'] = $slowQueries;

            if ($slowQueries > 10) {
                $performance['status'] = 'warning';
                $performance['issues'][] = "High slow query count: {$slowQueries}";
                $performance['recommendations'][] = "Review and optimize slow queries";
            }

            // Check table locks
            $tableLocks = $this->getTableLockWaits();
            $performance['metrics']['table_lock_waits'] = $tableLocks;

            if ($tableLocks > 5) {
                $performance['status'] = 'critical';
                $performance['issues'][] = "High table lock waits: {$tableLocks}";
                $performance['recommendations'][] = "Review queries causing table locks";
            }

            // Check disk usage
            $diskUsage = $this->getDatabaseSize();
            $performance['metrics']['database_size_mb'] = $diskUsage;

            if ($diskUsage > 10000) { // 10GB
                $performance['status'] = 'warning';
                $performance['issues'][] = "Large database size: {$diskUsage}MB";
                $performance['recommendations'][] = "Consider data archiving or cleanup";
            }
        } catch (\Exception $e) {
            $performance['status'] = 'error';
            $performance['issues'][] = "Failed to monitor performance: " . $e->getMessage();
        }

        return $performance;
    }

    /**
     * Create recommended indexes
     */
    public function createRecommendedIndexes(): array
    {
        $results = [
            'created_indexes' => [],
            'skipped_indexes' => [],
            'errors' => []
        ];

        $recommendations = $this->getIndexRecommendations();

        foreach ($recommendations as $recommendation) {
            try {
                if ($this->indexExists($recommendation['table'], $recommendation['columns'])) {
                    $results['skipped_indexes'][] = $recommendation;
                    continue;
                }

                $indexName = $this->generateIndexName($recommendation['table'], $recommendation['columns']);
                $columns = implode(', ', $recommendation['columns']);

                DB::statement("CREATE INDEX {$indexName} ON {$recommendation['table']} ({$columns})");

                $results['created_indexes'][] = array_merge($recommendation, ['index_name' => $indexName]);
                Log::info("Created index: {$indexName} on {$recommendation['table']}");
            } catch (\Exception $e) {
                $results['errors'][] = "Failed to create index on {$recommendation['table']}: " . $e->getMessage();
                Log::error("Failed to create index: " . $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Vacuum/optimize specific table
     */
    public function optimizeTable(string $tableName): array
    {
        $result = [
            'table' => $tableName,
            'success' => false,
            'stats_before' => [],
            'stats_after' => [],
            'error' => null
        ];

        try {
            // Get stats before optimization
            $result['stats_before'] = $this->getTableStats($tableName);

            // Optimize the table
            DB::statement("OPTIMIZE TABLE {$tableName}");

            // Get stats after optimization
            $result['stats_after'] = $this->getTableStats($tableName);

            $result['success'] = true;
            Log::info("Successfully optimized table: {$tableName}");
        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
            Log::error("Failed to optimize table {$tableName}: " . $e->getMessage());
        }

        return $result;
    }

    // Private helper methods

    private function getSlowQueries(): array
    {
        try {
            // This would require slow query log to be enabled
            // For now, return sample data
            return [
                [
                    'query' => 'SELECT * FROM tasks WHERE user_id = ? AND status = ?',
                    'execution_time' => 2.5,
                    'rows_examined' => 15000,
                    'recommendation' => 'Add composite index on (user_id, status)'
                ],
                [
                    'query' => 'SELECT COUNT(*) FROM activity_logs WHERE created_at > ?',
                    'execution_time' => 1.8,
                    'rows_examined' => 50000,
                    'recommendation' => 'Add index on created_at column'
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get slow queries: ' . $e->getMessage());
            return [];
        }
    }

    private function analyzeQueryPatterns(): array
    {
        // This would analyze actual query logs
        // For now, return common patterns
        return [
            'most_frequent_tables' => ['tasks', 'users', 'categories', 'activity_logs'],
            'common_where_clauses' => ['user_id', 'status', 'created_at', 'due_date'],
            'join_patterns' => ['tasks-categories', 'tasks-users', 'tasks-tags'],
            'order_by_patterns' => ['created_at DESC', 'due_date ASC', 'priority DESC']
        ];
    }

    private function getFullTableScans(): array
    {
        try {
            $result = DB::select("
                SELECT table_name, 
                       ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
            ");

            return array_map(function ($row) {
                return [
                    'table' => $row->table_name,
                    'size_mb' => $row->size_mb,
                    'scan_risk' => $row->size_mb > 100 ? 'high' : ($row->size_mb > 10 ? 'medium' : 'low')
                ];
            }, $result);
        } catch (\Exception $e) {
            Log::error('Failed to analyze table scans: ' . $e->getMessage());
            return [];
        }
    }

    private function findMissingIndexes(): array
    {
        // Common patterns that should have indexes
        return [
            ['table' => 'tasks', 'columns' => ['user_id', 'status'], 'reason' => 'Frequent filtering'],
            ['table' => 'tasks', 'columns' => ['due_date'], 'reason' => 'Date range queries'],
            ['table' => 'activity_logs', 'columns' => ['user_id', 'created_at'], 'reason' => 'User activity queries'],
            ['table' => 'reminders', 'columns' => ['task_id'], 'reason' => 'Foreign key lookups'],
            ['table' => 'subtasks', 'columns' => ['task_id'], 'reason' => 'Foreign key lookups']
        ];
    }

    private function findUnusedIndexes(): array
    {
        try {
            // This would require index usage statistics
            // For now, return potential unused indexes
            return [
                ['table' => 'users', 'index' => 'idx_users_last_login', 'reason' => 'Rarely used in queries'],
            ];
        } catch (\Exception $e) {
            return [];
        }
    }

    private function findDuplicateIndexes(): array
    {
        try {
            $result = DB::select("
                SELECT table_name, 
                       GROUP_CONCAT(index_name) as index_names,
                       GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE()
                GROUP BY table_name, GROUP_CONCAT(column_name ORDER BY seq_in_index)
                HAVING COUNT(*) > 1
            ");

            return array_map(function ($row) {
                return [
                    'table' => $row->table_name,
                    'duplicate_indexes' => explode(',', $row->index_names),
                    'columns' => $row->columns
                ];
            }, $result);
        } catch (\Exception $e) {
            Log::error('Failed to find duplicate indexes: ' . $e->getMessage());
            return [];
        }
    }

    private function getIndexUsageStats(): array
    {
        // This would require performance schema to be enabled
        return [
            'total_indexes' => $this->getTotalIndexCount(),
            'used_indexes' => 0, // Would be calculated from performance schema
            'unused_indexes' => 0,
            'usage_percentage' => 0
        ];
    }

    private function getDatabaseTables(): array
    {
        try {
            $result = DB::select("SHOW TABLES");
            $tableKey = 'Tables_in_' . env('DB_DATABASE');

            return array_map(function ($row) use ($tableKey) {
                return $row->$tableKey;
            }, $result);
        } catch (\Exception $e) {
            Log::error('Failed to get database tables: ' . $e->getMessage());
            return [];
        }
    }

    private function getDatabaseSize(): float
    {
        try {
            $result = DB::selectOne("
                SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            ");

            return $result->size_mb ?? 0;
        } catch (\Exception $e) {
            Log::error('Failed to get database size: ' . $e->getMessage());
            return 0;
        }
    }

    private function getTableStats(?string $tableName = null): array
    {
        try {
            $query = "
                SELECT table_name,
                       table_rows,
                       ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                       ROUND(data_length / 1024 / 1024, 2) AS data_mb,
                       ROUND(index_length / 1024 / 1024, 2) AS index_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            ";

            if ($tableName) {
                $query .= " AND table_name = '{$tableName}'";
            }

            $result = DB::select($query);

            return array_map(function ($row) {
                return [
                    'table' => $row->table_name,
                    'rows' => $row->table_rows,
                    'size_mb' => $row->size_mb,
                    'data_mb' => $row->data_mb,
                    'index_mb' => $row->index_mb
                ];
            }, $result);
        } catch (\Exception $e) {
            Log::error('Failed to get table stats: ' . $e->getMessage());
            return [];
        }
    }

    private function getConnectionStats(): array
    {
        try {
            $result = DB::selectOne("SHOW STATUS LIKE 'Threads_connected'");
            $maxConnections = DB::selectOne("SHOW VARIABLES LIKE 'max_connections'");

            return [
                'active_connections' => $result->Value ?? 0,
                'max_connections' => $maxConnections->Value ?? 0,
                'connection_usage_percent' => round(($result->Value / $maxConnections->Value) * 100, 2)
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get connection stats: ' . $e->getMessage());
            return [];
        }
    }

    private function getQueryCacheStats(): array
    {
        try {
            $stats = DB::select("SHOW STATUS LIKE 'Qcache%'");
            $result = [];

            foreach ($stats as $stat) {
                $result[strtolower($stat->Variable_name)] = $stat->Value;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Failed to get query cache stats: ' . $e->getMessage());
            return [];
        }
    }

    private function getInnoDBStats(): array
    {
        try {
            $stats = DB::select("SHOW ENGINE INNODB STATUS");

            // This would parse the InnoDB status output
            // For now, return basic info
            return [
                'buffer_pool_size' => 'N/A',
                'buffer_pool_hit_rate' => 'N/A',
                'log_waits' => 'N/A'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get InnoDB stats: ' . $e->getMessage());
            return [];
        }
    }

    private function getActiveConnections(): int
    {
        try {
            $result = DB::selectOne("SHOW STATUS LIKE 'Threads_connected'");
            return (int) ($result->Value ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getSlowQueryCount(): int
    {
        try {
            $result = DB::selectOne("SHOW STATUS LIKE 'Slow_queries'");
            return (int) ($result->Value ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function getTableLockWaits(): int
    {
        try {
            $result = DB::selectOne("SHOW STATUS LIKE 'Table_locks_waited'");
            return (int) ($result->Value ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }

    private function generateOptimizationRecommendations(array $analysis): array
    {
        $recommendations = [];

        if (!empty($analysis['slow_queries'])) {
            $recommendations[] = "Review and optimize " . count($analysis['slow_queries']) . " slow queries";
        }

        if (!empty($analysis['table_scans'])) {
            $highRiskScans = array_filter($analysis['table_scans'], function ($scan) {
                return $scan['scan_risk'] === 'high';
            });

            if (!empty($highRiskScans)) {
                $recommendations[] = "Add indexes to tables with high scan risk: " .
                    implode(', ', array_column($highRiskScans, 'table'));
            }
        }

        return $recommendations;
    }

    private function generateIndexRecommendations(array $analysis): array
    {
        $recommendations = [];

        if (!empty($analysis['missing_indexes'])) {
            $recommendations[] = "Create " . count($analysis['missing_indexes']) . " missing indexes for better performance";
        }

        if (!empty($analysis['unused_indexes'])) {
            $recommendations[] = "Consider removing " . count($analysis['unused_indexes']) . " unused indexes";
        }

        if (!empty($analysis['duplicate_indexes'])) {
            $recommendations[] = "Remove " . count($analysis['duplicate_indexes']) . " duplicate indexes";
        }

        return $recommendations;
    }

    private function getIndexRecommendations(): array
    {
        return $this->findMissingIndexes();
    }

    private function indexExists(string $table, array $columns): bool
    {
        try {
            $columnList = implode(',', $columns);
            $result = DB::select("
                SELECT COUNT(*) as count
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = ? 
                AND GROUP_CONCAT(column_name ORDER BY seq_in_index) = ?
                GROUP BY index_name
            ", [$table, $columnList]);

            return !empty($result);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function generateIndexName(string $table, array $columns): string
    {
        $columnStr = implode('_', $columns);
        return "idx_{$table}_{$columnStr}";
    }

    private function getTotalIndexCount(): int
    {
        try {
            $result = DB::selectOne("
                SELECT COUNT(DISTINCT index_name) as count
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE()
                AND index_name != 'PRIMARY'
            ");

            return (int) ($result->count ?? 0);
        } catch (\Exception $e) {
            return 0;
        }
    }
}
