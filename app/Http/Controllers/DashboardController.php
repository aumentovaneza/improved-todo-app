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

        // Get current tasks (pending and in progress)
        $currentTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('due_date', 'asc')
            ->orderBy('priority', 'desc')
            ->take(3)
            ->get();

        // Get today's tasks (in user's timezone)
        $todayTasks = Task::with(['category', 'subtasks'])
            ->dueTodayForUser($user)
            ->orderBy('priority', 'desc')
            ->take(5)
            ->get();

        // Get overdue tasks (tasks due before today in user's timezone)
        $overdueTasks = Task::with(['category', 'subtasks'])
            ->overdueForUser($user)
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Get upcoming tasks (next 7 days in user's timezone)
        $upcomingTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->where('due_date', '>=', $userTomorrow)
            ->where('due_date', '<', $userToday->copy()->addDays(8))
            ->where('status', '!=', 'completed')
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Get quick stats
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

        return Inertia::render('Dashboard', [
            'currentTasks' => $currentTasks,
            'todayTasks' => $todayTasks,
            'overdueTasks' => $overdueTasks,
            'upcomingTasks' => $upcomingTasks,
            'stats' => $stats,
            'categories' => $categories,
        ]);
    }
}
