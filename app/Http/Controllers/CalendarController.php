<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMonthTitleRequest;
use App\Models\CalendarMonthTitle;
use App\Models\Category;
use App\Models\Task;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Services\CalendarEventService;
use App\Services\TaskListService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(
        private CalendarEventService $events,
        private TaskListService $taskLists
    ) {}

    public function index(Request $request): Response
    {
        $request->validate([
            'date' => ['nullable', 'date'],
            'start' => ['nullable', 'required_with:end', 'date'],
            'end' => ['nullable', 'required_with:start', 'date', 'after_or_equal:start'],
            'view' => ['nullable', 'in:dayGridMonth,timeGridWeek,timeGridDay,listMonth'],
        ]);

        $user = $request->user();
        $timezone = $user->getTimezone();
        $anchor = Carbon::parse($request->string('date', now($timezone)->format('Y-m-d'))->toString(), $timezone);
        [$rangeStart, $rangeEnd] = $this->visibleRange($request, $anchor, $timezone);
        $sources = $this->sources($request);
        $calendars = $this->events->calendarsFor($user);
        $calendarIds = $this->calendarIds($request, $calendars->pluck('id')->all());
        $items = collect();

        if (in_array('events', $sources, true) && (! $request->has('calendars') || $calendarIds !== [])) {
            $items->push(...$this->events->itemsForRange($user, $rangeStart, $rangeEnd, $calendarIds));
        }
        if (in_array('tasks', $sources, true)) {
            $items->push(...$this->taskItems($user, $rangeStart, $rangeEnd));
        }
        if (in_array('finance', $sources, true)) {
            $items->push(...$this->financeItems($user->id, $rangeStart, $rangeEnd, $timezone));
        }

        $categories = Category::query()
            ->where('is_active', true)
            ->where('user_id', $user->id)
            ->get()
            ->sortBy(fn ($category) => mb_strtolower(trim((string) $category->name)))
            ->values();

        return Inertia::render('Calendar/Index', [
            'calendarItems' => $items->sortBy('start')->values(),
            'eventCalendars' => $calendars,
            'sourceFilters' => $sources,
            'selectedCalendarIds' => $calendarIds,
            'currentDate' => $anchor->format('Y-m-d'),
            'visibleStart' => $rangeStart->setTimezone($timezone)->format('Y-m-d'),
            'visibleEnd' => $rangeEnd->setTimezone($timezone)->format('Y-m-d'),
            'monthTitle' => CalendarMonthTitle::query()
                ->where('user_id', $user->id)
                ->where('year', $anchor->year)
                ->where('month', $anchor->month)
                ->value('title'),
            'categories' => $categories,
            'lists' => $this->taskLists->getTaskListsForUser($user->id),
            'userTimezone' => $timezone,
        ]);
    }

    public function updateMonthTitle(UpdateMonthTitleRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $title = trim($data['title'] ?? '');
        $attributes = [
            'user_id' => $request->user()->id,
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
     * @return array{Carbon, Carbon}
     */
    private function visibleRange(Request $request, Carbon $anchor, string $timezone): array
    {
        if ($request->filled(['start', 'end'])) {
            $start = Carbon::parse($request->string('start')->toString(), $timezone)->startOfDay();
            $end = Carbon::parse($request->string('end')->toString(), $timezone)->endOfDay();
            abort_if($start->diffInDays($end) > 400, 422, 'Calendar range is too large.');

            return [$start->utc(), $end->utc()];
        }

        return [
            $anchor->copy()->startOfMonth()->startOfWeek(Carbon::SUNDAY)->utc(),
            $anchor->copy()->endOfMonth()->endOfWeek(Carbon::SATURDAY)->endOfDay()->utc(),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function sources(Request $request): array
    {
        $sources = $request->input('sources', ['events', 'tasks']);
        if (is_string($sources)) {
            $sources = array_filter(explode(',', $sources));
        }

        $sources = array_values((array) $sources);
        $allowed = ['events', 'tasks', 'finance'];
        if (array_diff($sources, $allowed)) {
            throw ValidationException::withMessages(['sources' => 'Choose valid calendar sources.']);
        }

        return $sources;
    }

    /**
     * @param  array<int, int>  $availableIds
     * @return array<int, int>
     */
    private function calendarIds(Request $request, array $availableIds): array
    {
        $selected = $request->input('calendars', $availableIds);
        if (is_string($selected)) {
            $selected = array_filter(explode(',', $selected));
        }

        $selected = array_values((array) $selected);
        if (collect($selected)->contains(fn ($id) => filter_var($id, FILTER_VALIDATE_INT) === false)) {
            throw ValidationException::withMessages(['calendars' => 'Choose valid calendars.']);
        }

        $normalized = collect($selected)->map(fn ($id) => (int) $id)->values();
        if ($normalized->diff($availableIds)->isNotEmpty()) {
            throw ValidationException::withMessages(['calendars' => 'Choose calendars that belong to you.']);
        }

        return $normalized->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function taskItems($user, Carbon $start, Carbon $end): array
    {
        $tasks = $user->tasks()->with(['category', 'subtasks', 'tags', 'lists'])->get();

        return $tasks->flatMap(function (Task $task) use ($start, $end, $user) {
            return $task->getOccurrencesInRange($start, $end)->map(function (Task $occurrence) use ($user) {
                $date = $occurrence->due_date->format('Y-m-d');
                $endDate = (! empty($occurrence->is_recurring_instance) || ! $occurrence->end_date)
                    ? $date
                    : $occurrence->end_date->format('Y-m-d');
                $key = $date;

                if ($occurrence->is_all_day || (! $occurrence->start_time && ! $occurrence->end_time)) {
                    $displayStart = $date;
                    $displayEnd = Carbon::parse($endDate)->addDay()->format('Y-m-d');
                    $allDay = true;
                } else {
                    $startTime = $occurrence->start_time ?: $occurrence->end_time;
                    $endTime = $occurrence->end_time ?: Carbon::parse($startTime)->addHour()->format('H:i:s');
                    $displayStart = Carbon::parse("{$date} {$startTime}", $user->getTimezone())->utc()->toIso8601String();
                    $displayEnd = Carbon::parse("{$endDate} {$endTime}", $user->getTimezone())->utc()->toIso8601String();
                    $allDay = false;
                }

                return [
                    'id' => "task:{$occurrence->id}:{$key}",
                    'sourceType' => 'task',
                    'sourceId' => $occurrence->category_id,
                    'eventId' => null,
                    'occurrenceKey' => $key,
                    'title' => $occurrence->title,
                    'start' => $displayStart,
                    'end' => $displayEnd,
                    'allDay' => $allDay,
                    'color' => $occurrence->category?->color ?? '#0EA5E9',
                    'editable' => false,
                    'extendedProps' => [
                        'task' => $occurrence,
                        'isRecurring' => (bool) $occurrence->is_recurring,
                        'kind' => 'task',
                    ],
                ];
            });
        })->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function financeItems(int $userId, Carbon $start, Carbon $end, string $timezone): array
    {
        // One summary chip per day (count + cash-flow net) instead of one item per
        // transaction; the busy days that flooded the grid now collapse to a single
        // chip that deep-links to the filtered transactions page. Note: this still
        // loads all of the user's transactions to expand recurrences in PHP — a
        // whereBetween('occurred_at', ...) prefilter for non-recurring rows is a
        // possible follow-up perf win.
        return FinanceTransaction::query()
            ->where('user_id', $userId)
            ->get()
            ->flatMap(fn ($transaction) => $transaction->getOccurrencesInRange($start, $end))
            ->groupBy(fn ($transaction) => $transaction->occurred_at->setTimezone($timezone)->format('Y-m-d'))
            ->map(function ($transactions, $date) {
                // Cash-flow net: income in, expense and savings out.
                $net = $transactions->reduce(function (float $carry, $transaction) {
                    $amount = (float) $transaction->amount;

                    return $carry + ($transaction->type === 'income' ? $amount : -$amount);
                }, 0.0);
                $count = $transactions->count();

                return [
                    'id' => "finance-summary:{$date}",
                    'sourceType' => 'finance',
                    'sourceId' => null,
                    'eventId' => null,
                    'occurrenceKey' => $date,
                    'title' => $count.' '.($count === 1 ? 'transaction' : 'transactions'),
                    'start' => $date,
                    'end' => Carbon::parse($date)->addDay()->format('Y-m-d'),
                    'allDay' => true,
                    'color' => $net >= 0 ? '#10B981' : '#F43F5E',
                    'editable' => false,
                    'extendedProps' => [
                        'kind' => 'finance',
                        'aggregated' => true,
                        'date' => $date,
                        'count' => $count,
                        'net' => round($net, 2),
                        'currency' => $transactions->first()->currency ?? 'PHP',
                    ],
                ];
            })
            ->values()
            ->all();
    }
}
