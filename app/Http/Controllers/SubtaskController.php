<?php

namespace App\Http\Controllers;

use App\Models\Subtask;
use App\Services\SubtaskService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class SubtaskController extends Controller
{
    public function __construct(
        private SubtaskService $subtaskService
    ) {}
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'title' => 'required|string|max:255',
            ]);

            $subtask = $this->subtaskService->createSubtask($validated, Auth::id());

            return back()->with('message', 'Subtask created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create subtask: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, Subtask $subtask): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'is_completed' => 'boolean',
            ]);

            $updatedSubtask = $this->subtaskService->updateSubtask($subtask, $validated, Auth::id());

            return back()->with('message', 'Subtask updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update subtask: ' . $e->getMessage()]);
        }
    }

    public function destroy(Subtask $subtask): RedirectResponse
    {
        try {
            $this->subtaskService->deleteSubtask($subtask, Auth::id());
            return back()->with('message', 'Subtask deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete subtask: ' . $e->getMessage()]);
        }
    }

    public function toggle(Subtask $subtask): RedirectResponse
    {
        try {
            $updatedSubtask = $this->subtaskService->toggleSubtaskCompletion($subtask, Auth::id());
            $message = $updatedSubtask->is_completed ? 'Subtask completed!' : 'Subtask marked as pending';
            return back()->with('message', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to toggle subtask: ' . $e->getMessage()]);
        }
    }

    public function reorder(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'subtaskIds' => 'required|array',
                'subtaskIds.*' => 'exists:subtasks,id',
            ]);

            $this->subtaskService->reorderSubtasks($validated['subtaskIds'], Auth::id());
            return back()->with('message', 'Subtasks reordered successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to reorder subtasks: ' . $e->getMessage()]);
        }
    }
}
