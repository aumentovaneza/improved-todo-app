<?php

namespace App\Services;

use App\Models\User;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Services\FinanceService;

/**
 * Composes existing services into the per-widget payloads consumed by the
 * dashboard. This class holds no business logic of its own; it only orchestrates
 * TaskService, ReportingService and the Finance module.
 */
class DashboardService
{
    public function __construct(
        private TaskService $taskService,
        private ReportingService $reportingService,
        private FinanceService $financeService,
    ) {}

    /**
     * Build a map of widget key => payload, computing data only for the enabled
     * keys. Client-only widgets (pomodoro, weather) intentionally return nothing.
     *
     * @param  array<int, string>  $enabledKeys
     * @return array<string, mixed>
     */
    public function getWidgetData(User $user, array $enabledKeys): array
    {
        $userId = $user->id;
        $enabled = array_flip($enabledKeys);
        $data = [];

        if (isset($enabled['task_stats'])) {
            $data['task_stats'] = $this->taskService->getTaskStatsForUser($userId);
        }

        if (isset($enabled['today_tasks'])) {
            $data['today_tasks'] = $this->taskService->getTodayTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['overdue_tasks'])) {
            $data['overdue_tasks'] = $this->taskService->getOverdueTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['upcoming_tasks'])) {
            $data['upcoming_tasks'] = $this->taskService->getUpcomingTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['in_progress'])) {
            $data['in_progress'] = $this->taskService->getInProgressTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['upcoming_payments'])) {
            $data['upcoming_payments'] = $this->getUpcomingPayments($user)->values()->all();
        }

        if (isset($enabled['budgets'])) {
            $finance = $this->financeService->getDashboardData($userId);
            $data['budgets'] = [
                'summary' => $finance['summary'],
                'budgets' => $finance['budgets'],
            ];
        }

        if (isset($enabled['calendar'])) {
            $data['calendar'] = $this->getCalendarItems($user);
        }

        if (isset($enabled['productivity'])) {
            $end = $user->nowInUserTimezone();
            $start = $end->copy()->subDays(6)->startOfDay();
            $data['productivity'] = [
                'trends' => $this->reportingService->getCompletionTrends($user, $start->copy(), $end->copy()),
                'metrics' => $this->reportingService->getProductivityMetrics($user, $start->copy(), $end->copy()),
            ];
        }

        // pomodoro and weather are client-only widgets: no server payload.

        return $data;
    }

    /**
     * Recurring expense transactions falling in the next 30 days.
     */
    public function getUpcomingPayments(User $user)
    {
        $userToday = $user->todayInUserTimezone();

        return FinanceTransaction::with(['category', 'loan'])
            ->where('user_id', $user->id)
            ->where('type', 'expense')
            ->where('is_recurring', true)
            ->whereBetween('occurred_at', [
                $userToday->copy()->startOfDay(),
                $userToday->copy()->addDays(30)->endOfDay(),
            ])
            ->orderBy('occurred_at')
            ->limit(5)
            ->get();
    }

    /**
     * Combined task + transaction occurrences for the next 7 days, as a flat
     * list of {date, title, type} ordered by date.
     *
     * @return array<int, array{date: string, title: string, type: string}>
     */
    public function getCalendarItems(User $user): array
    {
        $userNow = $user->toUserTimezone(now());
        $rangeStart = $userNow->copy()->utc();
        $rangeEnd = $userNow->copy()->addDays(7)->utc();

        $items = collect();

        $tasks = $user->tasks()->get();
        foreach ($tasks as $task) {
            foreach ($task->getOccurrencesInRange($rangeStart->copy(), $rangeEnd->copy()) as $occurrence) {
                if (! $occurrence->due_date) {
                    continue;
                }

                $items->push([
                    'date' => $user->toUserTimezone($occurrence->due_date)->format('Y-m-d'),
                    'title' => (string) $occurrence->title,
                    'type' => 'task',
                ]);
            }
        }

        $transactions = FinanceTransaction::with('category')
            ->where('user_id', $user->id)
            ->get();
        foreach ($transactions as $transaction) {
            foreach ($transaction->getOccurrencesInRange($rangeStart->copy(), $rangeEnd->copy()) as $occurrence) {
                if (! $occurrence->occurred_at) {
                    continue;
                }

                $items->push([
                    'date' => $user->toUserTimezone($occurrence->occurred_at)->format('Y-m-d'),
                    'title' => (string) ($occurrence->description ?? 'Transaction'),
                    'type' => 'transaction',
                ]);
            }
        }

        return $items
            ->sortBy('date')
            ->values()
            ->all();
    }

    /**
     * Compact plaintext description of the user's day, used to prompt the AI
     * summary generator.
     */
    public function buildDaySummaryContext(User $user): array
    {
        $userId = $user->id;

        $today = $this->taskService->getTodayTasksForUser($userId);
        $overdue = $this->taskService->getOverdueTasksForUser($userId);
        $upcoming = $this->taskService->getUpcomingTasksForUser($userId);
        $payments = $this->getUpcomingPayments($user);
        $finance = $this->financeService->getDashboardData($userId);
        $calendar = $this->getCalendarItems($user);

        return [
            'today_tasks' => $today,
            'overdue_tasks' => $overdue,
            'upcoming_tasks' => $upcoming,
            'payments' => $payments,
            'budgets' => $finance['budgets'] ?? [],
            'calendar' => $calendar,
        ];
    }
}
