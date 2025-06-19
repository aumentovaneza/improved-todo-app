<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
        $query = Task::with(['category', 'subtasks'])
            ->where('user_id', Auth::id());

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

        $tasks = $query->orderBy('position')->paginate(20);

        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'priority', 'category_id', 'due_date_filter']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $categories = Category::where('is_active', true)->get();

        return Inertia::render('Tasks/Create', [
            'categories' => $categories,
        ]);
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
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
        ]);

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
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
        ]);

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
