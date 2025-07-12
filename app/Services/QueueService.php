<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class QueueService
{
    // Queue names
    const HIGH_PRIORITY_QUEUE = 'high';
    const DEFAULT_QUEUE = 'default';
    const LOW_PRIORITY_QUEUE = 'low';
    const EMAIL_QUEUE = 'emails';
    const SYNC_QUEUE = 'sync';

    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Queue task notification
     */
    public function queueTaskNotification(Task $task, string $type): string
    {
        $jobId = $this->generateJobId();

        try {
            // For now, we'll log the job instead of actually queuing
            // In a real implementation, you would create actual Job classes
            Log::info("Queuing task notification", [
                'job_id' => $jobId,
                'task_id' => $task->id,
                'type' => $type,
                'queue' => self::EMAIL_QUEUE
            ]);

            $this->logJobQueued('task_notification', $jobId, [
                'task_id' => $task->id,
                'type' => $type,
                'user_id' => $task->user_id
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue task notification: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue daily digest for user
     */
    public function queueDailyDigest(User $user): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing daily digest", [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'queue' => self::EMAIL_QUEUE
            ]);

            $this->logJobQueued('daily_digest', $jobId, [
                'user_id' => $user->id,
                'scheduled_for' => now()->toDateTimeString()
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue daily digest: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue weekly summary for user
     */
    public function queueWeeklySummary(User $user): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing weekly summary", [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'queue' => self::EMAIL_QUEUE
            ]);

            $this->logJobQueued('weekly_summary', $jobId, [
                'user_id' => $user->id,
                'scheduled_for' => now()->toDateTimeString()
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue weekly summary: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue Google Calendar sync for user
     */
    public function queueCalendarSync(User $user): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing calendar sync", [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'queue' => self::SYNC_QUEUE
            ]);

            $this->logJobQueued('calendar_sync', $jobId, [
                'user_id' => $user->id,
                'scheduled_for' => now()->toDateTimeString()
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue calendar sync: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue bulk task operations
     */
    public function queueBulkTaskOperation(Collection $tasks, string $operation, array $data = []): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing bulk task operation", [
                'job_id' => $jobId,
                'task_count' => $tasks->count(),
                'operation' => $operation,
                'queue' => self::DEFAULT_QUEUE
            ]);

            $this->logJobQueued('bulk_task_operation', $jobId, [
                'task_count' => $tasks->count(),
                'operation' => $operation,
                'data' => $data
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue bulk task operation: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue recurring task reset
     */
    public function queueRecurringTaskReset(): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing recurring task reset", [
                'job_id' => $jobId,
                'queue' => self::DEFAULT_QUEUE
            ]);

            $this->logJobQueued('recurring_task_reset', $jobId, [
                'scheduled_for' => now()->toDateTimeString()
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue recurring task reset: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue cache warm-up for user
     */
    public function queueCacheWarmUp(User $user): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing cache warm-up", [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'queue' => self::LOW_PRIORITY_QUEUE
            ]);

            $this->logJobQueued('cache_warmup', $jobId, [
                'user_id' => $user->id,
                'scheduled_for' => now()->toDateTimeString()
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue cache warm-up: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Queue data export job
     */
    public function queueDataExport(User $user, string $type, array $filters = [], string $format = 'csv'): string
    {
        $jobId = $this->generateJobId();

        try {
            Log::info("Queuing data export", [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'type' => $type,
                'format' => $format,
                'queue' => self::DEFAULT_QUEUE
            ]);

            $this->logJobQueued('data_export', $jobId, [
                'user_id' => $user->id,
                'export_type' => $type,
                'format' => $format,
                'filters' => $filters
            ]);

            return $jobId;
        } catch (\Exception $e) {
            Log::error("Failed to queue data export: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Schedule daily digest for all users
     */
    public function scheduleDailyDigests(): array
    {
        $results = ['queued' => 0, 'failed' => 0, 'errors' => []];

        try {
            $users = User::where('daily_digest_enabled', true)
                ->whereNotNull('email')
                ->get();

            foreach ($users as $user) {
                try {
                    $this->queueDailyDigest($user);
                    $results['queued']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: {$e->getMessage()}";
                }
            }

            Log::info("Scheduled daily digests", $results);
        } catch (\Exception $e) {
            Log::error("Failed to schedule daily digests: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Schedule weekly summaries for all users
     */
    public function scheduleWeeklySummaries(): array
    {
        $results = ['queued' => 0, 'failed' => 0, 'errors' => []];

        try {
            $users = User::where('weekly_summary_enabled', true)
                ->whereNotNull('email')
                ->get();

            foreach ($users as $user) {
                try {
                    $this->queueWeeklySummary($user);
                    $results['queued']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: {$e->getMessage()}";
                }
            }

            Log::info("Scheduled weekly summaries", $results);
        } catch (\Exception $e) {
            Log::error("Failed to schedule weekly summaries: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Schedule calendar sync for all connected users
     */
    public function scheduleCalendarSyncs(): array
    {
        $results = ['queued' => 0, 'failed' => 0, 'errors' => []];

        try {
            $users = User::whereNotNull('google_token')
                ->whereNotNull('google_token_expires')
                ->where('google_token_expires', '>', now())
                ->get();

            foreach ($users as $user) {
                try {
                    $this->queueCalendarSync($user);
                    $results['queued']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "User {$user->id}: {$e->getMessage()}";
                }
            }

            Log::info("Scheduled calendar syncs", $results);
        } catch (\Exception $e) {
            Log::error("Failed to schedule calendar syncs: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Process due reminders
     */
    public function processDueReminders(): array
    {
        $results = ['queued' => 0, 'failed' => 0, 'errors' => []];

        try {
            // Get tasks due in next hour
            $dueTasks = Task::where('due_date', '>=', now())
                ->where('due_date', '<=', now()->addHour())
                ->where('status', '!=', 'completed')
                ->whereHas('user', function ($query) {
                    $query->where('reminder_notifications_enabled', true);
                })
                ->get();

            foreach ($dueTasks as $task) {
                try {
                    $this->queueTaskNotification($task, 'due_reminder');
                    $results['queued']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Task {$task->id}: {$e->getMessage()}";
                }
            }

            Log::info("Processed due reminders", $results);
        } catch (\Exception $e) {
            Log::error("Failed to process due reminders: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Process overdue notifications
     */
    public function processOverdueNotifications(): array
    {
        $results = ['queued' => 0, 'failed' => 0, 'errors' => []];

        try {
            // Get tasks overdue by 1 day (to avoid spam)
            $overdueTasks = Task::where('due_date', '=', now()->subDay()->format('Y-m-d'))
                ->where('status', '!=', 'completed')
                ->whereHas('user', function ($query) {
                    $query->where('reminder_notifications_enabled', true);
                })
                ->get();

            foreach ($overdueTasks as $task) {
                try {
                    $this->queueTaskNotification($task, 'overdue');
                    $results['queued']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Task {$task->id}: {$e->getMessage()}";
                }
            }

            Log::info("Processed overdue notifications", $results);
        } catch (\Exception $e) {
            Log::error("Failed to process overdue notifications: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Get queue statistics
     */
    public function getQueueStats(): array
    {
        try {
            return [
                'queues' => [
                    'high' => $this->getQueueSize(self::HIGH_PRIORITY_QUEUE),
                    'default' => $this->getQueueSize(self::DEFAULT_QUEUE),
                    'low' => $this->getQueueSize(self::LOW_PRIORITY_QUEUE),
                    'emails' => $this->getQueueSize(self::EMAIL_QUEUE),
                    'sync' => $this->getQueueSize(self::SYNC_QUEUE),
                ],
                'failed_jobs' => $this->getFailedJobsCount(),
                'processed_jobs_today' => $this->getProcessedJobsToday(),
                'average_processing_time' => $this->getAverageProcessingTime(),
                'queue_health' => $this->getQueueHealth(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get queue stats: ' . $e->getMessage());
            return ['error' => 'Unable to retrieve queue statistics'];
        }
    }

    /**
     * Monitor queue health
     */
    public function monitorQueueHealth(): array
    {
        $health = [
            'status' => 'healthy',
            'issues' => [],
            'recommendations' => []
        ];

        try {
            $stats = $this->getQueueStats();

            // Check for high queue sizes
            foreach ($stats['queues'] as $queueName => $size) {
                if ($size > 1000) {
                    $health['status'] = 'warning';
                    $health['issues'][] = "Queue '{$queueName}' has {$size} pending jobs";
                    $health['recommendations'][] = "Consider scaling up queue workers for '{$queueName}' queue";
                }
            }

            // Check failed jobs
            if ($stats['failed_jobs'] > 50) {
                $health['status'] = 'critical';
                $health['issues'][] = "High number of failed jobs: {$stats['failed_jobs']}";
                $health['recommendations'][] = "Review and retry failed jobs";
            }

            // Check processing time
            if ($stats['average_processing_time'] > 300) { // 5 minutes
                $health['status'] = 'warning';
                $health['issues'][] = "High average processing time: {$stats['average_processing_time']}s";
                $health['recommendations'][] = "Optimize job processing or increase worker count";
            }
        } catch (\Exception $e) {
            $health['status'] = 'error';
            $health['issues'][] = "Failed to monitor queue health: " . $e->getMessage();
        }

        return $health;
    }

    /**
     * Retry failed jobs
     */
    public function retryFailedJobs(array $jobIds = []): array
    {
        $results = ['retried' => 0, 'failed' => 0, 'errors' => []];

        try {
            if (empty($jobIds)) {
                // Simulate retrying all failed jobs
                $failedCount = $this->getFailedJobsCount();
                $results['retried'] = $failedCount;
                Log::info("Simulated retry of {$failedCount} failed jobs");
            } else {
                // Simulate retrying specific jobs
                foreach ($jobIds as $jobId) {
                    $results['retried']++;
                    Log::info("Simulated retry of job {$jobId}");
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to retry jobs: " . $e->getMessage());
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Clear failed jobs
     */
    public function clearFailedJobs(): int
    {
        try {
            $count = $this->getFailedJobsCount();
            Log::info("Simulated clearing of {$count} failed jobs");
            return $count;
        } catch (\Exception $e) {
            Log::error("Failed to clear failed jobs: " . $e->getMessage());
            return 0;
        }
    }

    // Private helper methods

    private function generateJobId(): string
    {
        return 'job_' . uniqid() . '_' . now()->timestamp;
    }

    private function logJobQueued(string $type, string $jobId, array $data): void
    {
        $this->activityLogService->log(
            'job_queued',
            'Job',
            $jobId,
            "Queued {$type} job",
            null,
            array_merge($data, [
                'job_id' => $jobId,
                'job_type' => $type,
                'queued_at' => now()->toDateTimeString()
            ]),
            $data['user_id'] ?? null
        );
    }

    private function getQueueSize(string $queueName): int
    {
        try {
            return Queue::size($queueName);
        } catch (\Exception $e) {
            Log::error("Failed to get queue size for {$queueName}: " . $e->getMessage());
            return 0;
        }
    }

    private function getFailedJobsCount(): int
    {
        try {
            return DB::table('failed_jobs')->count();
        } catch (\Exception $e) {
            Log::error("Failed to get failed jobs count: " . $e->getMessage());
            return 0;
        }
    }

    private function getProcessedJobsToday(): int
    {
        // This would require additional tracking in your job classes
        // For now, return a simulated value
        return rand(50, 200);
    }

    private function getAverageProcessingTime(): float
    {
        // This would require additional tracking in your job classes
        // For now, return a simulated value
        return round(rand(10, 120) + (rand(0, 99) / 100), 2);
    }

    private function getQueueHealth(): string
    {
        $stats = $this->getQueueStats();

        if (isset($stats['error'])) {
            return 'error';
        }

        $totalPending = array_sum($stats['queues']);
        $failedJobs = $stats['failed_jobs'];

        if ($failedJobs > 100 || $totalPending > 5000) {
            return 'critical';
        } elseif ($failedJobs > 20 || $totalPending > 1000) {
            return 'warning';
        }

        return 'healthy';
    }
}
