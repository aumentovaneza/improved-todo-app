<?php

namespace App\Http\Controllers;

use App\Models\InviteCode;
use App\Models\User;
use App\Services\CategoryService;
use App\Services\TaskService;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        private UserService $userService,
        private TaskService $taskService,
        private CategoryService $categoryService
    ) {}

    public function dashboard(): Response
    {
        $userStats = $this->userService->getUserStatistics();
        $taskStats = $this->taskService->getGlobalTaskStats();
        $categoryStats = $this->categoryService->getGlobalCategoryStats();

        $stats = array_merge($userStats, $taskStats, $categoryStats);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }

    public function users(Request $request): Response
    {
        $filters = $request->only(['search', 'role']);
        $users = $this->userService->getAllUsers($filters);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $filters,
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
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:member,admin',
            'timezone' => 'required|string|timezone',
        ]);

        try {
            $this->userService->createUser($validated, Auth::id());

            return redirect()->route('admin.users.index')->with('message', 'User created successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create user. Please try again.'])->withInput();
        }
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
            'email' => 'required|string|email|max:255',
            'role' => 'required|in:member,admin',
            'timezone' => 'nullable|string|timezone',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        try {
            $this->userService->updateUser($user, $validated, Auth::id());

            return redirect()->route('admin.users.index')->with('message', 'User updated successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update user. Please try again.'])->withInput();
        }
    }

    public function deleteUser(User $user)
    {
        try {
            $this->userService->deleteUser($user, Auth::id());

            return redirect()->route('admin.users.index')->with('message', 'User deleted successfully');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete user. Please try again.']);
        }
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

        return redirect()->route('admin.invite-codes.index')->with('message', 'Invite code created successfully');
    }

    public function deactivateInviteCode(InviteCode $inviteCode)
    {
        $inviteCode->update(['is_active' => false]);

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

        return redirect()->route('admin.invite-codes.index')->with('message', 'Invite code reactivated successfully');
    }
}
