<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /**
     * Log an activity
     */
    public function log(
        string $action,
        string $modelType,
        int $modelId,
        string $description,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => $ipAddress ?? request()?->ip(),
            'user_agent' => $userAgent ?? request()?->userAgent(),
        ]);
    }

    /**
     * Log task activity
     */
    public function logTaskActivity(
        string $action,
        int $taskId,
        string $taskTitle,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created task: {$taskTitle}",
            'update' => "Updated task: {$taskTitle}",
            'delete' => "Deleted task: {$taskTitle}",
            'complete' => "Completed task: {$taskTitle}",
            'reopen' => "Reopened task: {$taskTitle}",
            'cancel' => "Cancelled task: {$taskTitle}",
            'start' => "Started task: {$taskTitle}",
            'pause' => "Paused task: {$taskTitle}",
            'reschedule' => "Rescheduled task: {$taskTitle}",
        ];

        return $this->log(
            $action,
            'Task',
            $taskId,
            $descriptions[$action] ?? "Task action: {$action} - {$taskTitle}",
            $oldValues,
            $newValues,
            $userId
        );
    }

    /**
     * Log category activity
     */
    public function logCategoryActivity(
        string $action,
        int $categoryId,
        string $categoryName,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created category: {$categoryName}",
            'update' => "Updated category: {$categoryName}",
            'delete' => "Deleted category: {$categoryName}",
            'deactivate' => "Deactivated category: {$categoryName}",
            'reactivate' => "Reactivated category: {$categoryName}",
        ];

        return $this->log(
            $action,
            'Category',
            $categoryId,
            $descriptions[$action] ?? "Category action: {$action} - {$categoryName}",
            $oldValues,
            $newValues,
            $userId
        );
    }

    /**
     * Log user activity
     */
    public function logUserActivity(
        string $action,
        int $userId,
        string $userName,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $performedBy = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created user: {$userName}",
            'update' => "Updated user: {$userName}",
            'delete' => "Deleted user: {$userName}",
            'profile_update' => "Updated profile: {$userName}",
            'password_update' => "Updated password: {$userName}",
            'timezone_update' => "Updated timezone: {$userName}",
            'preferences_update' => "Updated preferences: {$userName}",
            'promote_to_admin' => "Promoted user to admin: {$userName}",
            'demote_to_member' => "Demoted user to member: {$userName}",
        ];

        return $this->log(
            $action,
            'User',
            $userId,
            $descriptions[$action] ?? "User action: {$action} - {$userName}",
            $oldValues,
            $newValues,
            $performedBy
        );
    }

    /**
     * Log subtask activity
     */
    public function logSubtaskActivity(
        string $action,
        int $subtaskId,
        string $subtaskTitle,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created subtask: {$subtaskTitle}",
            'update' => "Updated subtask: {$subtaskTitle}",
            'delete' => "Deleted subtask: {$subtaskTitle}",
            'complete' => "Completed subtask: {$subtaskTitle}",
            'reopen' => "Reopened subtask: {$subtaskTitle}",
        ];

        return $this->log(
            $action,
            'Subtask',
            $subtaskId,
            $descriptions[$action] ?? "Subtask action: {$action} - {$subtaskTitle}",
            $oldValues,
            $newValues,
            $userId
        );
    }

    /**
     * Log reminder activity
     */
    public function logReminderActivity(
        string $action,
        int $reminderId,
        string $reminderType,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created {$reminderType} reminder",
            'update' => "Updated {$reminderType} reminder",
            'delete' => "Deleted {$reminderType} reminder",
            'sent' => "Sent {$reminderType} reminder",
        ];

        return $this->log(
            $action,
            'Reminder',
            $reminderId,
            $descriptions[$action] ?? "Reminder action: {$action} - {$reminderType}",
            $oldValues,
            $newValues,
            $userId
        );
    }

    /**
     * Log tag activity
     */
    public function logTagActivity(
        string $action,
        int $tagId,
        string $tagName,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $descriptions = [
            'create' => "Created tag: {$tagName}",
            'update' => "Updated tag: {$tagName}",
            'delete' => "Deleted tag: {$tagName}",
        ];

        return $this->log(
            $action,
            'Tag',
            $tagId,
            $descriptions[$action] ?? "Tag action: {$action} - {$tagName}",
            $oldValues,
            $newValues,
            $userId
        );
    }

    /**
     * Get paginated activity logs with filters
     */
    public function getActivityLogs(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = ActivityLog::with('user');

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where('description', 'like', "%{$filters['search']}%");
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['model_type'])) {
            $query->where('model_type', $filters['model_type']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get recent activity logs
     */
    public function getRecentActivityLogs(int $limit = 5): Collection
    {
        return ActivityLog::with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity logs for a specific user
     */
    public function getUserActivityLogs(int $userId, int $limit = 10): Collection
    {
        return ActivityLog::where('user_id', $userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get activity logs for a specific model
     */
    public function getModelActivityLogs(string $modelType, int $modelId, int $limit = 10): Collection
    {
        return ActivityLog::where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Clean up old activity logs
     */
    public function cleanupOldLogs(int $daysToKeep = 90): int
    {
        return ActivityLog::where('created_at', '<', now()->subDays($daysToKeep))->delete();
    }

    /**
     * Get activity statistics
     */
    public function getActivityStats(int $days = 30): array
    {
        $startDate = now()->subDays($days);

        $stats = ActivityLog::where('created_at', '>=', $startDate)
            ->selectRaw('
                COUNT(*) as total_activities,
                COUNT(DISTINCT user_id) as active_users,
                action,
                model_type,
                COUNT(*) as count
            ')
            ->groupBy(['action', 'model_type'])
            ->get();

        $totalActivities = $stats->sum('count');
        $activeUsers = ActivityLog::where('created_at', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        $actionStats = $stats->groupBy('action')->map(function ($items) {
            return $items->sum('count');
        });

        $modelStats = $stats->groupBy('model_type')->map(function ($items) {
            return $items->sum('count');
        });

        return [
            'total_activities' => $totalActivities,
            'active_users' => $activeUsers,
            'actions' => $actionStats->toArray(),
            'models' => $modelStats->toArray(),
            'period_days' => $days,
        ];
    }
}
