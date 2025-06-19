<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $baseQuery = Task::with(['category', 'subtasks'])
            ->where('user_id', Auth::id());

        // Apply filters to base query
        $this->applyFilters($baseQuery, $request);

        // Get all active categories for the user
        $categories = Category::where('is_active', true)->get();

        // Get categorized tasks with pagination
        $categorizedTasks = [];

        // Handle tasks with categories
        foreach ($categories as $category) {
            $categoryQuery = clone $baseQuery;
            $categoryQuery->where('category_id', $category->id);

            $paginatedTasks = $categoryQuery->orderBy('position')->paginate(5, ['*'], "category_{$category->id}_page");

            if ($paginatedTasks->total() > 0) {
                $categorizedTasks[] = [
                    'category' => $category,
                    'tasks' => $paginatedTasks
                ];
            }
        }

        // Handle uncategorized tasks
        $uncategorizedQuery = clone $baseQuery;
        $uncategorizedQuery->whereNull('category_id');
        $uncategorizedTasks = $uncategorizedQuery->orderBy('position')->paginate(5, ['*'], 'uncategorized_page');

        if ($uncategorizedTasks->total() > 0) {
            $categorizedTasks[] = [
                'category' => (object) [
                    'id' => null,
                    'name' => 'Uncategorized',
                    'color' => '#6B7280',
                    'is_active' => true
                ],
                'tasks' => $uncategorizedTasks
            ];
        }

        return Inertia::render('Tasks/Index', [
            'categorizedTasks' => $categorizedTasks,
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'priority', 'category_id', 'due_date_filter']),
        ]);
    }

    /**
     * Apply filters to the task query
     */
    private function applyFilters($query, Request $request)
    {
        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        // Filter by due date
        if ($request->filled('due_date_filter')) {
            $filter = $request->get('due_date_filter');
            switch ($filter) {
                case 'today':
                    $query->whereDate('due_date', Carbon::today());
                    break;
                case 'tomorrow':
                    $query->whereDate('due_date', Carbon::tomorrow());
                    break;
                case 'this_week':
                    $query->whereBetween('due_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'overdue':
                    $query->overdue();
                    break;
            }
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
        ]);

        // Set is_all_day to true if no times are provided
        if (!isset($validated['is_all_day'])) {
            $validated['is_all_day'] = empty($validated['start_time']) && empty($validated['end_time']);
        }

        // Clear times if is_all_day is true
        if ($validated['is_all_day']) {
            $validated['start_time'] = null;
            $validated['end_time'] = null;
        } else {
            // For timed tasks, require both start and end time
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return redirect()->back()->withErrors([
                    'time' => 'Both start time and end time are required for timed tasks.'
                ])->withInput();
            }

            // Validate that start time is before end time
            if ($validated['start_time'] >= $validated['end_time']) {
                return redirect()->back()->withErrors([
                    'time' => 'Start time must be before end time.'
                ])->withInput();
            }
        }

        $validated['user_id'] = Auth::id();
        $validated['position'] = Task::where('user_id', Auth::id())->max('position') + 1;

        $task = Task::create($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'Task',
            'model_id' => $task->id,
            'new_values' => $validated,
            'description' => "Created task: {$task->title}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('message', 'Task created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task): RedirectResponse
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
        ]);

        // Set is_all_day to true if no times are provided
        if (!isset($validated['is_all_day'])) {
            $validated['is_all_day'] = empty($validated['start_time']) && empty($validated['end_time']);
        }

        // Clear times if is_all_day is true
        if ($validated['is_all_day']) {
            $validated['start_time'] = null;
            $validated['end_time'] = null;
        } else {
            // For timed tasks, require both start and end time
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return redirect()->back()->withErrors([
                    'time' => 'Both start time and end time are required for timed tasks.'
                ])->withInput();
            }

            // Validate that start time is before end time
            if ($validated['start_time'] >= $validated['end_time']) {
                return redirect()->back()->withErrors([
                    'time' => 'Start time must be before end time.'
                ])->withInput();
            }
        }

        $oldValues = $task->toArray();

        // Set completed_at if status is completed
        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = Carbon::now();
        } elseif ($validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $task->update($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'Task',
            'model_id' => $task->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'description' => "Updated task: {$task->title}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('message', 'Task updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task): RedirectResponse
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $taskTitle = $task->title;
        $task->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'model_type' => 'Task',
            'model_id' => $task->id,
            'description' => "Deleted task: {$taskTitle}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('status', 'Task deleted successfully');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'taskId' => 'required|exists:tasks,id',
            'newPosition' => 'required|integer|min:0',
        ]);

        $task = Task::findOrFail($validated['taskId']);

        // Ensure user owns the task
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $oldPosition = $task->position;
        $newPosition = $validated['newPosition'];

        if ($oldPosition < $newPosition) {
            // Moving down: decrement positions of tasks between old and new position
            Task::where('user_id', Auth::id())
                ->where('position', '>', $oldPosition)
                ->where('position', '<=', $newPosition)
                ->decrement('position');
        } else {
            // Moving up: increment positions of tasks between new and old position
            Task::where('user_id', Auth::id())
                ->where('position', '>=', $newPosition)
                ->where('position', '<', $oldPosition)
                ->increment('position');
        }

        $task->update(['position' => $newPosition]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'reorder',
            'model_type' => 'Task',
            'model_id' => $task->id,
            'old_values' => ['position' => $oldPosition],
            'new_values' => ['position' => $newPosition],
            'description' => "Reordered task: {$task->title}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('message', 'Task reordered successfully');
    }

    public function toggleStatus(Task $task): RedirectResponse
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        $newStatus = $task->status === 'completed' ? 'pending' : 'completed';
        $task->update([
            'status' => $newStatus,
            'completed_at' => $newStatus === 'completed' ? Carbon::now() : null,
        ]);

        return back()->with('status', 'Task status updated successfully');
    }
}
