<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Category;
use App\Models\Task;
use App\Models\ActivityLog;
use App\Models\InviteCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(): Response
    {
        $stats = [
            'total_users' => User::count(),
            'total_tasks' => Task::count(),
            'total_categories' => Category::count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'overdue_tasks' => Task::overdue()->count(),
        ];

        $recent_activities = ActivityLog::with('user')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recent_activities' => $recent_activities,
        ]);
    }

    public function users(Request $request): Response
    {
        $query = User::withCount(['tasks', 'activityLogs']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->get('role'));
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function createUser(): Response
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:member,admin',
            'timezone' => 'required|string|timezone',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'User',
            'model_id' => $user->id,
            'new_values' => $validated,
            'description' => "Created user: {$user->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('admin.users.index')->with('message', 'User created successfully');
    }

    public function editUser(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:member,admin',
            'timezone' => 'required|string|timezone',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $oldValues = $user->toArray();

        if (isset($validated['password']) && !empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'description' => "Updated user: {$user->name}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('admin.users.index')->with('message', 'User updated successfully');
    }

    public function deleteUser(User $user)
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->withErrors(['message' => 'Cannot delete your own account']);
        }

        $userName = $user->name;

        // Log activity before deletion
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'model_type' => 'User',
            'model_id' => $user->id,
            'old_values' => $user->toArray(),
            'description' => "Deleted user: {$userName}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        $user->delete();

        return redirect()->route('admin.users.index')->with('message', 'User deleted successfully');
    }

    public function activityLogs(Request $request): Response
    {
        $query = ActivityLog::with('user');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where('description', 'like', "%{$search}%");
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->get('action'));
        }

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->get('model_type'));
        }

        $logs = $query->latest()->paginate(10);

        $users = User::select('id', 'name')->get();

        return Inertia::render('Admin/ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'filters' => $request->only(['search', 'user_id', 'action', 'model_type']),
        ]);
    }

    public function inviteCodes(Request $request): Response
    {
        $query = InviteCode::with('creator');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where('code', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $status = $request->get('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where('expires_at', '<', now());
            } elseif ($status === 'exhausted') {
                $query->whereColumn('used_count', '>=', 'max_uses');
            }
        }

        $inviteCodes = $query->latest()->paginate(20);

        return Inertia::render('Admin/InviteCodes/Index', [
            'inviteCodes' => $inviteCodes,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function createInviteCode(): Response
    {
        return Inertia::render('Admin/InviteCodes/Create');
    }

    public function storeInviteCode(Request $request)
    {
        $validated = $request->validate([
            'max_uses' => 'required|integer|min:1|max:1000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $inviteCode = InviteCode::create([
            'code' => InviteCode::generateUniqueCode(),
            'max_uses' => $validated['max_uses'],
            'expires_at' => $validated['expires_at'] ?? null,
            'created_by' => Auth::id(),
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'InviteCode',
            'model_id' => $inviteCode->id,
            'new_values' => $inviteCode->toArray(),
            'description' => "Created invite code: {$inviteCode->code}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('admin.invite-codes.index')->with('message', 'Invite code created successfully');
    }

    public function deactivateInviteCode(InviteCode $inviteCode)
    {
        $inviteCode->update(['is_active' => false]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'InviteCode',
            'model_id' => $inviteCode->id,
            'old_values' => ['is_active' => true],
            'new_values' => ['is_active' => false],
            'description' => "Deactivated invite code: {$inviteCode->code}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('admin.invite-codes.index')->with('message', 'Invite code deactivated successfully');
    }

    public function reactivateInviteCode(InviteCode $inviteCode)
    {
        // Only reactivate if not exhausted and not expired
        if ($inviteCode->isExhausted()) {
            return redirect()->back()->withErrors(['message' => 'Cannot reactivate an exhausted invite code']);
        }

        if ($inviteCode->isExpired()) {
            return redirect()->back()->withErrors(['message' => 'Cannot reactivate an expired invite code']);
        }

        $inviteCode->update(['is_active' => true]);

        // Log activity
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'InviteCode',
            'model_id' => $inviteCode->id,
            'old_values' => ['is_active' => false],
            'new_values' => ['is_active' => true],
            'description' => "Reactivated invite code: {$inviteCode->code}",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return redirect()->route('admin.invite-codes.index')->with('message', 'Invite code reactivated successfully');
    }
}
