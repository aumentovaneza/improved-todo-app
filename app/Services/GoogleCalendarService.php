<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\TaskService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GoogleCalendarService
{
    private $client;
    private $service;

    public function __construct(
        private ActivityLogService $activityLogService,
        private TaskService $taskService
    ) {
        $this->initializeClient();
    }

    /**
     * Initialize Google Client
     */
    private function initializeClient(): void
    {
        // Check if Google classes are available using string class names
        if (!class_exists('Google\Client') || !class_exists('Google\Service\Calendar')) {
            Log::warning('Google API client classes not available. Google Calendar features will be disabled.');
            $this->client = null;
            return;
        }

        $clientClass = 'Google\Client';
        $calendarClass = 'Google\Service\Calendar';
        
        $this->client = new $clientClass();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect'));
        $this->client->addScope($calendarClass::CALENDAR);
    }

    /**
     * Get Google OAuth authorization URL
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    /**
     * Handle OAuth callback and store tokens
     */
    public function handleCallback(string $authCode, User $user): array
    {
        try {
            $token = $this->client->fetchAccessTokenWithAuthCode($authCode);

            if (isset($token['error'])) {
                throw new \Exception('Failed to fetch access token: ' . $token['error']);
            }

            // Store tokens securely
            $user->update([
                'google_token' => encrypt($token['access_token']),
                'google_refresh_token' => isset($token['refresh_token'])
                    ? encrypt($token['refresh_token'])
                    : $user->google_refresh_token,
                'google_token_expires' => now()->addSeconds($token['expires_in']),
            ]);

            // Log activity
            $this->activityLogService->logUserActivity(
                'google_calendar_connected',
                $user->id,
                $user->name,
                null,
                ['connected_at' => now()->toDateTimeString()]
            );

            return ['success' => true, 'message' => 'Google Calendar connected successfully'];
        } catch (\Exception $e) {
            Log::error('Google Calendar callback error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to connect Google Calendar'];
        }
    }

    /**
     * Disconnect Google Calendar for user
     */
    public function disconnect(User $user): bool
    {
        try {
            $user->update([
                'google_token' => null,
                'google_refresh_token' => null,
                'google_token_expires' => null,
            ]);

            // Log activity
            $this->activityLogService->logUserActivity(
                'google_calendar_disconnected',
                $user->id,
                $user->name,
                ['connected' => true],
                ['connected' => false]
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Google Calendar disconnect error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if user has valid Google Calendar connection
     */
    public function isConnected(User $user): bool
    {
        return !empty($user->google_token) &&
            !empty($user->google_token_expires) &&
            $user->google_token_expires->isFuture();
    }

    /**
     * Set up authenticated service for user
     */
    private function setupServiceForUser(User $user): bool
    {
        if (!$this->isConnected($user)) {
            return false;
        }

        try {
            // Check if token needs refresh
            if ($user->google_token_expires->isPast()) {
                if (!$this->refreshToken($user)) {
                    return false;
                }
            }

            $this->client->setAccessToken(decrypt($user->google_token));
            $calendarClass = 'Google\Service\Calendar';
            $this->service = new $calendarClass($this->client);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to setup Google Calendar service: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    private function refreshToken(User $user): bool
    {
        if (empty($user->google_refresh_token)) {
            return false;
        }

        try {
            $this->client->setAccessToken([
                'refresh_token' => decrypt($user->google_refresh_token)
            ]);

            $newToken = $this->client->fetchAccessTokenWithRefreshToken();

            if (isset($newToken['error'])) {
                throw new \Exception('Token refresh failed: ' . $newToken['error']);
            }

            $user->update([
                'google_token' => encrypt($newToken['access_token']),
                'google_token_expires' => now()->addSeconds($newToken['expires_in']),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Token refresh error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync tasks from Google Calendar
     */
    public function syncFromCalendar(User $user): array
    {
        if (!$this->setupServiceForUser($user)) {
            return ['success' => false, 'message' => 'Google Calendar not connected'];
        }

        try {
            $events = $this->service->events->listEvents('primary', [
                'timeMin' => now()->toRfc3339String(),
                'timeMax' => now()->addDays(30)->toRfc3339String(),
                'singleEvents' => true,
                'orderBy' => 'startTime',
                'maxResults' => 100,
            ]);

            $syncedCount = 0;
            $updatedCount = 0;

            foreach ($events->getItems() as $event) {
                if ($this->shouldSyncEvent($event)) {
                    $result = $this->syncEventToTask($event, $user);
                    if ($result['created']) {
                        $syncedCount++;
                    } else {
                        $updatedCount++;
                    }
                }
            }

            // Log activity
            $this->activityLogService->logUserActivity(
                'google_calendar_sync',
                $user->id,
                $user->name,
                null,
                [
                    'synced_tasks' => $syncedCount,
                    'updated_tasks' => $updatedCount,
                    'sync_date' => now()->toDateTimeString()
                ]
            );

            return [
                'success' => true,
                'message' => "Synced {$syncedCount} new tasks and updated {$updatedCount} existing tasks",
                'synced' => $syncedCount,
                'updated' => $updatedCount
            ];
        } catch (\Exception $e) {
            Log::error('Calendar sync error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to sync calendar'];
        }
    }

    /**
     * Push task to Google Calendar
     */
    public function pushTaskToCalendar(Task $task): array
    {
        $user = $task->user;
        if (!$this->setupServiceForUser($user)) {
            return ['success' => false, 'message' => 'Google Calendar not connected'];
        }

        try {
            $event = $this->createEventFromTask($task);

            if ($task->google_event_id) {
                // Update existing event
                $updatedEvent = $this->service->events->update('primary', $task->google_event_id, $event);
                $action = 'updated';
            } else {
                // Create new event
                $createdEvent = $this->service->events->insert('primary', $event);
                $task->update(['google_event_id' => $createdEvent->getId()]);
                $action = 'created';
            }

            // Log activity
            $this->activityLogService->logTaskActivity(
                'google_calendar_push',
                $task->id,
                $task->title,
                null,
                ['action' => $action, 'google_event_id' => $task->google_event_id],
                $user->id
            );

            return ['success' => true, 'message' => "Task {$action} in Google Calendar"];
        } catch (\Exception $e) {
            Log::error('Push to calendar error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to push task to calendar'];
        }
    }

    /**
     * Remove task from Google Calendar
     */
    public function removeTaskFromCalendar(Task $task): array
    {
        $user = $task->user;
        if (!$this->setupServiceForUser($user) || !$task->google_event_id) {
            return ['success' => false, 'message' => 'Task not linked to Google Calendar'];
        }

        try {
            $this->service->events->delete('primary', $task->google_event_id);
            $task->update(['google_event_id' => null]);

            // Log activity
            $this->activityLogService->logTaskActivity(
                'google_calendar_remove',
                $task->id,
                $task->title,
                ['google_event_id' => $task->google_event_id],
                ['google_event_id' => null],
                $user->id
            );

            return ['success' => true, 'message' => 'Task removed from Google Calendar'];
        } catch (\Exception $e) {
            Log::error('Remove from calendar error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to remove task from calendar'];
        }
    }

    /**
     * Get calendar events for date range
     */
    public function getCalendarEvents(User $user, Carbon $startDate, Carbon $endDate): Collection
    {
        if (!$this->setupServiceForUser($user)) {
            return collect();
        }

        try {
            $events = $this->service->events->listEvents('primary', [
                'timeMin' => $startDate->toRfc3339String(),
                'timeMax' => $endDate->toRfc3339String(),
                'singleEvents' => true,
                'orderBy' => 'startTime',
                'maxResults' => 250,
            ]);

            $calendarEvents = collect();
            foreach ($events->getItems() as $event) {
                $calendarEvents->push([
                    'id' => $event->getId(),
                    'title' => $event->getSummary(),
                    'description' => $event->getDescription(),
                    'start' => $event->getStart()->getDateTime() ?: $event->getStart()->getDate(),
                    'end' => $event->getEnd()->getDateTime() ?: $event->getEnd()->getDate(),
                    'all_day' => !$event->getStart()->getDateTime(),
                    'location' => $event->getLocation(),
                    'attendees' => $event->getAttendees(),
                ]);
            }

            return $calendarEvents;
        } catch (\Exception $e) {
            Log::error('Get calendar events error: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * Bulk sync multiple tasks to calendar
     */
    public function bulkPushToCalendar(Collection $tasks): array
    {
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];

        foreach ($tasks as $task) {
            $result = $this->pushTaskToCalendar($task);
            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = "Task '{$task->title}': {$result['message']}";
            }
        }

        return $results;
    }

    /**
     * Get sync statistics for user
     */
    public function getSyncStats(User $user): array
    {
        $totalTasks = $user->tasks()->count();
        $syncedTasks = $user->tasks()->whereNotNull('google_event_id')->count();
        $lastSync = $user->updated_at; // Could be more specific with a last_sync_at field

        return [
            'total_tasks' => $totalTasks,
            'synced_tasks' => $syncedTasks,
            'unsynced_tasks' => $totalTasks - $syncedTasks,
            'sync_percentage' => $totalTasks > 0 ? round(($syncedTasks / $totalTasks) * 100, 2) : 0,
            'last_sync' => $lastSync,
            'is_connected' => $this->isConnected($user),
        ];
    }

    /**
     * Check if event should be synced as task
     */
    private function shouldSyncEvent(Event $event): bool
    {
        // Skip events without title
        if (empty($event->getSummary())) {
            return false;
        }

        // Skip all-day events (optional)
        if (!$event->getStart()->getDateTime()) {
            return false;
        }

        // Skip events marked as free/transparent
        if ($event->getTransparency() === 'transparent') {
            return false;
        }

        // Skip declined events
        $attendees = $event->getAttendees();
        if ($attendees) {
            foreach ($attendees as $attendee) {
                if ($attendee->getSelf() && $attendee->getResponseStatus() === 'declined') {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Convert Google Calendar event to task
     */
    private function syncEventToTask(Event $event, User $user): array
    {
        $startTime = $event->getStart()->getDateTime();
        $endTime = $event->getEnd()->getDateTime();

        $taskData = [
            'user_id' => $user->id,
            'title' => $event->getSummary(),
            'description' => $event->getDescription(),
            'due_date' => $startTime ? Carbon::parse($startTime)->format('Y-m-d') : null,
            'start_time' => $startTime ? Carbon::parse($startTime)->format('H:i') : null,
            'end_time' => $endTime ? Carbon::parse($endTime)->format('H:i') : null,
            'is_all_day' => !$startTime,
            'priority' => 'medium',
            'status' => 'pending',
            'google_event_id' => $event->getId(),
        ];

        $existingTask = Task::where('google_event_id', $event->getId())->first();

        if ($existingTask) {
            $this->taskService->updateTask($existingTask, $taskData, $user->id);
            return ['created' => false, 'task' => $existingTask];
        } else {
            $task = $this->taskService->createTask($taskData, $user->id);
            return ['created' => true, 'task' => $task];
        }
    }

    /**
     * Convert task to Google Calendar event
     */
    private function createEventFromTask(Task $task): Event
    {
        $event = new Event();
        $event->setSummary($task->title);
        $event->setDescription($task->description);

        if ($task->due_date) {
            $startDateTime = Carbon::parse($task->due_date);
            if ($task->start_time) {
                $startDateTime->setTimeFromTimeString($task->start_time);
            }

            $endDateTime = clone $startDateTime;
            if ($task->end_time) {
                $endDateTime->setTimeFromTimeString($task->end_time);
            } else {
                $endDateTime->addHour();
            }

            if ($task->is_all_day) {
                $event->setStart(new \Google\Service\Calendar\EventDateTime([
                    'date' => $startDateTime->format('Y-m-d'),
                    'timeZone' => $task->user->timezone ?? 'UTC',
                ]));
                $event->setEnd(new \Google\Service\Calendar\EventDateTime([
                    'date' => $endDateTime->format('Y-m-d'),
                    'timeZone' => $task->user->timezone ?? 'UTC',
                ]));
            } else {
                $event->setStart(new \Google\Service\Calendar\EventDateTime([
                    'dateTime' => $startDateTime->toRfc3339String(),
                    'timeZone' => $task->user->timezone ?? 'UTC',
                ]));
                $event->setEnd(new \Google\Service\Calendar\EventDateTime([
                    'dateTime' => $endDateTime->toRfc3339String(),
                    'timeZone' => $task->user->timezone ?? 'UTC',
                ]));
            }
        }

        // Set event color based on priority
        $colorMap = [
            'low' => '2',      // Green
            'medium' => '5',   // Yellow
            'high' => '11',    // Red
            'urgent' => '4',   // Dark Red
        ];
        $event->setColorId($colorMap[$task->priority] ?? '5');

        return $event;
    }
}
