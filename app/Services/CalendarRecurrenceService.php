<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\CalendarEventException;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use RRule\RRule;

class CalendarRecurrenceService
{
    private const MAX_OCCURRENCES_PER_RANGE = 5000;

    /**
     * Expand an event into normalized calendar occurrences within a bounded UTC window.
     *
     * @return array<int, array<string, mixed>>
     */
    public function occurrencesBetween(
        CalendarEvent $event,
        CarbonInterface $rangeStart,
        CarbonInterface $rangeEnd
    ): array {
        $timezone = $event->timezone ?: 'UTC';
        $baseStart = $this->baseStart($event, $timezone);
        $duration = $this->durationSeconds($event);
        $starts = [];

        if ($event->recurrence_rule) {
            $rule = new RRule($event->recurrence_rule, $baseStart->toDateTime());
            $searchStart = Carbon::instance($rangeStart)->setTimezone($timezone)->subSeconds($duration);
            $searchEnd = Carbon::instance($rangeEnd)->setTimezone($timezone);
            $starts = $rule->getOccurrencesBetween(
                $searchStart->toDateTime(),
                $searchEnd->toDateTime(),
                self::MAX_OCCURRENCES_PER_RANGE
            );
        } else {
            $baseEnd = $baseStart->copy()->addSeconds($duration);
            if ($baseStart->lte($rangeEnd) && $baseEnd->gte($rangeStart)) {
                $starts = [$baseStart->toDateTime()];
            }
        }

        $exceptions = $event->exceptions->keyBy('occurrence_key');
        $occurrences = [];
        $expandedKeys = [];

        foreach ($starts as $startValue) {
            $start = Carbon::instance($startValue)->setTimezone($timezone);
            $key = $this->occurrenceKey($event, $start);
            $expandedKeys[] = $key;
            /** @var CalendarEventException|null $exception */
            $exception = $exceptions->get($key);

            if ($exception?->is_cancelled) {
                continue;
            }

            $occurrence = $this->makeOccurrence($event, $start, $duration, $key, $exception);
            if ($this->overlapsRange($occurrence, $rangeStart, $rangeEnd)) {
                $occurrences[] = $occurrence;
            }
        }

        // A moved occurrence can overlap the requested range even when its
        // original series date does not. Overlay those exceptions separately.
        foreach ($event->exceptions as $exception) {
            if ($exception->is_cancelled
                || in_array($exception->occurrence_key, $expandedKeys, true)
                || (! $exception->start_date && ! $exception->starts_at)) {
                continue;
            }

            $originalStart = $event->is_all_day
                ? Carbon::parse($exception->occurrence_key, $timezone)->startOfDay()
                : Carbon::parse($exception->occurrence_key)->setTimezone($timezone);
            $occurrence = $this->makeOccurrence(
                $event,
                $originalStart,
                $duration,
                $exception->occurrence_key,
                $exception
            );
            if ($this->overlapsRange($occurrence, $rangeStart, $rangeEnd)) {
                $occurrences[] = $occurrence;
            }
        }

        return collect($occurrences)->sortBy('start')->values()->all();
    }

    public function occurrenceKey(CalendarEvent $event, CarbonInterface $start): string
    {
        if ($event->is_all_day) {
            return $start->setTimezone($event->timezone ?: 'UTC')->format('Y-m-d');
        }

        return $start->utc()->format('Y-m-d\TH:i:s\Z');
    }

    /**
     * Return the next occurrence whose reminder would fire after the supplied instant.
     *
     * @return array<string, mixed>|null
     */
    public function nextOccurrenceForReminder(
        CalendarEvent $event,
        int $offsetMinutes,
        ?CarbonInterface $after = null
    ): ?array {
        $after = $after ? Carbon::instance($after) : now();
        $occurrenceStartFloor = $after->copy()->addMinutes($offsetMinutes);
        $occurrences = $this->occurrencesBetween(
            $event,
            $occurrenceStartFloor,
            $occurrenceStartFloor->copy()->addYears(5)
        );

        foreach ($occurrences as $occurrence) {
            $start = $occurrence['allDay']
                ? Carbon::parse($occurrence['start'], $event->timezone ?: 'UTC')->utc()
                : Carbon::parse($occurrence['start'])->utc();
            if ($start->copy()->subMinutes($offsetMinutes)->gt($after)) {
                return $occurrence;
            }
        }

        return null;
    }

    private function baseStart(CalendarEvent $event, string $timezone): Carbon
    {
        if ($event->is_all_day) {
            return Carbon::parse($event->start_date->format('Y-m-d'), $timezone)->startOfDay();
        }

        return $event->starts_at->copy()->setTimezone($timezone);
    }

    private function durationSeconds(CalendarEvent $event): int
    {
        if ($event->is_all_day) {
            $spanDays = (int) $event->start_date->diffInDays($event->end_date) + 1;

            return max(1, $spanDays) * 86400;
        }

        return max(60, (int) $event->starts_at->diffInSeconds($event->ends_at));
    }

    /**
     * @return array<string, mixed>
     */
    private function makeOccurrence(
        CalendarEvent $event,
        Carbon $start,
        int $duration,
        string $key,
        ?CalendarEventException $exception
    ): array {
        $overrides = $exception?->overrides ?? [];
        $calendar = $event->calendar;

        if ($event->is_all_day) {
            $occurrenceStart = $exception?->start_date
                ? Carbon::parse($exception->start_date->format('Y-m-d'), $event->timezone)
                : $start->copy();
            $occurrenceEndInclusive = $exception?->end_date
                ? Carbon::parse($exception->end_date->format('Y-m-d'), $event->timezone)
                : $occurrenceStart->copy()->addDays(max(1, intdiv($duration, 86400)) - 1);
            $displayStart = $occurrenceStart->format('Y-m-d');
            $displayEnd = $occurrenceEndInclusive->copy()->addDay()->format('Y-m-d');
        } else {
            $occurrenceStart = $exception?->starts_at?->copy() ?? $start->copy();
            $occurrenceEnd = $exception?->ends_at?->copy() ?? $occurrenceStart->copy()->addSeconds($duration);
            $displayStart = $occurrenceStart->utc()->toIso8601String();
            $displayEnd = $occurrenceEnd->utc()->toIso8601String();
        }

        $eventData = [
            'id' => $event->id,
            'title' => $overrides['title'] ?? $event->title,
            'notes' => array_key_exists('notes', $overrides) ? $overrides['notes'] : $event->notes,
            'location' => array_key_exists('location', $overrides) ? $overrides['location'] : $event->location,
            'kind' => $overrides['kind'] ?? $event->kind,
            'event_calendar_id' => $event->event_calendar_id,
            'calendar_name' => $calendar->name,
            'is_all_day' => $event->is_all_day,
            'timezone' => $event->timezone,
            'recurrence_rule' => $event->recurrence_rule,
            'color' => $event->color,
            'base_start' => $event->is_all_day
                ? $event->start_date->format('Y-m-d')
                : $event->starts_at->copy()->utc()->toIso8601String(),
            'base_end' => $event->is_all_day
                ? $event->end_date->format('Y-m-d')
                : $event->ends_at->copy()->utc()->toIso8601String(),
            'reminders' => $event->reminders->pluck('offset_minutes')->values()->all(),
        ];

        return [
            'id' => "event:{$event->id}:{$key}",
            'sourceType' => 'event',
            'sourceId' => $event->event_calendar_id,
            'eventId' => $event->id,
            'occurrenceKey' => $key,
            'title' => $eventData['title'],
            'start' => $displayStart,
            'end' => $displayEnd,
            'allDay' => $event->is_all_day,
            'color' => $overrides['color'] ?? $event->color ?? $calendar->color,
            'editable' => true,
            'extendedProps' => [
                'event' => $eventData,
                'isRecurring' => $event->recurrence_rule !== null,
                'location' => $eventData['location'],
                'kind' => $eventData['kind'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $occurrence
     */
    private function overlapsRange(array $occurrence, CarbonInterface $start, CarbonInterface $end): bool
    {
        $timezone = $occurrence['extendedProps']['event']['timezone'] ?? 'UTC';
        $occurrenceStart = Carbon::parse($occurrence['start'], $timezone)->utc();
        $occurrenceEnd = Carbon::parse($occurrence['end'], $timezone)->utc();

        return $occurrenceStart->lte($end) && $occurrenceEnd->gte($start);
    }
}
