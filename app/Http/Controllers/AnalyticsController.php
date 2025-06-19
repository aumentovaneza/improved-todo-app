<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use App\Models\Task;

class AnalyticsController extends Controller
{
    /**
     * Display the analytics dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $period = $request->get('period', '30'); // Default to 30 days

        $startDate = now()->subDays($period);
        $endDate = now();

        // Overall statistics
        $stats = [
            'total_tasks' => $user->tasks()->count(),
            'completed_tasks' => $user->tasks()->where('status', 'completed')->count(),
            'pending_tasks' => $user->tasks()->where('status', 'pending')->count(),
            'overdue_tasks' => $user->tasks()
                ->where('status', 'pending')
                ->where('due_date', '<', now())
                ->count(),
        ];

        // Completion rate over time (last 30 days)
        $completionData = $user->tasks()
            ->where('status', 'completed')
            ->where('updated_at', '>=', $startDate)
            ->select(DB::raw('DATE(updated_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');

        // Tasks by category
        $tasksByCategory = $user->tasks()
            ->with('category')
            ->select('category_id', DB::raw('COUNT(*) as count'))
            ->groupBy('category_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category ? $item->category->name : 'Uncategorized',
                    'color' => $item->category ? $item->category->color : '#6b7280',
                    'count' => $item->count,
                ];
            });

        // Tasks by status
        $tasksByStatus = $user->tasks()
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        // Weekly productivity (tasks completed per day of week)
        $weeklyProductivity = $user->tasks()
            ->where('status', 'completed')
            ->where('updated_at', '>=', $startDate)
            ->select(DB::raw('DAYOFWEEK(updated_at) as day_of_week'), DB::raw('COUNT(*) as count'))
            ->groupBy('day_of_week')
            ->get()
            ->mapWithKeys(function ($item) {
                $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return [$days[$item->day_of_week - 1] => $item->count];
            });

        // Recent activity (last 10 activities) - only task-related
        $recentActivity = $user->activityLogs()
            ->where('model_type', Task::class)
            ->with(['task', 'task.category'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Average completion time
        $avgCompletionTime = $user->tasks()
            ->where('status', 'completed')
            ->whereNotNull('due_date')
            ->get()
            ->map(function ($task) {
                $created = Carbon::parse($task->created_at);
                $completed = Carbon::parse($task->updated_at);
                return $completed->diffInDays($created);
            })
            ->average();

        // Tasks due this week
        $tasksThisWeek = $user->tasks()
            ->where('status', 'pending')
            ->whereBetween('due_date', [now()->startOfWeek(), now()->endOfWeek()])
            ->with(['category', 'subtasks', 'tags'])
            ->orderBy('due_date')
            ->get();

        return Inertia::render('Analytics/Index', [
            'stats' => $stats,
            'completionData' => $completionData,
            'tasksByCategory' => $tasksByCategory,
            'tasksByStatus' => $tasksByStatus,
            'weeklyProductivity' => $weeklyProductivity,
            'recentActivity' => $recentActivity,
            'avgCompletionTime' => round($avgCompletionTime ?? 0, 1),
            'tasksThisWeek' => $tasksThisWeek,
            'period' => $period,
        ]);
    }
}
