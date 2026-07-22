<?php

namespace App\Services;

use App\Models\User;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Services\FinanceService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

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
            // Recurrence-aware so a recurring task (e.g. a weekly class) shows on
            // the day it actually occurs, matching the calendar/schedule view.
            $data['today_tasks'] = $this->todayTasks($user, 5)->all();
        }

        if (isset($enabled['overdue_tasks'])) {
            $data['overdue_tasks'] = $this->taskService->getOverdueTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['upcoming_tasks'])) {
            $data['upcoming_tasks'] = $this->upcomingTasks($user, 5)->all();
        }

        if (isset($enabled['in_progress'])) {
            $data['in_progress'] = $this->taskService->getInProgressTasksForUser($userId, 5)->values()->all();
        }

        if (isset($enabled['upcoming_payments'])) {
            $data['upcoming_payments'] = $this->getUpcomingPayments($user)->values()->all();
        }

        // Budgets and savings goals both come from the finance dashboard payload;
        // fetch it once when either widget is enabled.
        if (isset($enabled['budgets']) || isset($enabled['savings_goals'])) {
            $finance = $this->financeService->getDashboardData($userId);

            if (isset($enabled['budgets'])) {
                $data['budgets'] = [
                    'summary' => $finance['summary'],
                    'budgets' => $finance['budgets'],
                ];
            }

            if (isset($enabled['savings_goals'])) {
                $data['savings_goals'] = $finance['savings_goals'];
            }
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
     * Tasks occurring on the user's current local day (recurrence-aware).
     *
     * @return \Illuminate\Support\Collection<int, \App\Models\Task>
     */
    public function todayTasks(User $user, ?int $limit = null): Collection
    {
        $today = $user->todayInUserTimezone();

        return $this->tasksForDayRange($user, $today->copy(), $today->copy(), $limit);
    }

    /**
     * Tasks occurring in the next 7 days (tomorrow through +7), recurrence-aware.
     *
     * @return \Illuminate\Support\Collection<int, \App\Models\Task>
     */
    public function upcomingTasks(User $user, ?int $limit = null): Collection
    {
        $today = $user->todayInUserTimezone();

        return $this->tasksForDayRange(
            $user,
            $today->copy()->addDay(),
            $today->copy()->addDays(7),
            $limit,
        );
    }

    /**
     * Recurrence-aware tasks whose occurrence lands within the given user-local
     * day range (inclusive). Mirrors the calendar/schedule expansion via
     * Task::getOccurrencesInRange, so a recurring task shows on the day it
     * actually occurs rather than only on its stored base due_date. Completed
     * one-off tasks are excluded; recurring tasks are kept.
     *
     * @return \Illuminate\Support\Collection<int, \App\Models\Task>
     */
    public function tasksForDayRange(User $user, Carbon $fromDay, Carbon $toDay, ?int $limit = null): Collection
    {
        $rangeStart = $fromDay->copy()->startOfDay()->utc();
        $rangeEnd = $toDay->copy()->endOfDay()->utc();
        $fromStr = $fromDay->format('Y-m-d');
        $toStr = $toDay->format('Y-m-d');

        $tasks = $user->tasks()->with('category')->get()
            ->flatMap(fn ($task) => $task->getOccurrencesInRange($rangeStart->copy(), $rangeEnd->copy()))
            ->filter(function ($task) use ($user, $fromStr, $toStr) {
                if (! $task->due_date) {
                    return false;
                }

                if (! $task->is_recurring && $task->status === 'completed') {
                    return false;
                }

                $day = $user->toUserTimezone($task->due_date)->format('Y-m-d');

                return $day >= $fromStr && $day <= $toStr;
            })
            ->sortBy(fn ($task) => $task->due_date)
            ->values();

        return $limit ? $tasks->take($limit)->values() : $tasks;
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

        $today = $this->todayTasks($user);
        $overdue = $this->taskService->getOverdueTasksForUser($userId);
        $upcoming = $this->upcomingTasks($user);
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
