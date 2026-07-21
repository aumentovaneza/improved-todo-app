<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\CategoryService;
use App\Services\TagService;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        private TaskService $taskService,
        private CategoryService $categoryService,
        private TagService $tagService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'priority', 'category_id', 'tag_id', 'due_date_filter']);

        // Exclude completed tasks by default unless a status filter is explicitly set
        if (empty($filters['status'])) {
            $filters['status'] = 'not_completed';
        }

        // Return the full working set; the page groups/sorts client-side
        $tasks = $this->taskService->getTasksForIndex(Auth::id(), $filters);

        // Get all active categories for the user
        $categories = $this->categoryService->getActiveCategoriesForUser(Auth::id());

        // Get all active tags
        $tags = $this->tagService->getAllTags();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'categories' => $categories,
            'tags' => $tags,
            'filters' => $request->only(['search', 'status', 'priority', 'category_id', 'tag_id', 'due_date_filter']),
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
            'category_id' => 'nullable|exists:categories,id,user_id,' . Auth::id(),
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
            'recurrence_config.days_of_week' => 'nullable|array',
            'recurrence_config.days_of_week.*' => 'integer|between:0,6',
            'recurrence_config.day_of_month' => 'nullable|integer|between:1,31',
            'recurring_until' => 'nullable|date',
            'tags' => 'nullable|array',
            'tags.*.id' => 'nullable|exists:tags,id',
            'tags.*.name' => 'nullable|string|max:255',
            'tags.*.color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'nullable|boolean',
        ]);

        // Clear recurring fields for non-recurring tasks
        if (!isset($validated['is_recurring']) || !$validated['is_recurring']) {
            $validated['recurring_until'] = null;
            $validated['recurrence_type'] = null;
            $validated['recurrence_config'] = null;
        }

        // Set is_all_day to true if no times are provided
        if (!isset($validated['is_all_day'])) {
            $validated['is_all_day'] = empty($validated['start_time']) && empty($validated['end_time']);
        }

        // Clear times if is_all_day is true
        if ($validated['is_all_day']) {
            $validated['start_time'] = null;
            $validated['end_time'] = null;
        }

        try {
            $task = $this->taskService->createTask($validated, Auth::id());
            return redirect()->back()->with('message', 'Task created successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create task. Please try again.'])->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id,user_id,' . Auth::id(),
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
            'recurrence_config.days_of_week' => 'nullable|array',
            'recurrence_config.days_of_week.*' => 'integer|between:0,6',
            'recurrence_config.day_of_month' => 'nullable|integer|between:1,31',
            'recurring_until' => 'nullable|date',
            'tags' => 'nullable|array',
            'tags.*.id' => 'nullable|exists:tags,id',
            'tags.*.name' => 'nullable|string|max:255',
            'tags.*.color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'nullable|boolean',
        ]);

        // Clear recurring fields for non-recurring tasks
        if (!isset($validated['is_recurring']) || !$validated['is_recurring']) {
            $validated['recurring_until'] = null;
            $validated['recurrence_type'] = null;
            $validated['recurrence_config'] = null;
        }

        // Set is_all_day to true if no times are provided
        if (!isset($validated['is_all_day'])) {
            $validated['is_all_day'] = empty($validated['start_time']) && empty($validated['end_time']);
        }

        // Clear times if is_all_day is true
        if ($validated['is_all_day']) {
            $validated['start_time'] = null;
            $validated['end_time'] = null;
        }

        try {
            $updatedTask = $this->taskService->updateTask($task, $validated, Auth::id());
            return redirect()->back()->with('message', 'Task updated successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update task. Please try again.'])->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task): RedirectResponse
    {
        try {
            $this->taskService->deleteTask($task, Auth::id());
            return back()->with('status', 'Task deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete task. Please try again.']);
        }
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'taskIds' => 'required|array',
            'taskIds.*' => 'exists:tasks,id',
        ]);

        try {
            $this->taskService->reorderTasks($validated['taskIds'], Auth::id());
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Tasks reordered successfully',
                ]);
            }
            return back()->with('message', 'Tasks reordered successfully');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(
                    ['message' => 'Failed to reorder tasks. Please try again.'],
                    422
                );
            }
            return back()->withErrors(['error' => 'Failed to reorder tasks. Please try again.']);
        }
    }

    public function toggleStatus(Request $request, Task $task): RedirectResponse
    {
        // If a specific status is provided, use it; otherwise toggle between completed/pending
        if ($request->has('status')) {
            $validated = $request->validate([
                'status' => 'required|in:pending,in_progress,completed,cancelled'
            ]);
            $newStatus = $validated['status'];
        } else {
            $newStatus = $task->status === 'completed' ? 'pending' : 'completed';
        }

        try {
            $this->taskService->toggleTaskStatus($task, $newStatus, Auth::id());
            return back()->with('status', 'Task status updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update task status. Please try again.']);
        }
    }
}
