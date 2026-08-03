<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskList;
use App\Services\TaskListService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskListController extends Controller
{
    public function __construct(
        private TaskListService $taskListService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $lists = $this->taskListService->getTaskListsWithCounts(Auth::id());

        return Inertia::render('Lists/Index', [
            'lists' => $lists,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Lists/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'tasks' => 'nullable|array',
            'tasks.*' => 'integer|exists:tasks,id',
        ]);

        try {
            $this->taskListService->createTaskList($validated, Auth::id());

            return redirect()->route('lists.index')->with('message', 'List created successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create list. Please try again.'])->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(TaskList $list): Response
    {
        $listWithContents = $this->taskListService->getTaskListWithContents($list->id, Auth::id());

        if (! $listWithContents) {
            abort(404);
        }

        // Tasks the user can still attach to this list (everything they own
        // that isn't already grouped here) — drives the attach picker.
        $attachedTaskIds = collect($listWithContents->tasks)->pluck('id');
        $availableTasks = Task::where('user_id', Auth::id())
            ->whereNotIn('id', $attachedTaskIds)
            ->orderByDesc('id')
            ->get()
            ->map(fn (Task $task) => ['id' => $task->id, 'title' => $task->title])
            ->values();

        return Inertia::render('Lists/Show', [
            'list' => $listWithContents,
            'availableTasks' => $availableTasks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaskList $list): Response
    {
        $listData = $this->taskListService->findTaskListForUser($list->id, Auth::id());

        if (! $listData) {
            abort(404);
        }

        $formattedList = $listData->toArray();

        // Provide the items in the shape the frontend expects.
        $formattedList['items'] = $listData->items->map(function ($item) {
            return [
                'id' => $item->id,
                'content' => $item->content,
                'is_completed' => $item->is_completed,
                'completed_at' => $item->completed_at,
                'position' => $item->position,
                'task_list_id' => $item->task_list_id,
            ];
        })->toArray();

        return Inertia::render('Lists/Edit', [
            'list' => $formattedList,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TaskList $list): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'description' => 'nullable|string',
            'tasks' => 'nullable|array',
            'tasks.*' => 'integer|exists:tasks,id',
        ]);

        try {
            $this->taskListService->updateTaskList($list, $validated, Auth::id());

            return redirect()->route('lists.index')->with('message', 'List updated successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update list. Please try again.'])->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaskList $list): RedirectResponse
    {
        try {
            $this->taskListService->deleteTaskList($list, Auth::id());

            return redirect()->route('lists.index')->with('message', 'List deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete list. Please try again.']);
        }
    }

    /**
     * Attach a task to the list (reverse UX from the task side).
     */
    public function attachTask(Request $request, TaskList $list): RedirectResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
        ]);

        try {
            $task = Task::findOrFail($validated['task_id']);

            $this->taskListService->attachTask($list, $task, Auth::id());

            return redirect()->back()->with('message', 'Task added to list successfully');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            // Ownership failures surface as a real 403 rather than a soft redirect.
            abort(403, $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to add task to list. Please try again.']);
        }
    }

    /**
     * Detach a task from the list.
     */
    public function detachTask(TaskList $list, Task $task): RedirectResponse
    {
        try {
            $this->taskListService->detachTask($list, $task, Auth::id());

            return redirect()->back()->with('message', 'Task removed from list successfully');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            // Ownership failures surface as a real 403 rather than a soft redirect.
            abort(403, $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to remove task from list. Please try again.']);
        }
    }
}
