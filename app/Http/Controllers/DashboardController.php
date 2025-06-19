<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $userToday = $user->todayInUserTimezone();
        $userTomorrow = $userToday->copy()->addDay();

        // Get all user tasks
        $allTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->get();

        // Generate today's tasks (including recurring instances)
        $todayTaskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($userToday, $userToday->copy()->endOfDay());
            $todayTaskOccurrences = $todayTaskOccurrences->merge($occurrences);
        }
        $todayTasks = $todayTaskOccurrences->where('status', '!=', 'completed')->take(5);

        // Get overdue tasks (only non-recurring tasks can be overdue)
        $overdueTasks = Task::with(['category', 'subtasks'])
            ->overdueForUser($user)
            ->where('is_recurring', false)
            ->orderByDateTime()
            ->take(5)
            ->get();

        // Get upcoming tasks (next 7 days including recurring instances)
        $upcomingTaskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($userTomorrow, $userToday->copy()->addDays(8));
            $upcomingTaskOccurrences = $upcomingTaskOccurrences->merge($occurrences);
        }
        $upcomingTasks = $upcomingTaskOccurrences->where('status', '!=', 'completed')->take(5);

        // Get current tasks (pending and in progress, non-recurring only for simplicity)
        $currentTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->where('is_recurring', false)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('due_date', 'asc')
            ->orderBy('priority', 'desc')
            ->take(3)
            ->get();

        // Get quick stats (only count non-recurring tasks for stats to avoid confusion)
        $totalTasks = Task::where('user_id', $user->id)->count();
        $completedTasks = Task::where('user_id', $user->id)->where('status', 'completed')->count();

        $stats = [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'pending_tasks' => Task::where('user_id', $user->id)->where('status', 'pending')->count(),
            'overdue_tasks' => $overdueTasks->count(),
            'today_tasks' => $todayTasks->count(),
            'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
        ];

        // Get categories for quick task creation
        $categories = Category::where('is_active', true)->get();

        // Generate a week's worth of task occurrences for the schedule modal
        $weekStart = $userToday->copy();
        $weekEnd = $userToday->copy()->addDays(7);

        $weeklyTaskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($weekStart, $weekEnd);
            $weeklyTaskOccurrences = $weeklyTaskOccurrences->merge($occurrences);
        }

        return Inertia::render('Dashboard', [
            'currentTasks' => $currentTasks,
            'todayTasks' => $todayTasks,
            'overdueTasks' => $overdueTasks,
            'upcomingTasks' => $upcomingTasks,
            'weeklyTasks' => $weeklyTaskOccurrences->values()->all(),
            'stats' => $stats,
            'categories' => $categories,
        ]);
    }
}
