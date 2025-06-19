<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Category;
use App\Models\Task;
use App\Models\ActivityLog;
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
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

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
            ->take(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recent_activities' => $recent_activities,
        ]);
    }

    public function users(Request $request): Response
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

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
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        return Inertia::render('Admin/Users/Create');
    }

    public function storeUser(Request $request): JsonResponse
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:member,admin',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
        ]);
    }

    public function editUser(User $user): Response
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:member,admin',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function deleteUser(User $user): JsonResponse
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        if ($user->id === Auth::id()) {
            return response()->json([
                'message' => 'Cannot delete your own account',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    public function categories(Request $request): Response
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        $query = Category::withCount('tasks');

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query->orderBy('name')->paginate(20);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function activityLogs(Request $request): Response
    {
        if (!Auth::user() || !Auth::user()->isAdmin()) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        $query = ActivityLog::with('user');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->get('action'));
        }

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->get('model_type'));
        }

        $logs = $query->latest()->paginate(50);

        $users = User::select('id', 'name')->get();

        return Inertia::render('Admin/ActivityLogs/Index', [
            'logs' => $logs,
            'users' => $users,
            'filters' => $request->only(['user_id', 'action', 'model_type']),
        ]);
    }
}
