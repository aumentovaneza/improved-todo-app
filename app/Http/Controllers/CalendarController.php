<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
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

        // Get tasks for the current month (convert user timezone range to UTC for database queries)
        $userDate = $user->toUserTimezone($date);
        $startOfMonth = $userDate->copy()->startOfMonth()->utc();
        $endOfMonth = $userDate->copy()->endOfMonth()->utc();

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
            $occurrences = $task->getOccurrencesInRange($startOfMonth, $endOfMonth);
            $taskOccurrences = $taskOccurrences->merge($occurrences);
        }

        // Group tasks by date (in user's timezone)
        $tasks = $taskOccurrences->groupBy(function ($task) use ($user) {
            // Convert the task's due_date to user timezone for grouping
            $taskDueDate = $task->due_date; // This is already a Carbon instance from the cast
            $userDate = $user->toUserTimezone($taskDueDate);
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
                }
            ])
            ->overdueForUser($user)
            ->where('is_recurring', false)
            ->orderByDateTime()
            ->get();

        // Get categories
        $categories = Category::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Calendar/Index', [
            'tasks' => $tasks,
            'upcomingTasks' => $upcomingTasks,
            'overdueTasks' => $overdueTasks,
            'currentDate' => $date->format('Y-m-d'),
            'monthName' => $date->format('F Y'),
            'categories' => $categories,
        ]);
    }
}
