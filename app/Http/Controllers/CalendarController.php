<?php

namespace App\Http\Controllers;

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

        // Get tasks for the current month
        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        // Get all tasks (both regular and recurring)
        $allTasks = $user->tasks()
            ->with(['category', 'subtasks', 'tags'])
            ->get();

        // Generate task occurrences for the month
        $taskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange($startOfMonth, $endOfMonth);
            $taskOccurrences = $taskOccurrences->merge($occurrences);
        }

        // Group tasks by date
        $tasks = $taskOccurrences->groupBy(function ($task) {
            return Carbon::parse($task->due_date)->format('Y-m-d');
        });

        // Get upcoming tasks (next 7 days) - both regular and recurring
        $upcomingTaskOccurrences = collect();
        foreach ($allTasks as $task) {
            $occurrences = $task->getOccurrencesInRange(now(), now()->addDays(7));
            $upcomingTaskOccurrences = $upcomingTaskOccurrences->merge($occurrences);
        }
        $upcomingTasks = $upcomingTaskOccurrences->where('status', 'pending');

        // Get overdue tasks (only regular tasks can be overdue)
        $overdueTasks = $user->tasks()
            ->with(['category', 'subtasks', 'tags'])
            ->where('status', 'pending')
            ->where('is_recurring', false)
            ->where('due_date', '<', now())
            ->orderByDateTime()
            ->get();

        return Inertia::render('Calendar/Index', [
            'tasks' => $tasks,
            'upcomingTasks' => $upcomingTasks,
            'overdueTasks' => $overdueTasks,
            'currentDate' => $date->format('Y-m-d'),
            'monthName' => $date->format('F Y'),
        ]);
    }
}
