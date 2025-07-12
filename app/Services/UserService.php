<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get all users with pagination and filters
     */
    public function getAllUsers(array $filters = []): LengthAwarePaginator
    {
        return $this->userRepository->getAllUsers($filters);
    }

    /**
     * Create a new user with validation and business logic
     */
    public function createUser(array $data, int $createdBy): User
    {
        return DB::transaction(function () use ($data, $createdBy) {
            // Check if email already exists
            if ($this->userRepository->emailExists($data['email'])) {
                throw new \InvalidArgumentException('A user with this email already exists.');
            }

            // Validate role
            if (!in_array($data['role'], ['admin', 'member'])) {
                throw new \InvalidArgumentException('Invalid user role.');
            }

            // Hash password if provided
            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            // Set default timezone if not provided
            $data['timezone'] = $data['timezone'] ?? 'UTC';

            // Create the user
            $user = $this->userRepository->create($data);

            // Log activity
            $this->activityLogService->logUserActivity('create', $user->id, $user->name, null, $data, $createdBy);

            return $user;
        });
    }

    /**
     * Update an existing user
     */
    public function updateUser(User $user, array $data, int $updatedBy): User
    {
        return DB::transaction(function () use ($user, $data, $updatedBy) {
            $oldValues = $user->toArray();

            // Check if email already exists (excluding current user)
            if (isset($data['email']) && $this->userRepository->emailExists($data['email'], $user->id)) {
                throw new \InvalidArgumentException('A user with this email already exists.');
            }

            // Validate role if provided
            if (isset($data['role']) && !in_array($data['role'], ['admin', 'member'])) {
                throw new \InvalidArgumentException('Invalid user role.');
            }

            // Hash password if provided
            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                // Remove password from update data if empty
                unset($data['password']);
            }

            // Update the user
            $updatedUser = $this->userRepository->update($user, $data);

            // Log activity
            $this->activityLogService->logUserActivity('update', $updatedUser->id, $updatedUser->name, $oldValues, $data, $updatedBy);

            return $updatedUser;
        });
    }

    /**
     * Delete a user
     */
    public function deleteUser(User $user, int $deletedBy): bool
    {
        // Prevent self-deletion
        if ($user->id === $deletedBy) {
            throw new \InvalidArgumentException('You cannot delete your own account.');
        }

        return DB::transaction(function () use ($user, $deletedBy) {
            $oldValues = $user->toArray();

            // Log activity before deletion
            $this->activityLogService->logUserActivity('delete', $user->id, $user->name, $oldValues, null, $deletedBy);

            return $this->userRepository->delete($user);
        });
    }

    /**
     * Update user profile (for authenticated user)
     */
    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $oldValues = $user->toArray();

            // Check if email already exists (excluding current user)
            if (isset($data['email']) && $this->userRepository->emailExists($data['email'], $user->id)) {
                throw new \InvalidArgumentException('A user with this email already exists.');
            }

            // Only allow certain fields to be updated in profile
            $allowedFields = ['name', 'email', 'timezone', 'news_category'];
            $filteredData = array_intersect_key($data, array_flip($allowedFields));

            // Update the user
            $updatedUser = $this->userRepository->update($user, $filteredData);

            // Log activity
            $this->activityLogService->logUserActivity('profile_update', $updatedUser->id, $updatedUser->name, $oldValues, $filteredData, $user->id);

            return $updatedUser;
        });
    }

    /**
     * Update user password
     */
    public function updatePassword(User $user, string $currentPassword, string $newPassword): User
    {
        // Verify current password
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \InvalidArgumentException('Current password is incorrect.');
        }

        return DB::transaction(function () use ($user, $newPassword) {
            $oldValues = ['password' => '[HIDDEN]'];
            $newValues = ['password' => '[HIDDEN]'];

            // Update password
            $updatedUser = $this->userRepository->update($user, [
                'password' => Hash::make($newPassword)
            ]);

            // Log activity
            $this->activityLogService->logUserActivity('password_update', $updatedUser->id, $updatedUser->name, $oldValues, $newValues, $user->id);

            return $updatedUser;
        });
    }

    /**
     * Get user statistics
     */
    public function getUserStats(User $user): array
    {
        return $this->userRepository->getUserStats($user);
    }

    /**
     * Get global user statistics (for admin dashboard)
     */
    public function getUserStatistics(): array
    {
        return [
            'total_users' => User::count(),
        ];
    }

    /**
     * Get users with task counts
     */
    public function getUsersWithTaskCounts(): Collection
    {
        return $this->userRepository->getUsersWithTaskCounts();
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role): Collection
    {
        return $this->userRepository->getUsersByRole($role);
    }

    /**
     * Find user by email
     */
    public function findUserByEmail(string $email): ?User
    {
        return $this->userRepository->findByEmail($email);
    }

    /**
     * Update user timezone
     */
    public function updateUserTimezone(User $user, string $timezone): User
    {
        return DB::transaction(function () use ($user, $timezone) {
            $oldValues = ['timezone' => $user->timezone];

            $updatedUser = $this->userRepository->updateTimezone($user, $timezone);

            // Log activity
            $this->activityLogService->logUserActivity('timezone_update', $updatedUser->id, $updatedUser->name, $oldValues, ['timezone' => $timezone], $user->id);

            return $updatedUser;
        });
    }

    /**
     * Update user preferences
     */
    public function updateUserPreferences(User $user, array $preferences): User
    {
        return DB::transaction(function () use ($user, $preferences) {
            $oldValues = $user->only(array_keys($preferences));

            $updatedUser = $this->userRepository->updatePreferences($user, $preferences);

            // Log activity
            $this->activityLogService->logUserActivity('preferences_update', $updatedUser->id, $updatedUser->name, $oldValues, $preferences, $user->id);

            return $updatedUser;
        });
    }

    /**
     * Get admin users
     */
    public function getAdminUsers(): Collection
    {
        return $this->userRepository->getAdminUsers();
    }

    /**
     * Get member users
     */
    public function getMemberUsers(): Collection
    {
        return $this->userRepository->getMemberUsers();
    }

    /**
     * Promote user to admin
     */
    public function promoteToAdmin(User $user, int $promotedBy): User
    {
        if ($user->role === 'admin') {
            throw new \InvalidArgumentException('User is already an admin.');
        }

        return DB::transaction(function () use ($user, $promotedBy) {
            $oldValues = ['role' => $user->role];

            $updatedUser = $this->userRepository->update($user, ['role' => 'admin']);

            // Log activity
            $this->activityLogService->logUserActivity('promote_to_admin', $updatedUser->id, $updatedUser->name, $oldValues, ['role' => 'admin'], $promotedBy);

            return $updatedUser;
        });
    }

    /**
     * Demote user to member
     */
    public function demoteToMember(User $user, int $demotedBy): User
    {
        if ($user->role === 'member') {
            throw new \InvalidArgumentException('User is already a member.');
        }

        // Prevent self-demotion
        if ($user->id === $demotedBy) {
            throw new \InvalidArgumentException('You cannot demote yourself.');
        }

        return DB::transaction(function () use ($user, $demotedBy) {
            $oldValues = ['role' => $user->role];

            $updatedUser = $this->userRepository->update($user, ['role' => 'member']);

            // Log activity
            $this->activityLogService->logUserActivity('demote_to_member', $updatedUser->id, $updatedUser->name, $oldValues, ['role' => 'member'], $demotedBy);

            return $updatedUser;
        });
    }
}
