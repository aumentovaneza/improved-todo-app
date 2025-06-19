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

        // Get current tasks (pending and in progress)
        $currentTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('due_date', 'asc')
            ->orderBy('priority', 'desc')
            ->take(3)
            ->get();

        // Get today's tasks
        $todayTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->whereDate('due_date', Carbon::today())
            ->orderBy('priority', 'desc')
            ->take(5)
            ->get();

        // Get overdue tasks
        $overdueTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->where('due_date', '<', Carbon::now())
            ->where('status', '!=', 'completed')
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Get upcoming tasks (next 7 days)
        $upcomingTasks = Task::with(['category', 'subtasks'])
            ->where('user_id', $user->id)
            ->whereBetween('due_date', [Carbon::tomorrow(), Carbon::now()->addDays(7)])
            ->where('status', '!=', 'completed')
            ->orderBy('due_date', 'asc')
            ->take(5)
            ->get();

        // Get quick stats
        $stats = [
            'total_tasks' => Task::where('user_id', $user->id)->count(),
            'completed_tasks' => Task::where('user_id', $user->id)->where('status', 'completed')->count(),
            'pending_tasks' => Task::where('user_id', $user->id)->where('status', 'pending')->count(),
            'overdue_tasks' => $overdueTasks->count(),
            'today_tasks' => $todayTasks->count(),
            'completion_rate' => Task::where('user_id', $user->id)->count() > 0
                ? round((Task::where('user_id', $user->id)->where('status', 'completed')->count() / Task::where('user_id', $user->id)->count()) * 100, 1)
                : 0,
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
