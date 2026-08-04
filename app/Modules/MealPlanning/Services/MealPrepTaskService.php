<?php

namespace App\Modules\MealPlanning\Services;

use App\Models\Task;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealCalendarEvent;
use App\Services\ReminderService;
use App\Services\TaskService;
use Carbon\Carbon;

class MealPrepTaskService
{
    public function __construct(private TaskService $tasks, private ReminderService $reminders) {}

    public function create(MealCalendarEvent $event, HouseholdMember $assignee, int $actorUserId, array $data = []): Task
    {
        $ownerUserId = $assignee->user_id ?: $actorUserId;
        $existing = Task::where('user_id', $ownerUserId)->where('source_type', 'meal_calendar_event')->where('source_id', $event->id)->first();
        if ($existing) {
            return $existing;
        }
        $startsAt = Carbon::parse($event->starts_at);
        $endsAt = $event->ends_at ? Carbon::parse($event->ends_at) : null;
        $task = $this->tasks->createTask([
            'title' => $data['title'] ?? $event->title,
            'description' => $data['description'] ?? 'Meal preparation for '.$startsAt->toDateTimeString(),
            'priority' => $data['priority'] ?? 'medium',
            'due_date' => $startsAt,
            'start_time' => $startsAt->format('H:i'),
            'end_time' => $endsAt?->format('H:i'),
            'is_all_day' => false,
            'meal_household_member_id' => $assignee->id,
            'source_type' => 'meal_calendar_event',
            'source_id' => $event->id,
            'source_metadata' => ['household_id' => $event->household_id, 'event_type' => $event->type],
        ], $ownerUserId);
        if (! empty($data['remind_at'])) {
            $this->reminders->createReminder(['task_id' => $task->id, 'remind_at' => $data['remind_at'], 'type' => $data['reminder_type'] ?? 'notification', 'message' => $data['reminder_message'] ?? null], $ownerUserId);
        }

        return $task;
    }
}
