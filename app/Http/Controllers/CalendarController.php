<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMonthTitleRequest;
use App\Models\CalendarMonthTitle;
use App\Models\Category;
use App\Models\Task;
use App\Modules\Finance\Models\FinanceTransaction;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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
                },
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

        // Get overdue tasks (only regular tasks can be overdue)
        $overdueTasks = Task::with(['category', 'subtasks', 'tags'])
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                },
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

        // Optional user-authored title/theme for the month the current date
        // falls in (e.g. "Sprint 4" or "Wedding season"). Null when unset.
        $monthTitle = CalendarMonthTitle::where('user_id', $user->id)
            ->where('year', (int) $date->format('Y'))
            ->where('month', (int) $date->format('n'))
            ->value('title');

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
            'overdueTasks' => $overdueTasks,
            'currentDate' => $date->format('Y-m-d'),
            'monthName' => $date->format('F Y'),
            'monthTitle' => $monthTitle,
            'range' => $range,
            'rangeLabel' => $rangeLabel,
            'categories' => $categories,
        ]);
    }

    /**
     * Create, update, or clear the current user's custom title for a month.
     * An empty title removes the record so the month falls back to no title.
     */
    public function updateMonthTitle(UpdateMonthTitleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $title = trim($data['title'] ?? '');

        $attributes = [
            'user_id' => Auth::id(),
            'year' => $data['year'],
            'month' => $data['month'],
        ];

        if ($title === '') {
            CalendarMonthTitle::where($attributes)->delete();
        } else {
            CalendarMonthTitle::updateOrCreate($attributes, ['title' => $title]);
        }

        return back();
    }

    /**
     * Format a week span, collapsing the month/year when they are shared.
     * e.g. "Jul 20 – 26, 2026" or "Jul 28 – Aug 3, 2026".
     */
    private function weekRangeLabel(Carbon $start, Carbon $end): string
    {
        if ($start->year !== $end->year) {
            return $start->format('M j, Y').' – '.$end->format('M j, Y');
        }

        if ($start->month !== $end->month) {
            return $start->format('M j').' – '.$end->format('M j, Y');
        }

        return $start->format('M j').' – '.$end->format('j, Y');
    }
}
