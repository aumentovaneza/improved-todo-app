<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\CalendarEventException;
use App\Models\EventCalendar;
use App\Models\User;
use App\Repositories\Contracts\CalendarEventRepositoryInterface;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CalendarEventService
{
    public function __construct(
        private CalendarEventRepositoryInterface $events,
        private CalendarRecurrenceService $recurrence
    ) {}

    public function defaultCalendarFor(User $user): EventCalendar
    {
        $existing = $user->eventCalendars()->orderByDesc('is_default')->orderBy('position')->first();
        if ($existing) {
            return $existing;
        }

        return $user->eventCalendars()->create([
            'name' => 'Personal',
            'color' => '#4ACF91',
            'position' => 0,
            'is_default' => true,
        ]);
    }

    public function calendarsFor(User $user): Collection
    {
        $this->defaultCalendarFor($user);

        return $user->eventCalendars()->orderBy('position')->get();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function itemsForRange(
        User $user,
        CarbonInterface $start,
        CarbonInterface $end,
        array $calendarIds = []
    ): array {
        return $this->events
            ->getForRange($user->id, $start, $end, $calendarIds)
            ->flatMap(fn (CalendarEvent $event) => $this->recurrence->occurrencesBetween($event, $start, $end))
            ->sortBy('start')
            ->values()
            ->all();
    }

    public function create(User $user, array $data): CalendarEvent
    {
        return DB::transaction(function () use ($user, $data) {
            $calendar = $this->ownedCalendar($user, $data['event_calendar_id'] ?? null);
            $attributes = $this->eventAttributes($data, $user->getTimezone());
            $attributes['user_id'] = $user->id;
            $attributes['event_calendar_id'] = $calendar->id;

            $event = $this->events->create($attributes);
            $this->syncReminders($event, $data['reminder_offsets'] ?? []);

            return $event->fresh(['calendar', 'exceptions', 'reminders']);
        });
    }

    public function update(User $user, CalendarEvent $event, array $data): CalendarEvent
    {
        $this->authorizeEvent($user, $event);
        $scope = $data['scope'] ?? 'series';

        if ($scope === 'occurrence') {
            return $this->updateOccurrence($event, $data);
        }

        return DB::transaction(function () use ($user, $event, $data) {
            if (array_key_exists('event_calendar_id', $data)) {
                $this->ownedCalendar($user, $data['event_calendar_id']);
            }

            $attributes = $this->eventAttributes($data, $event->timezone ?: $user->getTimezone(), true);
            $event = $this->events->update($event, $attributes);

            if (array_key_exists('reminder_offsets', $data)) {
                $this->syncReminders($event, $data['reminder_offsets'] ?? []);
            } else {
                $this->refreshReminderSchedule($event);
            }

            return $event->fresh(['calendar', 'exceptions', 'reminders']);
        });
    }

    public function delete(User $user, CalendarEvent $event, string $scope, ?string $occurrenceKey): void
    {
        $this->authorizeEvent($user, $event);

        if ($scope === 'occurrence') {
            if (! $event->recurrence_rule || ! $occurrenceKey) {
                throw ValidationException::withMessages([
                    'occurrence_key' => 'Choose a recurring event occurrence.',
                ]);
            }

            CalendarEventException::updateOrCreate(
                ['calendar_event_id' => $event->id, 'occurrence_key' => $occurrenceKey],
                ['is_cancelled' => true, 'start_date' => null, 'end_date' => null, 'starts_at' => null, 'ends_at' => null, 'overrides' => null]
            );
            $this->refreshReminderSchedule($event->fresh(['calendar', 'exceptions', 'reminders']));

            return;
        }

        $this->events->delete($event);
    }

    public function createCalendar(User $user, array $data): EventCalendar
    {
        $position = (int) $user->eventCalendars()->max('position') + 1;

        return $user->eventCalendars()->create([
            'name' => trim($data['name']),
            'color' => $data['color'],
            'position' => $data['position'] ?? $position,
            'is_default' => false,
        ]);
    }

    public function updateCalendar(User $user, EventCalendar $calendar, array $data): EventCalendar
    {
        $this->authorizeCalendar($user, $calendar);
        $data['name'] = trim($data['name']);
        $calendar->update($data);

        return $calendar->fresh();
    }

    public function deleteCalendar(User $user, EventCalendar $calendar): void
    {
        $this->authorizeCalendar($user, $calendar);
        if ($calendar->is_default) {
            throw ValidationException::withMessages([
                'calendar' => 'The default calendar cannot be removed.',
            ]);
        }
        if ($calendar->events()->exists()) {
            throw ValidationException::withMessages([
                'calendar' => 'Move or delete this calendar’s events first.',
            ]);
        }

        $calendar->delete();
    }

    private function updateOccurrence(CalendarEvent $event, array $data): CalendarEvent
    {
        if (! $event->recurrence_rule || empty($data['occurrence_key'])) {
            throw ValidationException::withMessages([
                'occurrence_key' => 'Choose a recurring event occurrence.',
            ]);
        }

        return DB::transaction(function () use ($event, $data) {
            $timezone = $data['timezone'] ?? $event->timezone;
            $isAllDay = array_key_exists('is_all_day', $data) ? (bool) $data['is_all_day'] : $event->is_all_day;
            $dateFields = [
                'is_cancelled' => false,
                'start_date' => null,
                'end_date' => null,
                'starts_at' => null,
                'ends_at' => null,
            ];

            if ($isAllDay && isset($data['start_date'])) {
                $dateFields['start_date'] = $data['start_date'];
                $dateFields['end_date'] = $data['end_date'] ?? $data['start_date'];
            } elseif (! $isAllDay && isset($data['starts_at'], $data['ends_at'])) {
                $dateFields['starts_at'] = Carbon::parse($data['starts_at'], $timezone)->utc();
                $dateFields['ends_at'] = Carbon::parse($data['ends_at'], $timezone)->utc();
            }

            $overrides = [];
            foreach (['title', 'notes', 'location', 'kind', 'color'] as $field) {
                if (array_key_exists($field, $data)) {
                    $overrides[$field] = $data[$field];
                }
            }

            CalendarEventException::updateOrCreate(
                ['calendar_event_id' => $event->id, 'occurrence_key' => $data['occurrence_key']],
                [...$dateFields, 'overrides' => $overrides ?: null]
            );

            $event = $event->fresh(['calendar', 'exceptions', 'reminders']);
            $this->refreshReminderSchedule($event);

            return $event;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function eventAttributes(array $data, string $fallbackTimezone, bool $partial = false): array
    {
        $allowed = ['event_calendar_id', 'title', 'notes', 'location', 'kind', 'color', 'recurrence_rule'];
        $attributes = array_intersect_key($data, array_flip($allowed));
        $timezone = $data['timezone'] ?? $fallbackTimezone;

        if (array_key_exists('timezone', $data) || ! $partial) {
            $attributes['timezone'] = $timezone;
        }

        if (array_key_exists('is_all_day', $data) || ! $partial) {
            $isAllDay = (bool) ($data['is_all_day'] ?? false);
            $attributes['is_all_day'] = $isAllDay;

            if ($isAllDay) {
                $attributes['start_date'] = $data['start_date'];
                $attributes['end_date'] = $data['end_date'] ?? $data['start_date'];
                $attributes['starts_at'] = null;
                $attributes['ends_at'] = null;
            } else {
                $attributes['starts_at'] = Carbon::parse($data['starts_at'], $timezone)->utc();
                $attributes['ends_at'] = Carbon::parse($data['ends_at'], $timezone)->utc();
                $attributes['start_date'] = null;
                $attributes['end_date'] = null;
            }
        } elseif (! $partial || isset($data['starts_at'], $data['ends_at'])) {
            $attributes['starts_at'] = Carbon::parse($data['starts_at'], $timezone)->utc();
            $attributes['ends_at'] = Carbon::parse($data['ends_at'], $timezone)->utc();
        }

        $attributes['recurrence_rule'] = isset($attributes['recurrence_rule'])
            ? $this->normalizeRule($attributes['recurrence_rule'])
            : ($partial ? ($attributes['recurrence_rule'] ?? null) : null);

        if ($partial && ! array_key_exists('recurrence_rule', $data)) {
            unset($attributes['recurrence_rule']);
        }

        return $attributes;
    }

    private function normalizeRule(?string $rule): ?string
    {
        $rule = trim((string) $rule);
        if ($rule === '') {
            return null;
        }

        $rule = preg_replace('/^RRULE:/i', '', $rule);
        new \RRule\RRule($rule);

        return strtoupper($rule);
    }

    private function syncReminders(CalendarEvent $event, array $offsets): void
    {
        $offsets = collect($offsets)
            ->map(fn ($offset) => (int) $offset)
            ->unique()
            ->sort()
            ->values();

        $event->reminders()->whereNotIn('offset_minutes', $offsets)->delete();
        foreach ($offsets as $offset) {
            $event->reminders()->firstOrCreate(['offset_minutes' => $offset]);
        }

        $this->refreshReminderSchedule($event->fresh(['calendar', 'exceptions', 'reminders']));
    }

    public function refreshReminderSchedule(CalendarEvent $event, ?CarbonInterface $after = null): void
    {
        foreach ($event->reminders as $reminder) {
            $next = $this->recurrence->nextOccurrenceForReminder($event, $reminder->offset_minutes, $after);
            $nextRemindAt = null;
            $nextOccurrenceKey = null;
            if ($next) {
                $start = $next['allDay']
                    ? Carbon::parse($next['start'], $event->timezone)->utc()
                    : Carbon::parse($next['start'])->utc();
                $nextRemindAt = $start->subMinutes($reminder->offset_minutes);
                $nextOccurrenceKey = $next['occurrenceKey'];
            }
            $reminder->update([
                'next_remind_at' => $nextRemindAt,
                'next_occurrence_key' => $nextOccurrenceKey,
            ]);
        }
    }

    private function ownedCalendar(User $user, ?int $calendarId): EventCalendar
    {
        if (! $calendarId) {
            return $this->defaultCalendarFor($user);
        }

        return $user->eventCalendars()->findOrFail($calendarId);
    }

    private function authorizeEvent(User $user, CalendarEvent $event): void
    {
        abort_unless($event->user_id === $user->id, 403);
    }

    private function authorizeCalendar(User $user, EventCalendar $calendar): void
    {
        abort_unless($calendar->user_id === $user->id, 403);
    }
}
