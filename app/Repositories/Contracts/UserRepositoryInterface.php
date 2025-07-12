<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    /**
     * Get all users with optional filters
     */
    public function getAllUsers(array $filters = [], array $relations = []): LengthAwarePaginator;

    /**
     * Create a new user
     */
    public function create(array $data): User;

    /**
     * Update a user
     */
    public function update(User $user, array $data): User;

    /**
     * Delete a user
     */
    public function delete(User $user): bool;

    /**
     * Find user by ID with relations
     */
    public function findWithRelations(int $id, array $relations = []): ?User;

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User;

    /**
     * Get users with task counts
     */
    public function getUsersWithTaskCounts(): Collection;

    /**
     * Get users with activity log counts
     */
    public function getUsersWithActivityCounts(): Collection;

    /**
     * Get user statistics
     */
    public function getUserStats(User $user): array;

    /**
     * Get admin users
     */
    public function getAdminUsers(): Collection;

    /**
     * Get member users
     */
    public function getMemberUsers(): Collection;

    /**
     * Check if email exists
     */
    public function emailExists(string $email, ?int $excludeId = null): bool;

    /**
     * Get users by role
     */
    public function getUsersByRole(string $role): Collection;

    /**
     * Get users by timezone
     */
    public function getUsersByTimezone(string $timezone): Collection;

    /**
     * Update user timezone
     */
    public function updateTimezone(User $user, string $timezone): User;

    /**
     * Update user preferences
     */
    public function updatePreferences(User $user, array $preferences): User;
}
