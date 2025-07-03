<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Models\Reminder;
use App\Services\ActivityLogService;
use App\Services\ReminderService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class NotificationService
{
    public function __construct(
        private ActivityLogService $activityLogService,
        private ReminderService $reminderService
    ) {}

    /**
     * Send task due reminder notification
     */
    public function sendTaskDueReminder(Task $task): array
    {
        try {
            $user = $task->user;

            // Create notification data
            $notificationData = [
                'title' => 'Task Due Reminder',
                'message' => "Your task '{$task->title}' is due soon.",
                'task_id' => $task->id,
                'due_date' => $task->due_date,
                'priority' => $task->priority,
                'type' => 'task_due_reminder'
            ];

            // Send email notification
            if ($user->email_notifications_enabled ?? true) {
                $this->sendEmail($user, 'task-due-reminder', $notificationData);
            }

            // Log activity
            $this->activityLogService->logTaskActivity(
                'reminder_sent',
                $task->id,
                $task->title,
                null,
                ['notification_type' => 'due_reminder'],
                $user->id
            );

            return ['success' => true, 'message' => 'Due reminder sent successfully'];
        } catch (\Exception $e) {
            Log::error('Task due reminder error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send due reminder'];
        }
    }

    /**
     * Send task overdue notification
     */
    public function sendTaskOverdueNotification(Task $task): array
    {
        try {
            $user = $task->user;

            $notificationData = [
                'title' => 'Task Overdue',
                'message' => "Your task '{$task->title}' is now overdue.",
                'task_id' => $task->id,
                'due_date' => $task->due_date,
                'days_overdue' => now()->diffInDays($task->due_date),
                'priority' => $task->priority,
                'type' => 'task_overdue'
            ];

            // Send email notification
            if ($user->email_notifications_enabled ?? true) {
                $this->sendEmail($user, 'task-overdue', $notificationData);
            }

            // Log activity
            $this->activityLogService->logTaskActivity(
                'overdue_notification_sent',
                $task->id,
                $task->title,
                null,
                ['days_overdue' => $notificationData['days_overdue']],
                $user->id
            );

            return ['success' => true, 'message' => 'Overdue notification sent successfully'];
        } catch (\Exception $e) {
            Log::error('Task overdue notification error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send overdue notification'];
        }
    }

    /**
     * Send task completion notification
     */
    public function sendTaskCompletionNotification(Task $task): array
    {
        try {
            $user = $task->user;

            $notificationData = [
                'title' => 'Task Completed',
                'message' => "Congratulations! You've completed '{$task->title}'.",
                'task_id' => $task->id,
                'completed_at' => $task->completed_at,
                'type' => 'task_completed'
            ];

            // Send email notification
            if ($user->email_notifications_enabled ?? true) {
                $this->sendEmail($user, 'task-completed', $notificationData);
            }

            // Log activity
            $this->activityLogService->logTaskActivity(
                'completion_notification_sent',
                $task->id,
                $task->title,
                null,
                ['completed_at' => $task->completed_at->toDateTimeString()],
                $user->id
            );

            return ['success' => true, 'message' => 'Completion notification sent successfully'];
        } catch (\Exception $e) {
            Log::error('Task completion notification error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send completion notification'];
        }
    }

    /**
     * Send custom reminder notification
     */
    public function sendCustomReminder(Reminder $reminder): array
    {
        try {
            $task = $reminder->task;
            $user = $task->user;

            $notificationData = [
                'title' => 'Custom Reminder',
                'message' => $reminder->message ?: "Reminder for task '{$task->title}'",
                'task_id' => $task->id,
                'reminder_id' => $reminder->id,
                'remind_at' => $reminder->remind_at,
                'type' => $reminder->type
            ];

            // Send notification based on type
            switch ($reminder->type) {
                case 'email':
                    $this->sendEmail($user, 'custom-reminder', $notificationData);
                    break;
                case 'sms':
                    $this->sendSMS($user, $notificationData);
                    break;
                case 'notification':
                default:
                    $this->sendInAppNotification($user, $notificationData);
                    break;
            }

            // Mark reminder as sent
            $this->reminderService->markReminderAsSent($reminder);

            return ['success' => true, 'message' => 'Custom reminder sent successfully'];
        } catch (\Exception $e) {
            Log::error('Custom reminder error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send custom reminder'];
        }
    }

    /**
     * Send daily digest notification
     */
    public function sendDailyDigest(User $user): array
    {
        try {
            // Get today's tasks
            $todayTasks = $user->tasks()
                ->whereDate('due_date', today())
                ->where('status', '!=', 'completed')
                ->get();

            // Get overdue tasks
            $overdueTasks = $user->tasks()
                ->where('due_date', '<', today())
                ->where('status', '!=', 'completed')
                ->get();

            // Get upcoming tasks (next 3 days)
            $upcomingTasks = $user->tasks()
                ->whereBetween('due_date', [today()->addDay(), today()->addDays(3)])
                ->where('status', '!=', 'completed')
                ->get();

            $digestData = [
                'title' => 'Daily Task Digest',
                'user_name' => $user->name,
                'today_tasks' => $todayTasks,
                'overdue_tasks' => $overdueTasks,
                'upcoming_tasks' => $upcomingTasks,
                'total_pending' => $user->tasks()->where('status', 'pending')->count(),
                'total_completed_today' => $user->tasks()
                    ->whereDate('completed_at', today())
                    ->count(),
                'type' => 'daily_digest'
            ];

            // Only send if there are tasks to report
            if ($todayTasks->count() > 0 || $overdueTasks->count() > 0 || $upcomingTasks->count() > 0) {
                $this->sendEmail($user, 'daily-digest', $digestData);

                // Log activity
                $this->activityLogService->logUserActivity(
                    'daily_digest_sent',
                    $user->id,
                    $user->name,
                    null,
                    [
                        'today_tasks' => $todayTasks->count(),
                        'overdue_tasks' => $overdueTasks->count(),
                        'upcoming_tasks' => $upcomingTasks->count()
                    ]
                );

                return ['success' => true, 'message' => 'Daily digest sent successfully'];
            }

            return ['success' => true, 'message' => 'No tasks to report in daily digest'];
        } catch (\Exception $e) {
            Log::error('Daily digest error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send daily digest'];
        }
    }

    /**
     * Send weekly summary notification
     */
    public function sendWeeklySummary(User $user): array
    {
        try {
            $startOfWeek = now()->startOfWeek();
            $endOfWeek = now()->endOfWeek();

            // Get week statistics
            $completedThisWeek = $user->tasks()
                ->whereBetween('completed_at', [$startOfWeek, $endOfWeek])
                ->count();

            $createdThisWeek = $user->tasks()
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count();

            $overdueCount = $user->tasks()
                ->where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count();

            // Get productivity metrics
            $productivityScore = $this->calculateProductivityScore($user, $startOfWeek, $endOfWeek);

            $summaryData = [
                'title' => 'Weekly Task Summary',
                'user_name' => $user->name,
                'week_start' => $startOfWeek->format('M d'),
                'week_end' => $endOfWeek->format('M d, Y'),
                'completed_tasks' => $completedThisWeek,
                'created_tasks' => $createdThisWeek,
                'overdue_tasks' => $overdueCount,
                'productivity_score' => $productivityScore,
                'type' => 'weekly_summary'
            ];

            $this->sendEmail($user, 'weekly-summary', $summaryData);

            // Log activity
            $this->activityLogService->logUserActivity(
                'weekly_summary_sent',
                $user->id,
                $user->name,
                null,
                $summaryData
            );

            return ['success' => true, 'message' => 'Weekly summary sent successfully'];
        } catch (\Exception $e) {
            Log::error('Weekly summary error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send weekly summary'];
        }
    }

    /**
     * Process due reminders (for scheduled command)
     */
    public function processDueReminders(): array
    {
        try {
            $dueReminders = $this->reminderService->getRemindersDueForSending();
            $processedCount = 0;
            $failedCount = 0;

            foreach ($dueReminders as $reminder) {
                $result = $this->sendCustomReminder($reminder);
                if ($result['success']) {
                    $processedCount++;
                } else {
                    $failedCount++;
                }
            }

            return [
                'success' => true,
                'message' => "Processed {$processedCount} reminders, {$failedCount} failed",
                'processed' => $processedCount,
                'failed' => $failedCount
            ];
        } catch (\Exception $e) {
            Log::error('Process due reminders error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to process due reminders'];
        }
    }

    /**
     * Send bulk notifications to multiple users
     */
    public function sendBulkNotification(Collection $users, array $notificationData): array
    {
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];

        foreach ($users as $user) {
            try {
                $this->sendEmail($user, $notificationData['template'], $notificationData['data']);
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "User {$user->email}: {$e->getMessage()}";
                Log::error("Bulk notification failed for user {$user->id}: " . $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Get notification preferences for user
     */
    public function getNotificationPreferences(User $user): array
    {
        return [
            'email_notifications' => $user->email_notifications_enabled ?? true,
            'sms_notifications' => $user->sms_notifications_enabled ?? false,
            'push_notifications' => $user->push_notifications_enabled ?? true,
            'daily_digest' => $user->daily_digest_enabled ?? true,
            'weekly_summary' => $user->weekly_summary_enabled ?? true,
            'reminder_notifications' => $user->reminder_notifications_enabled ?? true,
        ];
    }

    /**
     * Update notification preferences for user
     */
    public function updateNotificationPreferences(User $user, array $preferences): bool
    {
        try {
            $user->update([
                'email_notifications_enabled' => $preferences['email_notifications'] ?? true,
                'sms_notifications_enabled' => $preferences['sms_notifications'] ?? false,
                'push_notifications_enabled' => $preferences['push_notifications'] ?? true,
                'daily_digest_enabled' => $preferences['daily_digest'] ?? true,
                'weekly_summary_enabled' => $preferences['weekly_summary'] ?? true,
                'reminder_notifications_enabled' => $preferences['reminder_notifications'] ?? true,
            ]);

            // Log activity
            $this->activityLogService->logUserActivity(
                'notification_preferences_updated',
                $user->id,
                $user->name,
                null,
                $preferences
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Update notification preferences error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email notification
     */
    private function sendEmail(User $user, string $template, array $data): void
    {
        // This would integrate with your mail system
        // For now, we'll just log it
        Log::info("Email notification sent to {$user->email}", [
            'template' => $template,
            'data' => $data
        ]);

        // In a real implementation, you would do:
        // Mail::to($user)->send(new TaskNotificationMail($template, $data));
    }

    /**
     * Send SMS notification
     */
    private function sendSMS(User $user, array $data): void
    {
        // This would integrate with SMS service (Twilio, etc.)
        Log::info("SMS notification sent to {$user->phone}", [
            'message' => $data['message']
        ]);
    }

    /**
     * Send in-app notification
     */
    private function sendInAppNotification(User $user, array $data): void
    {
        // This would create an in-app notification record
        Log::info("In-app notification sent to user {$user->id}", $data);
    }

    /**
     * Calculate productivity score for user
     */
    private function calculateProductivityScore(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $totalTasks = $user->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $completedTasks = $user->tasks()
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->count();

        $overdueTasks = $user->tasks()
            ->where('due_date', '<', $endDate)
            ->where('status', '!=', 'completed')
            ->count();

        if ($totalTasks === 0) {
            return 100; // No tasks = perfect score
        }

        // Calculate score based on completion rate and overdue penalty
        $completionRate = ($completedTasks / $totalTasks) * 100;
        $overduePenalty = min($overdueTasks * 10, 50); // Max 50% penalty

        return max(0, min(100, intval($completionRate - $overduePenalty)));
    }
}
