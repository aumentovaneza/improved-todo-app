<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Get all users with optional filters
     */
    public function getAllUsers(array $filters = [], array $relations = []): LengthAwarePaginator
    {
        $query = User::withCount(['tasks', 'activityLogs']);

        if (!empty($relations)) {
            $query->with($relations);
        }

        $this->applyFilters($query, $filters);

        return $query->orderBy('created_at', 'desc')->paginate(20);
    }

    /**
     * Create a new user
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Update a user
     */
    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Delete a user
     */
    public function delete(User $user): bool
    {
        return $user->delete();
    }

    /**
     * Find user by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?User
    {
        return User::with($relations)->find($id);
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Get users with task counts
     */
    public function getUsersWithTaskCounts(): Collection
    {
        return User::withCount([
            'tasks',
            'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'completed');
            },
            'tasks as pending_tasks_count' => function ($query) {
                $query->where('status', 'pending');
            },
            'tasks as overdue_tasks_count' => function ($query) {
                $query->overdue();
            }
        ])->get();
    }

    /**
     * Get users with activity log counts
     */
    public function getUsersWithActivityCounts(): Collection
    {
        return User::withCount('activityLogs')->get();
    }

    /**
     * Get user statistics
     */
    public function getUserStats(User $user): array
    {
        $taskStats = $user->tasks()
            ->selectRaw('
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress_tasks,
                SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_tasks
            ')
            ->first();

        $overdueCount = $user->tasks()->overdue()->count();
        $dueTodayCount = $user->tasks()->whereDate('due_date', today())->count();
        $categoryCount = $user->categories()->where('is_active', true)->count();
        $activityCount = $user->activityLogs()->count();

        return [
            'total_tasks' => $taskStats->total_tasks ?? 0,
            'completed_tasks' => $taskStats->completed_tasks ?? 0,
            'pending_tasks' => $taskStats->pending_tasks ?? 0,
            'in_progress_tasks' => $taskStats->in_progress_tasks ?? 0,
            'cancelled_tasks' => $taskStats->cancelled_tasks ?? 0,
            'overdue_tasks' => $overdueCount,
            'due_today_tasks' => $dueTodayCount,
            'categories_count' => $categoryCount,
            'activity_logs_count' => $activityCount,
        ];
    }

    /**
     * Get admin users
     */
    public function getAdminUsers(): Collection
    {
        return User::where('role', 'admin')->get();
    }

    /**
     * Get member users
     */
    public function getMemberUsers(): Collection
    {
        return User::where('role', 'member')->get();
    }

    /**
     * Check if email exists
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $query = User::where('email', $email);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role): Collection
    {
        return User::where('role', $role)->orderBy('name')->get();
    }

    /**
     * Get users by timezone
     */
    public function getUsersByTimezone(string $timezone): Collection
    {
        return User::where('timezone', $timezone)->orderBy('name')->get();
    }

    /**
     * Update user timezone
     */
    public function updateTimezone(User $user, string $timezone): User
    {
        $user->update(['timezone' => $timezone]);
        return $user->fresh();
    }

    /**
     * Update user preferences
     */
    public function updatePreferences(User $user, array $preferences): User
    {
        $allowedPreferences = ['timezone', 'news_category'];
        $filteredPreferences = array_intersect_key($preferences, array_flip($allowedPreferences));

        $user->update($filteredPreferences);
        return $user->fresh();
    }

    /**
     * Apply filters to query
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        // Search functionality
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        // Filter by timezone
        if (!empty($filters['timezone'])) {
            $query->where('timezone', $filters['timezone']);
        }

        // Filter by email verification status
        if (isset($filters['email_verified'])) {
            if ($filters['email_verified']) {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // Filter by creation date range
        if (!empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (!empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }
    }
}
