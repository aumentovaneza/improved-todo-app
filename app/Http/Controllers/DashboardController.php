<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Services\CategoryService;
use App\Services\DailySummaryService;
use App\Services\DashboardService;
use App\Services\TaskService;
use App\Support\DashboardWidgets;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private TaskService $taskService,
        private CategoryService $categoryService,
        private DashboardService $dashboardService,
        private DailySummaryService $dailySummaryService,
    ) {}

    public function index(): Response
    {
        $userId = Auth::id();
        $user = Auth::user();

        // Resolve the widget layout: saved layout (if any) merged with the
        // registry so newly-added widgets appear for existing users.
        $widgetLayout = DashboardWidgets::normalizeLayout($user->dashboard_widgets);

        $enabledKeys = collect($widgetLayout)
            ->filter(fn (array $row): bool => (bool) ($row['enabled'] ?? false))
            ->pluck('key')
            ->all();

        $widgetData = $this->dashboardService->getWidgetData($user, $enabledKeys);

        // Categories for quick task creation + onboarding checklist.
        $categories = $this->categoryService->getActiveCategoriesForUser($userId);
        $stats = $this->taskService->getTaskStatsForUser($userId);

        $gettingStarted = [
            'hasTask' => ($stats['total_tasks'] ?? 0) > 0,
            'hasCategory' => $categories->isNotEmpty(),
            'hasTransaction' => FinanceTransaction::where('user_id', $userId)->exists(),
            'hasAccount' => FinanceAccount::where('user_id', $userId)->exists(),
            'hasSampleData' => Task::where('user_id', $userId)->where('is_sample', true)->exists(),
        ];

        // AI daily summary (pro-gated). Only computed when the user is entitled.
        $canUseDailySummary = $this->dailySummaryService->userCanUseSummary($user);
        $dailySummary = null;

        if ($canUseDailySummary) {
            $summary = $this->dailySummaryService->getCachedForToday($user);
            $dailySummary = $summary ? [
                'content' => $summary->content,
                'provider' => $summary->provider,
                'model' => $summary->model,
                'generated_at' => optional($summary->generated_at)->toIso8601String(),
            ] : null;
        }

        return Inertia::render('Dashboard', [
            'categories' => $categories->values()->all(),
            'gettingStarted' => $gettingStarted,
            'availableWidgets' => DashboardWidgets::availableWidgets(),
            'widgetLayout' => $widgetLayout,
            'widgetData' => $widgetData,
            'dailySummary' => $dailySummary,
            'canUseDailySummary' => $canUseDailySummary,
            'dailySummaryEnabled' => (bool) ($user->daily_summary_enabled ?? true),
            'dailySummaryTime' => $this->formatSummaryTime($user->daily_summary_time),
        ]);
    }

    /**
     * Normalize the stored summary time to an "HH:MM" string for the frontend.
     */
    private function formatSummaryTime(?string $time): string
    {
        if (! $time) {
            return '08:00';
        }

        $parts = explode(':', $time);
        $hour = str_pad($parts[0] ?? '08', 2, '0', STR_PAD_LEFT);
        $minute = str_pad($parts[1] ?? '00', 2, '0', STR_PAD_LEFT);

        return "{$hour}:{$minute}";
    }
}
