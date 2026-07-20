<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class CalendarController extends Controller
{
    /**
     * Display the calendar view.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $currentDate = $request->get('date', now()->format('Y-m-d'));
        $date = Carbon::parse($currentDate);

        // Determine the range window to load (month | week | day). Weeks are
        // Sunday-first to match the calendar grid's Sun..Sat headers.
        $range = in_array($request->get('range'), ['month', 'week', 'day'], true)
            ? $request->get('range')
            : 'month';

        // Convert the user timezone range to UTC for database queries.
        $userDate = $user->toUserTimezone($date);
        [$rangeStart, $rangeEnd] = match ($range) {
            'week' => [
                $userDate->copy()->startOfWeek(Carbon::SUNDAY)->utc(),
                $userDate->copy()->endOfWeek(Carbon::SATURDAY)->utc(),
            ],
            'day' => [
                $userDate->copy()->startOfDay()->utc(),
                $userDate->copy()->endOfDay()->utc(),
            ],
            default => [
                $userDate->copy()->startOfMonth()->utc(),
                $userDate->copy()->endOfMonth()->utc(),
            ],
        };

        // Get all tasks (both regular and recurring)
        $allTasks = $user->tasks()
            ->with(['category', 'subtasks', 'tags'])
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ])
            ->get();

        // Generate task occurrences for the month
        $taskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($rangeStart, $rangeEnd);
            $taskOccurrences = $taskOccurrences->merge($occurrences);
        }

        // Group tasks by date (in user's timezone)
        $tasks = $taskOccurrences->groupBy(function ($task) use ($user) {
            // Convert the task's due_date to user timezone for grouping
            $taskDueDate = $task->due_date; // This is already a Carbon instance from the cast
            $userDate = $user->toUserTimezone($taskDueDate);
            return $userDate->format('Y-m-d');
        });

        // Get finance transactions (including recurring) for the month
        $transactions = FinanceTransaction::with('category')
            ->where('user_id', $user->id)
            ->get();

        $transactionOccurrences = collect();
        foreach ($transactions as $transaction) {
            $occurrences = $transaction->getOccurrencesInRange($rangeStart, $rangeEnd);
            $transactionOccurrences = $transactionOccurrences->merge($occurrences);
        }

        $transactionsByDate = $transactionOccurrences->groupBy(function ($transaction) use ($user) {
            $transactionDate = $transaction->occurred_at;
            $userDate = $user->toUserTimezone($transactionDate);
            return $userDate->format('Y-m-d');
        });

        // Get upcoming tasks (next 7 days) - both regular and recurring
        $userNow = $user->toUserTimezone(now());
        $upcomingTaskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($userNow->copy()->utc(), $userNow->copy()->addDays(7)->utc());
            $upcomingTaskOccurrences = $upcomingTaskOccurrences->merge($occurrences);
        }
        $upcomingTasks = $upcomingTaskOccurrences->where('status', 'pending');

        // Get recently accomplished tasks (completed in the last 24 hours),
        // ordered by most recently completed.
        $recentlyAccomplishedTasks = $user->tasks()
            ->with('category')
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDay())
            ->orderByDesc('completed_at')
            ->get();

        // Ensure a minimum of 5 are shown by backfilling with the most recent
        // completions when the last 24 hours contain fewer than 5.
        if ($recentlyAccomplishedTasks->count() < 5) {
            $recentlyAccomplishedTasks = $user->tasks()
                ->with('category')
                ->where('status', 'completed')
                ->whereNotNull('completed_at')
                ->orderByDesc('completed_at')
                ->limit(5)
                ->get();
        }

        // Get overdue tasks (only regular tasks can be overdue)
        $overdueTasks = Task::with(['category', 'subtasks', 'tags'])
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ])
            ->overdueForUser($user)
            ->where('is_recurring', false)
            ->orderByDateTime()
            ->get();

        // Get categories
        $categories = Category::where('is_active', true)
            ->where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        // Human-readable label for the active range (in the user's timezone).
        $rangeLabel = match ($range) {
            'week' => $this->weekRangeLabel(
                $userDate->copy()->startOfWeek(Carbon::SUNDAY),
                $userDate->copy()->endOfWeek(Carbon::SATURDAY)
            ),
            'day' => $userDate->format('l, M j, Y'),
            default => $userDate->format('F Y'),
        };

        return Inertia::render('Calendar/Index', [
            'tasks' => $tasks,
            'transactions' => $transactionsByDate,
            'upcomingTasks' => $upcomingTasks,
            'recentlyAccomplishedTasks' => $recentlyAccomplishedTasks,
            'overdueTasks' => $overdueTasks,
            'currentDate' => $date->format('Y-m-d'),
            'monthName' => $date->format('F Y'),
            'range' => $range,
            'rangeLabel' => $rangeLabel,
            'categories' => $categories,
        ]);
    }

    /**
     * Format a week span, collapsing the month/year when they are shared.
     * e.g. "Jul 20 – 26, 2026" or "Jul 28 – Aug 3, 2026".
     */
    private function weekRangeLabel(Carbon $start, Carbon $end): string
    {
        if ($start->year !== $end->year) {
            return $start->format('M j, Y') . ' – ' . $end->format('M j, Y');
        }

        if ($start->month !== $end->month) {
            return $start->format('M j') . ' – ' . $end->format('M j, Y');
        }

        return $start->format('M j') . ' – ' . $end->format('j, Y');
    }
}
