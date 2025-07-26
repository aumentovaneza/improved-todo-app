<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CacheService;
use App\Services\QueueService;
use App\Services\DatabaseOptimizationService;
use App\Services\MonitoringService;
use Carbon\Carbon;

class SystemOptimization extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:optimize 
                          {--cache : Run cache optimization}
                          {--database : Run database optimization}
                          {--queue : Run queue optimization}
                          {--monitor : Run system monitoring}
                          {--report : Generate monitoring report}
                          {--all : Run all optimizations}';

    /**
     * The console command description.
     */
    protected $description = 'Run system optimization and monitoring tasks';

    public function __construct(
        private CacheService $cacheService,
        private QueueService $queueService,
        private DatabaseOptimizationService $databaseService,
        private MonitoringService $monitoringService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Starting System Optimization...');
        $this->newLine();

        $runAll = $this->option('all');

        if ($this->option('cache') || $runAll) {
            $this->runCacheOptimization();
        }

        if ($this->option('database') || $runAll) {
            $this->runDatabaseOptimization();
        }

        if ($this->option('queue') || $runAll) {
            $this->runQueueOptimization();
        }

        if ($this->option('monitor') || $runAll) {
            $this->runSystemMonitoring();
        }

        if ($this->option('report')) {
            $this->generateMonitoringReport();
        }

        if (
            !$runAll && !$this->option('cache') && !$this->option('database') &&
            !$this->option('queue') && !$this->option('monitor') && !$this->option('report')
        ) {
            $this->showHelp();
        }

        $this->newLine();
        $this->info('✅ System optimization completed!');

        return Command::SUCCESS;
    }

    private function runCacheOptimization(): void
    {
        $this->info('🔄 Running Cache Optimization...');

        try {
            // Get cache statistics
            $this->line('📊 Cache Statistics:');
            $stats = $this->cacheService->getCacheStats();

            if (isset($stats['error'])) {
                $this->error('❌ ' . $stats['error']);
                return;
            }

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Keys', $stats['total_keys'] ?? 'N/A'],
                    ['Memory Usage', $stats['memory_usage'] ?? 'N/A'],
                    ['Hit Rate', ($stats['hit_rate'] ?? 0) . '%'],
                ]
            );

            // Optimize cache
            $this->line('🧹 Optimizing cache...');
            $optimization = $this->cacheService->optimizeCache();

            $this->line("✅ Cleared {$optimization['expired_cleared']} expired keys");
            if (isset($optimization['memory_saved']) && $optimization['memory_saved'] > 0) {
                $this->line("💾 Saved {$optimization['memory_saved']} bytes of memory");
            }

            // Warm up cache for first user (demo)
            if ($userId = \App\Models\User::first()?->id) {
                $this->line('🔥 Warming up cache for user...');
                $warmup = $this->cacheService->warmUpUserCaches($userId);
                $this->line('✅ Cache warmed up successfully');
            }
        } catch (\Exception $e) {
            $this->error('❌ Cache optimization failed: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function runDatabaseOptimization(): void
    {
        $this->info('🗄️  Running Database Optimization...');

        try {
            // Get database statistics
            $this->line('📊 Database Statistics:');
            $stats = $this->databaseService->getDatabaseStats();

            if (isset($stats['error'])) {
                $this->error('❌ ' . $stats['error']);
                return;
            }

            $this->line("📦 Database Size: {$stats['database_size']} MB");

            // Show table statistics
            if (!empty($stats['table_stats'])) {
                $tableData = array_map(function ($table) {
                    return [
                        $table['table'],
                        number_format($table['rows']),
                        $table['size_mb'] . ' MB'
                    ];
                }, array_slice($stats['table_stats'], 0, 5)); // Show top 5 tables

                $this->table(['Table', 'Rows', 'Size'], $tableData);
            }

            // Analyze query performance
            $this->line('🔍 Analyzing query performance...');
            $analysis = $this->databaseService->analyzeQueryPerformance();

            if (!empty($analysis['recommendations'])) {
                $this->line('💡 Recommendations:');
                foreach ($analysis['recommendations'] as $recommendation) {
                    $this->line("  • {$recommendation}");
                }
            }

            // Analyze indexes
            $this->line('📇 Analyzing indexes...');
            $indexAnalysis = $this->databaseService->analyzeIndexes();

            if (!empty($indexAnalysis['missing_indexes'])) {
                $this->line('🔍 Missing indexes found:');
                foreach (array_slice($indexAnalysis['missing_indexes'], 0, 3) as $missing) {
                    $this->line("  • {$missing['table']}: " . implode(', ', $missing['columns']) . " ({$missing['reason']})");
                }
            }

            // Clean up old data
            $this->line('🧹 Cleaning up old data...');
            $cleanup = $this->databaseService->cleanupOldData(90);

            if ($cleanup['records_deleted'] > 0) {
                $this->line("✅ Deleted {$cleanup['records_deleted']} old records");
                foreach ($cleanup['cleaned_tables'] as $table => $count) {
                    $this->line("  • {$table}: {$count} records");
                }
            } else {
                $this->line('✅ No old data to clean up');
            }
        } catch (\Exception $e) {
            $this->error('❌ Database optimization failed: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function runQueueOptimization(): void
    {
        $this->info('⚡ Running Queue Optimization...');

        try {
            // Get queue statistics
            $this->line('📊 Queue Statistics:');
            $stats = $this->queueService->getQueueStats();

            if (isset($stats['error'])) {
                $this->error('❌ ' . $stats['error']);
                return;
            }

            $queueData = [];
            foreach ($stats['queues'] as $queue => $size) {
                $queueData[] = [ucfirst($queue), $size];
            }

            $this->table(['Queue', 'Pending Jobs'], $queueData);

            $this->line("❌ Failed Jobs: {$stats['failed_jobs']}");
            $this->line("⏱️  Avg Processing Time: {$stats['average_processing_time']}s");
            $this->line("📈 Processed Today: {$stats['processed_jobs_today']}");

            // Monitor queue health
            $this->line('🏥 Checking queue health...');
            $health = $this->queueService->monitorQueueHealth();

            $statusEmoji = match ($health['status']) {
                'healthy' => '✅',
                'warning' => '⚠️',
                'critical' => '❌',
                default => '❓'
            };

            $this->line("{$statusEmoji} Queue Status: {$health['status']}");

            if (!empty($health['issues'])) {
                $this->line('⚠️  Issues found:');
                foreach ($health['issues'] as $issue) {
                    $this->line("  • {$issue}");
                }
            }

            if (!empty($health['recommendations'])) {
                $this->line('💡 Recommendations:');
                foreach ($health['recommendations'] as $recommendation) {
                    $this->line("  • {$recommendation}");
                }
            }

            // Demo: Schedule some jobs
            $this->line('📅 Scheduling demo jobs...');

            if ($user = \App\Models\User::first()) {
                $jobId = $this->queueService->queueDailyDigest($user);
                $this->line("✅ Queued daily digest: {$jobId}");

                $jobId = $this->queueService->queueCacheWarmUp($user);
                $this->line("✅ Queued cache warm-up: {$jobId}");
            }
        } catch (\Exception $e) {
            $this->error('❌ Queue optimization failed: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function runSystemMonitoring(): void
    {
        $this->info('🔍 Running System Monitoring...');

        try {
            // Get system health
            $this->line('🏥 System Health Check:');
            $health = $this->monitoringService->getSystemHealth();

            $statusEmoji = match ($health['overall_status']) {
                'healthy' => '✅',
                'warning' => '⚠️',
                'critical' => '❌',
                'error' => '💥',
                default => '❓'
            };

            $this->line("{$statusEmoji} Overall Status: {$health['overall_status']}");
            $this->newLine();

            // Show component health
            $this->line('🔧 Component Health:');
            $componentData = [];
            foreach ($health['components'] as $component => $data) {
                $componentEmoji = match ($data['status']) {
                    'healthy' => '✅',
                    'warning' => '⚠️',
                    'critical' => '❌',
                    'error' => '💥',
                    default => '❓'
                };
                $componentData[] = [ucfirst($component), $componentEmoji . ' ' . $data['status']];
            }

            $this->table(['Component', 'Status'], $componentData);

            // Show system metrics
            if (!empty($health['metrics'])) {
                $this->line('📊 System Metrics:');
                foreach ($health['metrics'] as $metric => $value) {
                    $this->line("  • " . ucwords(str_replace('_', ' ', $metric)) . ": {$value}");
                }
            }

            // Show issues and recommendations
            if (!empty($health['issues'])) {
                $this->line('⚠️  Issues Found:');
                foreach (array_slice($health['issues'], 0, 5) as $issue) {
                    $this->line("  • {$issue}");
                }
            }

            if (!empty($health['recommendations'])) {
                $this->line('💡 Recommendations:');
                foreach (array_slice($health['recommendations'], 0, 5) as $recommendation) {
                    $this->line("  • {$recommendation}");
                }
            }

            // Setup monitoring alerts
            $this->line('🚨 Setting up monitoring alerts...');
            $alerts = $this->monitoringService->setupAlerts();
            $this->line("✅ Configured " . count($alerts['configured_alerts']) . " alert types");
        } catch (\Exception $e) {
            $this->error('❌ System monitoring failed: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function generateMonitoringReport(): void
    {
        $this->info('📊 Generating Monitoring Report...');

        try {
            $startDate = Carbon::now()->subDays(7);
            $endDate = Carbon::now();

            $this->line("📅 Report Period: {$startDate->toDateString()} to {$endDate->toDateString()}");

            $report = $this->monitoringService->generateMonitoringReport($startDate, $endDate);

            // Executive Summary
            $this->line('📋 Executive Summary:');
            $summary = $report['executive_summary'];
            $this->line("  • System Status: {$summary['system_status']}");
            $this->line("  • Uptime: {$summary['uptime_percentage']}%");
            $this->line("  • Total Users: " . number_format($summary['total_users']));
            $this->line("  • Tasks Processed: " . number_format($summary['total_tasks_processed']));
            $this->line("  • Avg Response Time: {$summary['average_response_time']}ms");
            $this->line("  • Error Rate: {$summary['error_rate']}%");

            $this->newLine();

            // Key Achievements
            if (!empty($summary['key_achievements'])) {
                $this->line('🏆 Key Achievements:');
                foreach ($summary['key_achievements'] as $achievement) {
                    $this->line("  • {$achievement}");
                }
                $this->newLine();
            }

            // Areas for Improvement
            if (!empty($summary['areas_for_improvement'])) {
                $this->line('🎯 Areas for Improvement:');
                foreach ($summary['areas_for_improvement'] as $area) {
                    $this->line("  • {$area}");
                }
                $this->newLine();
            }

            // Performance Metrics
            $this->line('⚡ Performance Metrics:');
            $perf = $report['performance'];
            $this->line("  • Average Response Time: {$perf['response_times']['average_response_time']}ms");
            $this->line("  • 95th Percentile: {$perf['response_times']['p95_response_time']}ms");
            $this->line("  • Cache Hit Rate: {$perf['cache_performance']['hit_rate']}%");
            $this->line("  • Database Query Time: {$perf['database_performance']['average_query_time']}ms");

            $this->newLine();

            // Error Analytics
            $this->line('❌ Error Analytics:');
            $errors = $report['errors'];
            $this->line("  • Total Errors: {$errors['total_errors']}");
            $this->line("  • Error Rate: {$errors['error_rate_percent']}%");
            $this->line("  • Critical Errors: {$errors['critical_errors']}");

            $this->newLine();

            // Usage Analytics
            $this->line('👥 Usage Analytics:');
            $usage = $report['usage'];
            $this->line("  • Daily Active Users: " . number_format($usage['active_users']['total']));
            $this->line("  • New Users: " . number_format($usage['active_users']['new_users']));
            $this->line("  • User Growth Rate: {$usage['active_users']['growth_rate']}%");
            $this->line("  • Task Completion Rate: {$usage['conversion_metrics']['task_completion_rate']}%");

            $this->newLine();

            // Recommendations
            if (!empty($report['recommendations'])) {
                $this->line('💡 Recommendations:');
                foreach (array_slice($report['recommendations'], 0, 5) as $recommendation) {
                    $this->line("  • {$recommendation}");
                }
            }

            $this->line("✅ Report generated at: {$report['generated_at']}");
        } catch (\Exception $e) {
            $this->error('❌ Report generation failed: ' . $e->getMessage());
        }

        $this->newLine();
    }

    private function showHelp(): void
    {
        $this->info('📚 System Optimization Help');
        $this->newLine();

        $this->line('Available options:');
        $this->line('  --cache      Run cache optimization');
        $this->line('  --database   Run database optimization');
        $this->line('  --queue      Run queue optimization');
        $this->line('  --monitor    Run system monitoring');
        $this->line('  --report     Generate monitoring report');
        $this->line('  --all        Run all optimizations');

        $this->newLine();

        $this->line('Examples:');
        $this->line('  php artisan system:optimize --all');
        $this->line('  php artisan system:optimize --cache --database');
        $this->line('  php artisan system:optimize --report');
    }
}
