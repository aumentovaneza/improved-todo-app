<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\Board;
use App\Models\Swimlane;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class WorkspaceController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $organizedWorkspaces = $user->organizedWorkspaces()
            ->with(['boards' => function ($query) {
                $query->where('is_active', true)->orderBy('position');
            }])
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        $collaboratingWorkspaces = $user->collaboratingWorkspaces()
            ->with(['boards' => function ($query) {
                $query->where('is_active', true)->orderBy('position');
            }])
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Workspaces/Index', [
            'organizedWorkspaces' => $organizedWorkspaces,
            'collaboratingWorkspaces' => $collaboratingWorkspaces,
        ]);
    }

    public function show(Workspace $workspace)
    {
        // Check if user has access to this workspace
        if (!$workspace->isMember(Auth::user())) {
            abort(403, 'You do not have access to this workspace.');
        }

        $workspace->load([
            'boards' => function ($query) {
                $query->where('is_active', true)->orderBy('position');
            },
            'organizer',
            'collaborators'
        ]);

        return Inertia::render('Workspaces/Show', [
            'workspace' => $workspace,
            'isOrganizer' => $workspace->isOrganizer(Auth::user()),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $workspace = Workspace::create([
            'organizer_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
        ]);

        // Create default swimlanes for the first board
        $board = $workspace->boards()->create([
            'name' => 'Main Board',
            'description' => 'Default board for ' . $workspace->name,
            'position' => 0,
        ]);

        // Create default swimlanes
        $defaultSwimlanes = [
            ['name' => 'To Do', 'color' => '#EF4444', 'position' => 0],
            ['name' => 'In Progress', 'color' => '#F59E0B', 'position' => 1],
            ['name' => 'Review', 'color' => '#3B82F6', 'position' => 2],
            ['name' => 'Done', 'color' => '#10B981', 'position' => 3],
        ];

        foreach ($defaultSwimlanes as $swimlaneData) {
            $board->swimlanes()->create($swimlaneData);
        }

        return redirect()->route('workspaces.show', $workspace)
            ->with('success', 'Workspace created successfully!');
    }

    public function update(Request $request, Workspace $workspace)
    {
        // Only organizer can update workspace
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can update this workspace.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $workspace->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return back()->with('success', 'Workspace updated successfully!');
    }

    public function destroy(Workspace $workspace)
    {
        // Only organizer can delete workspace
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can delete this workspace.');
        }

        $workspace->update(['is_active' => false]);

        return redirect()->route('workspaces.index')
            ->with('success', 'Workspace deleted successfully!');
    }

    public function addCollaborator(Request $request, Workspace $workspace)
    {
        // Only organizer can add collaborators
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can add collaborators.');
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:collaborator,admin',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if ($workspace->isOrganizer($user) || $workspace->isCollaborator($user)) {
            return back()->withErrors(['email' => 'User is already a member of this workspace.']);
        }

        $workspace->collaborators()->attach($user->id, [
            'role' => $request->role,
            'joined_at' => now(),
        ]);

        return back()->with('success', 'Collaborator added successfully!');
    }

    public function removeCollaborator(Request $request, Workspace $workspace, $userId)
    {
        // Only organizer can remove collaborators
        if (!$workspace->isOrganizer(Auth::user())) {
            abort(403, 'Only the organizer can remove collaborators.');
        }

        $workspace->collaborators()->detach($userId);

        return back()->with('success', 'Collaborator removed successfully!');
    }
}
