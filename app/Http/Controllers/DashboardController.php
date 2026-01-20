<?php

namespace App\Http\Controllers;

use App\Modules\Finance\Models\FinanceTransaction;
use App\Services\CategoryService;
use App\Services\TaskService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        private TaskService $taskService,
        private CategoryService $categoryService
    ) {}
    public function index(): Response
    {
        $userId = Auth::id();
        $user = Auth::user();
        $userToday = $user->todayInUserTimezone();

        // Get dashboard data using services
        $todayTasks = $this->taskService->getTodayTasksForUser($userId, 5);
        $overdueTasks = $this->taskService->getOverdueTasksForUser($userId, 5);
        $upcomingTasks = $this->taskService->getUpcomingTasksForUser($userId, 5);
        $currentTasks = $this->taskService->getInProgressTasksForUser($userId, 3);

        // Get task statistics
        $stats = $this->taskService->getTaskStatsForUser($userId);

        // Get categories for quick task creation
        $categories = $this->categoryService->getActiveCategoriesForUser($userId);

        // Get weekly tasks for schedule modal
        $weekStart = $userToday->copy();
        $weekEnd = $userToday->copy()->addDays(7);
        $weeklyTasks = $this->taskService->getTasksInDateRange($userId, $weekStart, $weekEnd);

        $upcomingPayments = FinanceTransaction::with(['category', 'loan'])
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('is_recurring', true)
            ->whereBetween('occurred_at', [
                $userToday->copy()->startOfDay(),
                $userToday->copy()->addDays(30)->endOfDay(),
            ])
            ->orderBy('occurred_at')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'currentTasks' => $currentTasks->values()->all(),
            'todayTasks' => $todayTasks->values()->all(),
            'overdueTasks' => $overdueTasks->values()->all(),
            'upcomingTasks' => $upcomingTasks->values()->all(),
            'weeklyTasks' => $weeklyTasks->values()->all(),
            'upcomingPayments' => $upcomingPayments->values()->all(),
            'stats' => $stats,
            'categories' => $categories->values()->all(),
        ]);
    }
}
