<?php

namespace App\Http\Controllers;

use App\Models\Subtask;
use App\Models\Task;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SubtaskController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'title' => 'required|string|max:255',
        ]);

        // Check if user owns the task
        $task = Task::where('id', $validated['task_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated['position'] = Subtask::where('task_id', $validated['task_id'])->max('position') + 1;

        $subtask = Subtask::create($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'Subtask',
            'model_id' => $subtask->id,
            'new_values' => $validated,
            'description' => "Created subtask: {$subtask->title}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('message', 'Subtask created successfully');
    }

    public function update(Request $request, Subtask $subtask): RedirectResponse
    {
        // Check if user owns the task
        $task = Task::where('id', $subtask->task_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'is_completed' => 'boolean',
        ]);

        $oldValues = $subtask->toArray();

        if (isset($validated['is_completed'])) {
            $validated['completed_at'] = $validated['is_completed'] ? Carbon::now() : null;
        }

        $subtask->update($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'Subtask',
            'model_id' => $subtask->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'description' => "Updated subtask: {$subtask->title}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('message', 'Subtask updated successfully');
    }

    public function destroy(Subtask $subtask): RedirectResponse
    {
        // Check if user owns the task
        $task = Task::where('id', $subtask->task_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $subtaskTitle = $subtask->title;
        $subtask->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'model_type' => 'Subtask',
            'model_id' => $subtask->id,
            'description' => "Deleted subtask: {$subtaskTitle}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('message', 'Subtask deleted successfully');
    }

    public function toggle(Subtask $subtask): RedirectResponse
    {
        // Check if user owns the task
        $task = Task::where('id', $subtask->task_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $oldStatus = $subtask->is_completed;
        $newStatus = !$subtask->is_completed;

        $subtask->update([
            'is_completed' => $newStatus,
            'completed_at' => $newStatus ? Carbon::now() : null,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'toggle',
            'model_type' => 'Subtask',
            'model_id' => $subtask->id,
            'old_values' => ['is_completed' => $oldStatus],
            'new_values' => ['is_completed' => $newStatus],
            'description' => "Toggled subtask: {$subtask->title}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return back()->with('message', $newStatus ? 'Subtask completed!' : 'Subtask marked as pending');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'subtaskIds' => 'required|array',
            'subtaskIds.*' => 'exists:subtasks,id',
        ]);

        // Check if user owns the task
        $task = Task::where('id', $validated['task_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        foreach ($validated['subtaskIds'] as $position => $subtaskId) {
            Subtask::where('id', $subtaskId)
                ->where('task_id', $validated['task_id'])
                ->update(['position' => $position]);
        }

        return back()->with('message', 'Subtasks reordered successfully');
    }
}
