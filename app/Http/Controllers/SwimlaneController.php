<?php

namespace App\Http\Controllers;

use App\Models\Swimlane;
use App\Models\Board;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SwimlaneController extends Controller
{
    public function store(Request $request, Workspace $workspace, Board $board)
    {
        // Only organizer can create swimlanes
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can create swimlanes.');
        }

        // Check if board belongs to workspace
        if ($board->workspace_id !== $workspace->id) {
            abort(404, 'Board not found in this workspace.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $maxPosition = $board->swimlanes()->max('position') ?? -1;

        $swimlane = $board->swimlanes()->create([
            'name' => $request->name,
            'color' => $request->color,
            'position' => $maxPosition + 1,
        ]);

        return back()->with('success', 'Swimlane created successfully!');
    }

    public function update(Request $request, Workspace $workspace, Board $board, Swimlane $swimlane)
    {
        // Only organizer can update swimlanes
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can update swimlanes.');
        }

        // Check if swimlane belongs to board
        if ($swimlane->board_id !== $board->id) {
            abort(404, 'Swimlane not found in this board.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $swimlane->update([
            'name' => $request->name,
            'color' => $request->color,
        ]);

        return back()->with('success', 'Swimlane updated successfully!');
    }

    public function destroy(Workspace $workspace, Board $board, Swimlane $swimlane)
    {
        // Only organizer can delete swimlanes
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can delete swimlanes.');
        }

        // Check if swimlane belongs to board
        if ($swimlane->board_id !== $board->id) {
            abort(404, 'Swimlane not found in this board.');
        }

        // Don't allow deletion if there are tasks in this swimlane
        if ($swimlane->tasks()->count() > 0) {
            return back()->withErrors(['swimlane' => 'Cannot delete swimlane with existing tasks. Move tasks to another swimlane first.']);
        }

        $swimlane->update(['is_active' => false]);

        return back()->with('success', 'Swimlane deleted successfully!');
    }

    public function reorder(Request $request, Workspace $workspace, Board $board)
    {
        // Only organizer can reorder swimlanes
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can reorder swimlanes.');
        }

        $request->validate([
            'swimlaneIds' => 'required|array',
            'swimlaneIds.*' => 'exists:swimlanes,id',
        ]);

        // Verify all swimlanes belong to this board
        $swimlanes = Swimlane::whereIn('id', $request->swimlaneIds)
            ->where('board_id', $board->id)
            ->get();

        if ($swimlanes->count() !== count($request->swimlaneIds)) {
            abort(403, 'Some swimlanes do not belong to this board.');
        }

        // Update positions
        foreach ($request->swimlaneIds as $index => $swimlaneId) {
            Swimlane::where('id', $swimlaneId)->update(['position' => $index]);
        }

        return back();
    }
}
