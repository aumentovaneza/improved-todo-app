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

    /**
     * Redirect back to the originating page, never to a subtask endpoint.
     *
     * The subtask routes are POST/PUT/DELETE only — there is no GET /subtasks —
     * so a plain back() that resolves to the request's own URL leaves Inertia
     * following a 302 into a dead endpoint (the subtask saves, but the UI
     * appears to fail). Guard against self-redirects and any subtasks path,
     * falling back to the tasks index.
     */
    private function redirectBack(): RedirectResponse
    {
        $previous = url()->previous();
        $path = ltrim(parse_url($previous, PHP_URL_PATH) ?? '', '/');

        if ($previous === url()->current() || str_starts_with($path, 'subtasks')) {
            return redirect()->route('tasks.index');
        }

        return redirect()->to($previous);
    }

    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'title' => 'required|string|max:255',
            ]);

            $subtask = $this->subtaskService->createSubtask($validated, Auth::id());

            // Flash the created subtask so the client can reconcile its
            // temporary (client-generated) id with the real database id.
            return $this->redirectBack()
                ->with('message', 'Subtask created successfully')
                ->with('subtask', $subtask->only([
                    'id',
                    'title',
                    'is_completed',
                    'completed_at',
                    'position',
                    'task_id',
                ]));
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            return $this->redirectBack()->withErrors(['error' => 'Failed to create subtask: ' . $e->getMessage()]);
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

            return $this->redirectBack()->with('message', 'Subtask updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            return $this->redirectBack()->withErrors(['error' => 'Failed to update subtask: ' . $e->getMessage()]);
        }
    }

    public function destroy(Subtask $subtask): RedirectResponse
    {
        try {
            $this->subtaskService->deleteSubtask($subtask, Auth::id());
            return $this->redirectBack()->with('message', 'Subtask deleted successfully');
        } catch (\Exception $e) {
            report($e);

            return $this->redirectBack()->withErrors(['error' => 'Failed to delete subtask: ' . $e->getMessage()]);
        }
    }

    public function toggle(Subtask $subtask): RedirectResponse
    {
        try {
            $updatedSubtask = $this->subtaskService->toggleSubtaskCompletion($subtask, Auth::id());
            $message = $updatedSubtask->is_completed ? 'Subtask completed!' : 'Subtask marked as pending';
            return $this->redirectBack()->with('message', $message);
        } catch (\Exception $e) {
            report($e);

            return $this->redirectBack()->withErrors(['error' => 'Failed to toggle subtask: ' . $e->getMessage()]);
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
            return $this->redirectBack()->with('message', 'Subtasks reordered successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);

            return $this->redirectBack()->withErrors(['error' => 'Failed to reorder subtasks: ' . $e->getMessage()]);
        }
    }
}
