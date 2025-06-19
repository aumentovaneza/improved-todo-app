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

        $tasks = $user->tasks()
            ->with(['category', 'subtasks'])
            ->whereBetween('due_date', [$startOfMonth, $endOfMonth])
            ->orderBy('due_date')
            ->get()
            ->groupBy(function ($task) {
                return Carbon::parse($task->due_date)->format('Y-m-d');
            });

        // Get upcoming tasks (next 7 days)
        $upcomingTasks = $user->tasks()
            ->with(['category', 'subtasks'])
            ->where('status', 'pending')
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(7))
            ->orderBy('due_date')
            ->get();

        // Get overdue tasks
        $overdueTasks = $user->tasks()
            ->with(['category', 'subtasks'])
            ->where('status', 'pending')
            ->where('due_date', '<', now())
            ->orderBy('due_date')
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
