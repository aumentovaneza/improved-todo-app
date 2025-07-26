<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Category;
use App\Models\Tag;
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
        $baseQuery = Task::with(['category', 'subtasks', 'tags'])
            ->where('status', '!=', 'completed')
            ->where('board_id', null)
            ->where('swimlane_id', null)
            ->withCount([
                'subtasks',
                'subtasks as completed_subtasks_count' => function ($query) {
                    $query->where('is_completed', true);
                }
            ])
            ->where('user_id', Auth::id());

        // Apply filters to base query
        $this->applyFilters($baseQuery, $request);

        // Get all active categories for the user
        $categories = Category::where('is_active', true)
            ->where('user_id', Auth::id())
            ->get();

        // Get all active tags
        $tags = Tag::active()->get();

        // Get categorized tasks with pagination
        $categorizedTasks = [];

        // Handle tasks with categories - include all categories, even empty ones
        foreach ($categories as $category) {
            $categoryQuery = clone $baseQuery;
            $categoryQuery->where('category_id', $category->id);

            // Order by status (in_progress first, then pending, then cancelled, then completed) 
            // then by priority (urgent to low) then by position
            $paginatedTasks = $categoryQuery
                ->orderByRaw("CASE 
                    WHEN status = 'in_progress' THEN 1 
                    WHEN status = 'pending' THEN 2 
                    WHEN status = 'cancelled' THEN 3 
                    WHEN status = 'completed' THEN 4 
                    ELSE 5 
                END")
                ->orderByRaw("CASE 
                    WHEN priority = 'urgent' THEN 1 
                    WHEN priority = 'high' THEN 2 
                    WHEN priority = 'medium' THEN 3 
                    WHEN priority = 'low' THEN 4 
                    ELSE 5 
                END")
                ->orderBy('position')
                ->paginate(5, ['*'], "category_{$category->id}_page");

            // Include all categories, regardless of whether they have tasks
            $categorizedTasks[] = [
                'category' => $category,
                'tasks' => $paginatedTasks
            ];
        }

        // Handle uncategorized tasks
        $uncategorizedQuery = clone $baseQuery;
        $uncategorizedQuery->whereNull('category_id');

        // Apply same ordering logic to uncategorized tasks
        $uncategorizedTasks = $uncategorizedQuery
            ->orderByRaw("CASE 
                WHEN status = 'in_progress' THEN 1 
                WHEN status = 'pending' THEN 2 
                WHEN status = 'cancelled' THEN 3 
                WHEN status = 'completed' THEN 4 
                ELSE 5 
            END")
            ->orderByRaw("CASE 
                WHEN priority = 'urgent' THEN 1 
                WHEN priority = 'high' THEN 2 
                WHEN priority = 'medium' THEN 3 
                WHEN priority = 'low' THEN 4 
                ELSE 5 
            END")
            ->orderBy('position')
            ->paginate(5, ['*'], 'uncategorized_page');

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
            'categories' => $categories->load('tags'),
            'tags' => $tags,
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
            'category_id' => 'nullable|exists:categories,id,user_id,' . Auth::id(),
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'is_all_day' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'recurrence_config' => 'nullable|array',
            'recurring_until' => 'nullable|date',
            'tags' => 'nullable|array',
            'tags.*.id' => 'nullable|exists:tags,id',
            'tags.*.name' => 'nullable|string|max:255',
            'tags.*.color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'nullable|boolean',
        ]);

        // Validate recurring task logic
        if (isset($validated['is_recurring']) && $validated['is_recurring']) {
            if (empty($validated['recurring_until'])) {
                return redirect()->back()->withErrors([
                    'recurring_until' => 'Recurring until date is required for recurring tasks.'
                ])->withInput();
            }
            if (empty($validated['recurrence_type'])) {
                return redirect()->back()->withErrors([
                    'recurrence_type' => 'Recurrence type is required for recurring tasks.'
                ])->withInput();
            }
            // Clear due_date for recurring tasks
            $validated['due_date'] = null;
        } else {
            // Clear recurring fields for non-recurring tasks
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

        // Handle tags
        if (isset($validated['tags'])) {
            $tagIds = [];
            foreach ($validated['tags'] as $tagData) {
                if (isset($tagData['is_new']) && $tagData['is_new']) {
                    // Create new tag - validate required fields
                    if (empty($tagData['name']) || empty($tagData['color'])) {
                        continue; // Skip invalid new tags
                    }
                    $tag = Tag::firstOrCreate(
                        ['name' => $tagData['name']],
                        [
                            'color' => $tagData['color'],
                            'description' => $tagData['description'] ?? null,
                        ]
                    );
                    $tagIds[] = $tag->id;
                } else {
                    // Existing tag (if we have an id)
                    if (isset($tagData['id']) && !empty($tagData['id'])) {
                        $tagIds[] = $tagData['id'];
                    }
                }
            }
            $task->tags()->attach($tagIds);
        }

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
            'recurring_until' => 'nullable|date',
            'tags' => 'nullable|array',
            'tags.*.id' => 'nullable|exists:tags,id',
            'tags.*.name' => 'nullable|string|max:255',
            'tags.*.color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'tags.*.is_new' => 'nullable|boolean',
        ]);

        // Validate recurring task logic
        if ($validated['is_recurring']) {
            if (empty($validated['recurring_until'])) {
                return redirect()->back()->withErrors([
                    'recurring_until' => 'Recurring until date is required for recurring tasks.'
                ])->withInput();
            }
            if (empty($validated['recurrence_type'])) {
                return redirect()->back()->withErrors([
                    'recurrence_type' => 'Recurrence type is required for recurring tasks.'
                ])->withInput();
            }
            // Clear due_date for recurring tasks
            $validated['due_date'] = null;
        } else {
            // Clear recurring fields for non-recurring tasks
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

        // Handle tags
        if (isset($validated['tags'])) {
            $tagIds = [];
            foreach ($validated['tags'] as $tagData) {
                if (isset($tagData['is_new']) && $tagData['is_new']) {
                    // Create new tag - validate required fields
                    if (empty($tagData['name']) || empty($tagData['color'])) {
                        continue; // Skip invalid new tags
                    }
                    $tag = Tag::firstOrCreate(
                        ['name' => $tagData['name']],
                        [
                            'color' => $tagData['color'],
                            'description' => $tagData['description'] ?? null,
                        ]
                    );
                    $tagIds[] = $tag->id;
                } else {
                    // Existing tag (if we have an id)
                    if (isset($tagData['id']) && !empty($tagData['id'])) {
                        $tagIds[] = $tagData['id'];
                    }
                }
            }
            $task->tags()->sync($tagIds);
        } else {
            $task->tags()->detach();
        }

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

        // Only allow reordering within the same category, status, and priority group
        // to maintain the new sorting logic (active tasks first, then by priority)
        $baseQuery = Task::where('user_id', Auth::id())
            ->where('status', $task->status)
            ->where('priority', $task->priority);

        // Include category filter (both null and specific category)
        if ($task->category_id) {
            $baseQuery->where('category_id', $task->category_id);
        } else {
            $baseQuery->whereNull('category_id');
        }

        if ($oldPosition < $newPosition) {
            // Moving down: decrement positions of tasks between old and new position
            $baseQuery->where('position', '>', $oldPosition)
                ->where('position', '<=', $newPosition)
                ->decrement('position');
        } else {
            // Moving up: increment positions of tasks between new and old position
            $baseQuery->where('position', '>=', $newPosition)
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

    public function toggleStatus(Request $request, Task $task): RedirectResponse
    {
        if ($task->user_id !== Auth::id()) {
            abort(403);
        }

        // If a specific status is provided, use it; otherwise toggle between completed/pending
        if ($request->has('status')) {
            $validated = $request->validate([
                'status' => 'required|in:pending,in_progress,completed,cancelled'
            ]);
            $newStatus = $validated['status'];
        } else {
            $newStatus = $task->status === 'completed' ? 'pending' : 'completed';
        }

        $oldStatus = $task->status;

        $task->update([
            'status' => $newStatus,
            'completed_at' => $newStatus === 'completed' ? Carbon::now() : null,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'status_change',
            'model_type' => 'Task',
            'model_id' => $task->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
            'description' => "Changed task status from {$oldStatus} to {$newStatus}: {$task->title}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('status', 'Task status updated successfully');
    }
}
