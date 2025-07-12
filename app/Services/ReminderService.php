<?php

namespace App\Services;

use App\Models\Reminder;
use App\Models\Task;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReminderService
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    /**
     * Get all reminders for a user
     */
    public function getRemindersForUser(int $userId): Collection
    {
        return Reminder::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with(['task'])
            ->orderBy('remind_at')
            ->get();
    }

    /**
     * Get pending reminders for a user
     */
    public function getPendingRemindersForUser(int $userId): Collection
    {
        return Reminder::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('remind_at', '>', now())
            ->where('is_sent', false)
            ->with(['task'])
            ->orderBy('remind_at')
            ->get();
    }

    /**
     * Get overdue reminders for a user
     */
    public function getOverdueRemindersForUser(int $userId): Collection
    {
        return Reminder::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('remind_at', '<=', now())
            ->where('is_sent', false)
            ->with(['task'])
            ->orderBy('remind_at')
            ->get();
    }

    /**
     * Get reminders for a specific task
     */
    public function getRemindersForTask(int $taskId, int $userId): Collection
    {
        return Reminder::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->where('task_id', $taskId)
            ->orderBy('remind_at')
            ->get();
    }

    /**
     * Create a new reminder with validation
     */
    public function createReminder(array $data, int $userId): Reminder
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate task ownership
            $task = Task::where('id', $data['task_id'])
                ->where('user_id', $userId)
                ->firstOrFail();

            // Validate reminder time
            $remindAt = Carbon::parse($data['remind_at']);
            if ($remindAt->isPast()) {
                throw new \InvalidArgumentException('Reminder time cannot be in the past.');
            }

            // Validate reminder time is before task due date (if exists)
            if ($task->due_date && $remindAt->isAfter($task->due_date)) {
                throw new \InvalidArgumentException('Reminder time cannot be after the task due date.');
            }

            // Set defaults
            $data['is_sent'] = false;
            $data['type'] = $data['type'] ?? 'notification';

            // Create the reminder
            $reminder = Reminder::create($data);

            // Log activity
            $this->activityLogService->logReminderActivity(
                'create',
                $reminder->id,
                $reminder->type,
                null,
                $data,
                $userId
            );

            return $reminder->load('task');
        });
    }

    /**
     * Update an existing reminder
     */
    public function updateReminder(Reminder $reminder, array $data, int $userId): Reminder
    {
        return DB::transaction(function () use ($reminder, $data, $userId) {
            // Ensure user owns the task associated with this reminder
            if ($reminder->task->user_id !== $userId) {
                throw new \InvalidArgumentException('You do not have permission to update this reminder.');
            }

            $oldValues = $reminder->toArray();

            // Validate reminder time if being updated
            if (isset($data['remind_at'])) {
                $remindAt = Carbon::parse($data['remind_at']);
                if ($remindAt->isPast()) {
                    throw new \InvalidArgumentException('Reminder time cannot be in the past.');
                }

                // Validate reminder time is before task due date (if exists)
                if ($reminder->task->due_date && $remindAt->isAfter($reminder->task->due_date)) {
                    throw new \InvalidArgumentException('Reminder time cannot be after the task due date.');
                }
            }

            // Update the reminder
            $reminder->update($data);

            // Log activity
            $this->activityLogService->logReminderActivity(
                'update',
                $reminder->id,
                $reminder->type,
                $oldValues,
                $data,
                $userId
            );

            return $reminder->fresh(['task']);
        });
    }

    /**
     * Delete a reminder
     */
    public function deleteReminder(Reminder $reminder, int $userId): bool
    {
        // Ensure user owns the task associated with this reminder
        if ($reminder->task->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to delete this reminder.');
        }

        return DB::transaction(function () use ($reminder, $userId) {
            $oldValues = $reminder->toArray();

            // Log activity before deletion
            $this->activityLogService->logReminderActivity(
                'delete',
                $reminder->id,
                $reminder->type,
                $oldValues,
                null,
                $userId
            );

            return $reminder->delete();
        });
    }

    /**
     * Mark reminder as sent
     */
    public function markReminderAsSent(Reminder $reminder): Reminder
    {
        return DB::transaction(function () use ($reminder) {
            $oldValues = ['is_sent' => $reminder->is_sent];

            $reminder->update([
                'is_sent' => true,
                'sent_at' => now()
            ]);

            // Log activity
            $this->activityLogService->logReminderActivity(
                'sent',
                $reminder->id,
                $reminder->type,
                $oldValues,
                ['is_sent' => true, 'sent_at' => now()->toDateTimeString()]
            );

            return $reminder;
        });
    }

    /**
     * Get reminders due for sending (for scheduled tasks)
     */
    public function getRemindersDueForSending(): Collection
    {
        return Reminder::where('remind_at', '<=', now())
            ->where('is_sent', false)
            ->with(['task.user'])
            ->get();
    }

    /**
     * Process due reminders (for scheduled command)
     */
    public function processDueReminders(): int
    {
        $dueReminders = $this->getRemindersDueForSending();
        $processedCount = 0;

        foreach ($dueReminders as $reminder) {
            try {
                // Here you would integrate with your notification system
                // For now, we'll just mark as sent
                $this->markReminderAsSent($reminder);
                $processedCount++;
            } catch (\Exception $e) {
                // Log error but continue processing other reminders
                Log::error("Failed to process reminder {$reminder->id}: " . $e->getMessage());
            }
        }

        return $processedCount;
    }

    /**
     * Create multiple reminders for a task
     */
    public function createMultipleReminders(int $taskId, array $reminderTimes, int $userId): Collection
    {
        return DB::transaction(function () use ($taskId, $reminderTimes, $userId) {
            // Validate task ownership
            $task = Task::where('id', $taskId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $reminders = collect();

            foreach ($reminderTimes as $reminderData) {
                $data = array_merge($reminderData, ['task_id' => $taskId]);
                $reminder = $this->createReminder($data, $userId);
                $reminders->push($reminder);
            }

            return $reminders;
        });
    }

    /**
     * Get reminder statistics for a user
     */
    public function getReminderStatsForUser(int $userId): array
    {
        $baseQuery = Reminder::whereHas('task', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        });

        $totalReminders = $baseQuery->count();
        $sentReminders = $baseQuery->where('is_sent', true)->count();
        $pendingReminders = $baseQuery->where('is_sent', false)
            ->where('remind_at', '>', now())
            ->count();
        $overdueReminders = $baseQuery->where('is_sent', false)
            ->where('remind_at', '<=', now())
            ->count();

        return [
            'total_reminders' => $totalReminders,
            'sent_reminders' => $sentReminders,
            'pending_reminders' => $pendingReminders,
            'overdue_reminders' => $overdueReminders,
            'completion_rate' => $totalReminders > 0 ? round(($sentReminders / $totalReminders) * 100, 2) : 0,
        ];
    }

    /**
     * Snooze a reminder (postpone it)
     */
    public function snoozeReminder(Reminder $reminder, int $minutes, int $userId): Reminder
    {
        // Ensure user owns the task associated with this reminder
        if ($reminder->task->user_id !== $userId) {
            throw new \InvalidArgumentException('You do not have permission to snooze this reminder.');
        }

        return DB::transaction(function () use ($reminder, $minutes, $userId) {
            $oldValues = ['remind_at' => $reminder->remind_at];
            $newRemindAt = Carbon::parse($reminder->remind_at)->addMinutes($minutes);

            $reminder->update(['remind_at' => $newRemindAt]);

            // Log activity
            $this->activityLogService->logReminderActivity(
                'snooze',
                $reminder->id,
                $reminder->type,
                $oldValues,
                ['remind_at' => $newRemindAt->toDateTimeString(), 'snoozed_minutes' => $minutes],
                $userId
            );

            return $reminder->fresh(['task']);
        });
    }

    /**
     * Delete all reminders for a task
     */
    public function deleteRemindersForTask(int $taskId, int $userId): int
    {
        return DB::transaction(function () use ($taskId, $userId) {
            // Validate task ownership
            $task = Task::where('id', $taskId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $reminders = $this->getRemindersForTask($taskId, $userId);
            $deletedCount = 0;

            foreach ($reminders as $reminder) {
                $this->deleteReminder($reminder, $userId);
                $deletedCount++;
            }

            return $deletedCount;
        });
    }

    /**
     * Clean up old sent reminders
     */
    public function cleanupOldReminders(int $daysToKeep = 30): int
    {
        $cutoffDate = now()->subDays($daysToKeep);

        return Reminder::where('is_sent', true)
            ->where('sent_at', '<', $cutoffDate)
            ->delete();
    }
}
