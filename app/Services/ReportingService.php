<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Models\Category;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportingService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Generate comprehensive productivity report for user
     */
    public function generateProductivityReport(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $report = [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'days' => $startDate->diffInDays($endDate) + 1,
            ],
            'task_summary' => $this->getTaskSummary($user, $startDate, $endDate),
            'completion_trends' => $this->getCompletionTrends($user, $startDate, $endDate),
            'priority_breakdown' => $this->getPriorityBreakdown($user, $startDate, $endDate),
            'category_performance' => $this->getCategoryPerformance($user, $startDate, $endDate),
            'productivity_metrics' => $this->getProductivityMetrics($user, $startDate, $endDate),
            'time_analysis' => $this->getTimeAnalysis($user, $startDate, $endDate),
            'recommendations' => $this->generateRecommendations($user, $startDate, $endDate),
        ];

        // Log report generation
        $this->activityLogService->logUserActivity(
            'productivity_report_generated',
            $user->id,
            $user->name,
            null,
            [
                'period_start' => $startDate->format('Y-m-d'),
                'period_end' => $endDate->format('Y-m-d'),
                'total_tasks' => $report['task_summary']['total_tasks']
            ]
        );

        return $report;
    }

    /**
     * Get task summary statistics
     */
    public function getTaskSummary(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $baseQuery = $user->tasks()->whereBetween('created_at', [$startDate, $endDate]);

        return [
            'total_tasks' => $baseQuery->count(),
            'completed_tasks' => $baseQuery->where('status', 'completed')->count(),
            'pending_tasks' => $baseQuery->where('status', 'pending')->count(),
            'in_progress_tasks' => $baseQuery->where('status', 'in_progress')->count(),
            'overdue_tasks' => $baseQuery->where('due_date', '<', now())
                ->where('status', '!=', 'completed')->count(),
            'completion_rate' => $this->calculateCompletionRate($user, $startDate, $endDate),
            'average_completion_time' => $this->calculateAverageCompletionTime($user, $startDate, $endDate),
        ];
    }

    /**
     * Get daily completion trends
     */
    public function getCompletionTrends(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $trends = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $completedCount = $user->tasks()
                ->whereDate('completed_at', $currentDate)
                ->count();

            $createdCount = $user->tasks()
                ->whereDate('created_at', $currentDate)
                ->count();

            $trends[] = [
                'date' => $currentDate->format('Y-m-d'),
                'completed' => $completedCount,
                'created' => $createdCount,
                'net_progress' => $completedCount - $createdCount,
            ];

            $currentDate->addDay();
        }

        return $trends;
    }

    /**
     * Get priority breakdown statistics
     */
    public function getPriorityBreakdown(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $priorities = ['urgent', 'high', 'medium', 'low'];
        $breakdown = [];

        foreach ($priorities as $priority) {
            $total = $user->tasks()
                ->where('priority', $priority)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $completed = $user->tasks()
                ->where('priority', $priority)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $breakdown[$priority] = [
                'total' => $total,
                'completed' => $completed,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
                'average_time_to_complete' => $this->getAverageCompletionTimeByPriority($user, $priority, $startDate, $endDate),
            ];
        }

        return $breakdown;
    }

    /**
     * Get category performance statistics
     */
    public function getCategoryPerformance(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $categories = $user->categories()->get();
        $performance = [];

        foreach ($categories as $category) {
            $total = $user->tasks()
                ->where('category_id', $category->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $completed = $user->tasks()
                ->where('category_id', $category->id)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            if ($total > 0) {
                $performance[] = [
                    'category_id' => $category->id,
                    'category_name' => $category->name,
                    'total_tasks' => $total,
                    'completed_tasks' => $completed,
                    'completion_rate' => round(($completed / $total) * 100, 2),
                    'average_completion_time' => $this->getAverageCompletionTimeByCategory($user, $category->id, $startDate, $endDate),
                ];
            }
        }

        return collect($performance)->sortByDesc('completion_rate')->values()->all();
    }

    /**
     * Get productivity metrics
     */
    public function getProductivityMetrics(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $totalDays = $startDate->diffInDays($endDate) + 1;
        $completedTasks = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->count();

        $createdTasks = $user->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return [
            'tasks_per_day' => $totalDays > 0 ? round($completedTasks / $totalDays, 2) : 0,
            'productivity_score' => $this->calculateProductivityScore($user, $startDate, $endDate),
            'efficiency_rating' => $this->calculateEfficiencyRating($user, $startDate, $endDate),
            'consistency_score' => $this->calculateConsistencyScore($user, $startDate, $endDate),
            'focus_time_hours' => $this->calculateFocusTime($user, $startDate, $endDate),
            'task_velocity' => $createdTasks > 0 ? round(($completedTasks / $createdTasks) * 100, 2) : 0,
        ];
    }

    /**
     * Get time analysis
     */
    public function getTimeAnalysis(User $user, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'peak_productivity_hours' => $this->getPeakProductivityHours($user, $startDate, $endDate),
            'average_task_duration' => $this->getAverageTaskDuration($user, $startDate, $endDate),
            'time_distribution' => $this->getTimeDistribution($user, $startDate, $endDate),
            'overdue_analysis' => $this->getOverdueAnalysis($user, $startDate, $endDate),
        ];
    }

    /**
     * Generate task analytics for admin dashboard
     */
    public function generateTaskAnalytics(array $filters = []): array
    {
        $query = Task::query();

        // Apply filters
        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return [
            'total_tasks' => $query->count(),
            'status_breakdown' => $this->getStatusBreakdown($query),
            'priority_distribution' => $this->getPriorityDistribution($query),
            'category_usage' => $this->getCategoryUsage($query),
            'completion_trends' => $this->getGlobalCompletionTrends($filters),
            'user_activity' => $this->getUserActivityStats($filters),
        ];
    }

    /**
     * Export data in various formats
     */
    public function exportData(User $user, string $type, array $filters = [], string $format = 'csv'): array
    {
        $data = [];

        switch ($type) {
            case 'tasks':
                $data = $this->exportTasks($user, $filters);
                break;
            case 'productivity_report':
                $data = $this->exportProductivityReport($user, $filters);
                break;
            case 'time_tracking':
                $data = $this->exportTimeTracking($user, $filters);
                break;
            case 'category_analysis':
                $data = $this->exportCategoryAnalysis($user, $filters);
                break;
        }

        return [
            'data' => $data,
            'format' => $format,
            'filename' => "{$type}_export_" . now()->format('Y-m-d_H-i-s') . ".{$format}",
            'total_records' => count($data),
        ];
    }

    /**
     * Get burnout risk assessment
     */
    public function getBurnoutRiskAssessment(User $user): array
    {
        $last30Days = now()->subDays(30);

        $overworkingIndicators = [
            'high_task_volume' => $this->checkHighTaskVolume($user, $last30Days),
            'frequent_overtime' => $this->checkFrequentOvertime($user, $last30Days),
            'low_completion_rate' => $this->checkLowCompletionRate($user, $last30Days),
            'increasing_overdue_tasks' => $this->checkIncreasingOverdueTasks($user, $last30Days),
            'weekend_work_pattern' => $this->checkWeekendWorkPattern($user, $last30Days),
        ];

        $riskScore = array_sum($overworkingIndicators);
        $riskLevel = $this->calculateRiskLevel($riskScore);

        return [
            'risk_level' => $riskLevel,
            'risk_score' => $riskScore,
            'indicators' => $overworkingIndicators,
            'recommendations' => $this->getBurnoutRecommendations($riskLevel, $overworkingIndicators),
        ];
    }

    // Private helper methods

    private function calculateCompletionRate(User $user, Carbon $startDate, Carbon $endDate): float
    {
        $total = $user->tasks()->whereBetween('created_at', [$startDate, $endDate])->count();
        $completed = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    }

    private function calculateAverageCompletionTime(User $user, Carbon $startDate, Carbon $endDate): float
    {
        $completedTasks = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('completed_at')
            ->get();

        if ($completedTasks->isEmpty()) {
            return 0;
        }

        $totalHours = $completedTasks->sum(function ($task) {
            return $task->created_at->diffInHours($task->completed_at);
        });

        return round($totalHours / $completedTasks->count(), 2);
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

    private function generateRecommendations(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $recommendations = [];
        $metrics = $this->getProductivityMetrics($user, $startDate, $endDate);
        $summary = $this->getTaskSummary($user, $startDate, $endDate);

        if ($summary['completion_rate'] < 70) {
            $recommendations[] = [
                'type' => 'completion_rate',
                'message' => 'Your task completion rate is below 70%. Consider breaking down large tasks into smaller, manageable subtasks.',
                'priority' => 'high'
            ];
        }

        if ($summary['overdue_tasks'] > $summary['total_tasks'] * 0.2) {
            $recommendations[] = [
                'type' => 'overdue_tasks',
                'message' => 'You have many overdue tasks. Review your time estimates and consider adjusting deadlines.',
                'priority' => 'high'
            ];
        }

        if ($metrics['consistency_score'] < 60) {
            $recommendations[] = [
                'type' => 'consistency',
                'message' => 'Your productivity varies significantly day-to-day. Try establishing a more consistent daily routine.',
                'priority' => 'medium'
            ];
        }

        return $recommendations;
    }

    private function calculateConsistencyScore(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $dailyCompletions = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $completed = $user->tasks()
                ->whereDate('completed_at', $currentDate)
                ->count();
            $dailyCompletions[] = $completed;
            $currentDate->addDay();
        }

        if (empty($dailyCompletions)) {
            return 0;
        }

        $mean = array_sum($dailyCompletions) / count($dailyCompletions);
        $variance = array_sum(array_map(function ($x) use ($mean) {
            return pow($x - $mean, 2);
        }, $dailyCompletions)) / count($dailyCompletions);

        $coefficient = $mean > 0 ? sqrt($variance) / $mean : 0;
        return max(0, min(100, intval((1 - $coefficient) * 100)));
    }

    private function getStatusBreakdown($query): array
    {
        return $query->groupBy('status')
            ->selectRaw('status, COUNT(*) as count')
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getPriorityDistribution($query): array
    {
        return $query->groupBy('priority')
            ->selectRaw('priority, COUNT(*) as count')
            ->pluck('count', 'priority')
            ->toArray();
    }

    private function calculateRiskLevel(int $riskScore): string
    {
        if ($riskScore >= 4) return 'high';
        if ($riskScore >= 2) return 'medium';
        return 'low';
    }

    private function checkHighTaskVolume(User $user, Carbon $since): int
    {
        $taskCount = $user->tasks()->where('created_at', '>=', $since)->count();
        return $taskCount > 100 ? 1 : 0; // More than 100 tasks in 30 days
    }

    private function checkLowCompletionRate(User $user, Carbon $since): int
    {
        $completionRate = $this->calculateCompletionRate($user, $since, now());
        return $completionRate < 60 ? 1 : 0; // Less than 60% completion rate
    }

    private function getAverageCompletionTimeByPriority(User $user, string $priority, Carbon $startDate, Carbon $endDate): float
    {
        $completedTasks = $user->tasks()
            ->where('priority', $priority)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('completed_at')
            ->get();

        if ($completedTasks->isEmpty()) {
            return 0;
        }

        $totalHours = $completedTasks->sum(function ($task) {
            return $task->created_at->diffInHours($task->completed_at);
        });

        return round($totalHours / $completedTasks->count(), 2);
    }

    private function getAverageCompletionTimeByCategory(User $user, int $categoryId, Carbon $startDate, Carbon $endDate): float
    {
        $completedTasks = $user->tasks()
            ->where('category_id', $categoryId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('completed_at')
            ->get();

        if ($completedTasks->isEmpty()) {
            return 0;
        }

        $totalHours = $completedTasks->sum(function ($task) {
            return $task->created_at->diffInHours($task->completed_at);
        });

        return round($totalHours / $completedTasks->count(), 2);
    }

    private function calculateEfficiencyRating(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $avgCompletionTime = $this->calculateAverageCompletionTime($user, $startDate, $endDate);
        $completionRate = $this->calculateCompletionRate($user, $startDate, $endDate);

        // Efficiency based on fast completion and high completion rate
        $timeEfficiency = $avgCompletionTime > 0 ? max(0, 100 - ($avgCompletionTime / 24 * 10)) : 100;
        $rateEfficiency = $completionRate;

        return intval(($timeEfficiency + $rateEfficiency) / 2);
    }

    private function calculateFocusTime(User $user, Carbon $startDate, Carbon $endDate): float
    {
        // Estimate focus time based on completed tasks and their estimated duration
        $completedTasks = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->count();

        // Rough estimate: 2 hours average per completed task
        return round($completedTasks * 2, 2);
    }

    private function getPeakProductivityHours(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $hourlyCompletions = [];

        $completedTasks = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->whereNotNull('completed_at')
            ->get();

        foreach ($completedTasks as $task) {
            $hour = $task->completed_at->format('H');
            $hourlyCompletions[$hour] = ($hourlyCompletions[$hour] ?? 0) + 1;
        }

        arsort($hourlyCompletions);
        return array_slice($hourlyCompletions, 0, 3, true);
    }

    private function getAverageTaskDuration(User $user, Carbon $startDate, Carbon $endDate): float
    {
        return $this->calculateAverageCompletionTime($user, $startDate, $endDate);
    }

    private function getTimeDistribution(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $distribution = [
            'morning' => 0,   // 6-12
            'afternoon' => 0, // 12-18
            'evening' => 0,   // 18-22
            'night' => 0      // 22-6
        ];

        $completedTasks = $user->tasks()
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->whereNotNull('completed_at')
            ->get();

        foreach ($completedTasks as $task) {
            $hour = (int) $task->completed_at->format('H');

            if ($hour >= 6 && $hour < 12) {
                $distribution['morning']++;
            } elseif ($hour >= 12 && $hour < 18) {
                $distribution['afternoon']++;
            } elseif ($hour >= 18 && $hour < 22) {
                $distribution['evening']++;
            } else {
                $distribution['night']++;
            }
        }

        return $distribution;
    }

    private function getOverdueAnalysis(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $overdueTasks = $user->tasks()
            ->where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $avgOverdueDays = $overdueTasks->avg(function ($task) {
            return now()->diffInDays($task->due_date);
        });

        return [
            'total_overdue' => $overdueTasks->count(),
            'average_overdue_days' => round($avgOverdueDays ?: 0, 2),
            'overdue_by_priority' => $overdueTasks->groupBy('priority')->map->count()->toArray(),
        ];
    }

    private function getCategoryUsage($query): array
    {
        return $query->join('categories', 'tasks.category_id', '=', 'categories.id')
            ->groupBy('categories.id', 'categories.name')
            ->selectRaw('categories.name, COUNT(*) as count')
            ->pluck('count', 'name')
            ->toArray();
    }

    private function getGlobalCompletionTrends(array $filters): array
    {
        $startDate = !empty($filters['start_date']) ? Carbon::parse($filters['start_date']) : now()->subDays(30);
        $endDate = !empty($filters['end_date']) ? Carbon::parse($filters['end_date']) : now();

        $trends = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $completed = Task::whereDate('completed_at', $currentDate)->count();
            $created = Task::whereDate('created_at', $currentDate)->count();

            $trends[] = [
                'date' => $currentDate->format('Y-m-d'),
                'completed' => $completed,
                'created' => $created,
            ];

            $currentDate->addDay();
        }

        return $trends;
    }

    private function getUserActivityStats(array $filters): array
    {
        $query = User::query();

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }

        return [
            'total_users' => $query->count(),
            'active_users' => $query->whereHas('tasks', function ($q) use ($filters) {
                if (!empty($filters['start_date'])) {
                    $q->where('created_at', '>=', $filters['start_date']);
                }
            })->count(),
        ];
    }

    private function checkFrequentOvertime(User $user, Carbon $since): int
    {
        // Check if user completes tasks frequently outside business hours
        $afterHoursTasks = $user->tasks()
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->whereNotNull('completed_at')
            ->get()
            ->filter(function ($task) {
                $hour = (int) $task->completed_at->format('H');
                return $hour < 8 || $hour > 18; // Outside 8 AM - 6 PM
            });

        $totalCompleted = $user->tasks()
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->count();

        return $totalCompleted > 0 && ($afterHoursTasks->count() / $totalCompleted) > 0.3 ? 1 : 0;
    }

    private function checkIncreasingOverdueTasks(User $user, Carbon $since): int
    {
        $firstHalf = $user->tasks()
            ->where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->whereBetween('created_at', [$since, $since->copy()->addDays(15)])
            ->count();

        $secondHalf = $user->tasks()
            ->where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->whereBetween('created_at', [$since->copy()->addDays(15), now()])
            ->count();

        return $secondHalf > $firstHalf ? 1 : 0;
    }

    private function checkWeekendWorkPattern(User $user, Carbon $since): int
    {
        $weekendTasks = $user->tasks()
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->whereNotNull('completed_at')
            ->get()
            ->filter(function ($task) {
                return $task->completed_at->isWeekend();
            });

        $totalCompleted = $user->tasks()
            ->where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->count();

        return $totalCompleted > 0 && ($weekendTasks->count() / $totalCompleted) > 0.2 ? 1 : 0;
    }

    private function getBurnoutRecommendations(string $riskLevel, array $indicators): array
    {
        $recommendations = [];

        if ($riskLevel === 'high') {
            $recommendations[] = 'Consider taking a break and reducing your workload';
            $recommendations[] = 'Focus on completing existing tasks before taking on new ones';
        }

        if ($indicators['high_task_volume']) {
            $recommendations[] = 'Try to limit the number of new tasks you create per day';
        }

        if ($indicators['low_completion_rate']) {
            $recommendations[] = 'Break down large tasks into smaller, manageable subtasks';
        }

        if ($indicators['frequent_overtime']) {
            $recommendations[] = 'Set boundaries for work hours and avoid working late';
        }

        return $recommendations;
    }

    private function exportProductivityReport(User $user, array $filters): array
    {
        $startDate = !empty($filters['start_date']) ? Carbon::parse($filters['start_date']) : now()->subDays(30);
        $endDate = !empty($filters['end_date']) ? Carbon::parse($filters['end_date']) : now();

        $report = $this->generateProductivityReport($user, $startDate, $endDate);

        return [
            'user_name' => $user->name,
            'period' => $report['period'],
            'task_summary' => $report['task_summary'],
            'productivity_score' => $report['productivity_metrics']['productivity_score'],
            'completion_rate' => $report['task_summary']['completion_rate'],
        ];
    }

    private function exportTimeTracking(User $user, array $filters): array
    {
        $query = $user->tasks()->where('status', 'completed')->whereNotNull('completed_at');

        if (!empty($filters['start_date'])) {
            $query->where('completed_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('completed_at', '<=', $filters['end_date']);
        }

        return $query->get()->map(function ($task) {
            return [
                'task_title' => $task->title,
                'started_at' => $task->created_at,
                'completed_at' => $task->completed_at,
                'duration_hours' => $task->created_at->diffInHours($task->completed_at),
                'category' => $task->category->name ?? '',
                'priority' => $task->priority,
            ];
        })->toArray();
    }

    private function exportCategoryAnalysis(User $user, array $filters): array
    {
        $startDate = !empty($filters['start_date']) ? Carbon::parse($filters['start_date']) : now()->subDays(30);
        $endDate = !empty($filters['end_date']) ? Carbon::parse($filters['end_date']) : now();

        return $this->getCategoryPerformance($user, $startDate, $endDate);
    }

    private function exportTasks(User $user, array $filters): array
    {
        $query = $user->tasks()->with(['category', 'tags']);

        if (!empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date']);
        }

        return $query->get()->map(function ($task) {
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
        })->toArray();
    }
}
