<?php

namespace App\Http\Controllers;

use App\Models\Board;
use App\Models\Workspace;
use App\Models\Swimlane;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class BoardController extends Controller
{
    public function show(Workspace $workspace, Board $board)
    {
        // Check if user has access to this board
        if (!$board->isMember(Auth::user())) {
            abort(403, 'You do not have access to this board.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $board->load([
            'swimlanes' => function ($query) {
                $query->where('is_active', true)
                    ->orderBy('position')
                    ->with(['tasks' => function ($taskQuery) {
                        $taskQuery->orderBy('position')
                            ->with(['user', 'tags', 'subtasks']);
                    }]);
            },
        ]);

        return Inertia::render('Boards/Show', [
            'workspace' => $workspace->load(['organizer']),
            'board' => $board->load(['collaborators']),
            'isOrganizer' => $workspace->isOrganizer(Auth::user()),
            'isBoardAdmin' => $board->collaborators()->where('user_id', Auth::id())->wherePivot('role', 'admin')->exists(),
        ]);
    }

    public function store(Request $request, Workspace $workspace)
    {
        // Only organizer can create boards
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can create boards.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $maxPosition = $workspace->boards()->max('position') ?? -1;

        $board = $workspace->boards()->create([
            'name' => $request->name,
            'description' => $request->description,
            'position' => $maxPosition + 1,
        ]);

        // Create default swimlanes for new board
        $defaultSwimlanes = [
            ['name' => 'To Do', 'color' => '#EF4444', 'position' => 0],
            ['name' => 'In Progress', 'color' => '#F59E0B', 'position' => 1],
            ['name' => 'Review', 'color' => '#3B82F6', 'position' => 2],
            ['name' => 'Done', 'color' => '#10B981', 'position' => 3],
        ];

        foreach ($defaultSwimlanes as $swimlaneData) {
            $board->swimlanes()->create($swimlaneData);
        }

        return redirect()->route('boards.show', [$workspace, $board])
            ->with('success', 'Board created successfully!');
    }

    public function update(Request $request, Workspace $workspace, Board $board)
    {
        // Only organizer can update boards
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can update boards.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $board->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return back()->with('success', 'Board updated successfully!');
    }

    public function destroy(Workspace $workspace, Board $board)
    {
        // Only organizer can delete boards
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can delete boards.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $board->update(['is_active' => false]);

        return redirect()->route('workspaces.show', $workspace)
            ->with('success', 'Board deleted successfully!');
    }

    public function moveTask(Request $request, Workspace $workspace, Board $board)
    {
        // Check if user has access to this board
        if (!$board->isMember(Auth::user())) {
            abort(403, 'You do not have access to this board.');
        }

        $request->validate([
            'taskId' => 'required|exists:tasks,id',
            'targetSwimlaneId' => 'required|exists:swimlanes,id',
            'newPosition' => 'required|integer|min:0',
        ]);

        $task = Task::findOrFail($request->taskId);
        $targetSwimlane = Swimlane::findOrFail($request->targetSwimlaneId);

        // Check if task belongs to this board
        if ($task->board_id !== $board->id) {
            abort(403, 'Task does not belong to this board.');
        }

        // Check if target swimlane belongs to this board
        if ($targetSwimlane->board_id !== $board->id) {
            abort(403, 'Target swimlane does not belong to this board.');
        }

        // Update task position within the target swimlane
        $this->updateTaskPositions($task, $targetSwimlane, $request->newPosition);

        return back();
    }

    private function updateTaskPositions(Task $task, Swimlane $targetSwimlane, int $newPosition)
    {
        $oldSwimlaneId = $task->swimlane_id;
        $oldPosition = $task->position;

        // If moving to a different swimlane
        if ($oldSwimlaneId !== $targetSwimlane->id) {
            // Update positions in old swimlane (close the gap)
            Task::where('swimlane_id', $oldSwimlaneId)
                ->where('position', '>', $oldPosition)
                ->decrement('position');

            // Update positions in new swimlane (make space)
            Task::where('swimlane_id', $targetSwimlane->id)
                ->where('position', '>=', $newPosition)
                ->increment('position');

            // Update the task
            $task->update([
                'swimlane_id' => $targetSwimlane->id,
                'position' => $newPosition,
            ]);
        } else {
            // Moving within the same swimlane
            if ($newPosition > $oldPosition) {
                // Moving down - decrease positions of tasks in between
                Task::where('swimlane_id', $targetSwimlane->id)
                    ->where('position', '>', $oldPosition)
                    ->where('position', '<=', $newPosition)
                    ->decrement('position');
            } else if ($newPosition < $oldPosition) {
                // Moving up - increase positions of tasks in between
                Task::where('swimlane_id', $targetSwimlane->id)
                    ->where('position', '>=', $newPosition)
                    ->where('position', '<', $oldPosition)
                    ->increment('position');
            }

            // Update the task position
            $task->update(['position' => $newPosition]);
        }
    }

    public function storeTask(Request $request, Workspace $workspace, Board $board)
    {
        // Check if user has access to this board
        if (!$board->isMember(Auth::user())) {
            abort(403, 'You do not have access to this board.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'swimlane_id' => 'required|exists:swimlanes,id',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $swimlane = Swimlane::findOrFail($request->swimlane_id);

        // Check if swimlane belongs to this board
        if ($swimlane->board_id !== $board->id) {
            abort(403, 'Swimlane does not belong to this board.');
        }

        // Get the next position in the swimlane
        $maxPosition = Task::where('swimlane_id', $swimlane->id)->max('position') ?? -1;

        // Validate that assigned user has access to this board
        if ($request->assigned_to) {
            $assignedUser = \App\Models\User::findOrFail($request->assigned_to);
            if (!$board->isMember($assignedUser)) {
                return back()->withErrors(['assigned_to' => 'Selected user does not have access to this board.']);
            }
        }

        $task = Task::create([
            'user_id' => $request->assigned_to ?: Auth::id(),
            'board_id' => $board->id,
            'swimlane_id' => $swimlane->id,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority,
            'status' => 'pending',
            'due_date' => $request->due_date,
            'position' => $maxPosition + 1,
        ]);

        return redirect()->route('boards.show', [$workspace, $board])
            ->with('success', 'Task created successfully!');
    }

    public function addCollaborator(Request $request, Workspace $workspace, Board $board)
    {
        // Only workspace organizer can add collaborators
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the workspace organizer can add collaborators.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:collaborator,admin',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if ($board->isCollaborator($user)) {
            return back()->withErrors(['email' => 'User is already a collaborator on this board.']);
        }

        $board->collaborators()->attach($user->id, [
            'role' => $request->role,
            'joined_at' => now(),
        ]);

        return back()->with('success', 'Collaborator added to board successfully!');
    }

    public function removeCollaborator(Request $request, Workspace $workspace, Board $board, $userId)
    {
        // Only workspace organizer can remove collaborators
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the workspace organizer can remove collaborators.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $board->collaborators()->detach($userId);

        return back()->with('success', 'Collaborator removed from board successfully!');
    }

    public function updateTask(Request $request, Workspace $workspace, Board $board, Task $task)
    {
        // Check if user has access to this board
        if (!$board->isMember(Auth::user())) {
            abort(403, 'You do not have access to this board.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        // Check if task belongs to this board
        if ($task->board_id !== $board->id) {
            abort(404, 'Task not found in this board.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        // Validate that assigned user has access to this board if assignment is being changed
        if ($request->assigned_to) {
            $assignedUser = \App\Models\User::findOrFail($request->assigned_to);
            if (!$board->isMember($assignedUser)) {
                return back()->withErrors(['assigned_to' => 'Selected user does not have access to this board.']);
            }
        }

        $task->update([
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority,
            'status' => $request->status,
            'due_date' => $request->due_date,
            'user_id' => $request->assigned_to ?: $task->user_id, // Keep current assignment if not specified
        ]);

        return back()->with('success', 'Task updated successfully!');
    }
}
