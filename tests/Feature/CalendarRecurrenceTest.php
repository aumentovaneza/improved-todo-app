<?php

use App\Models\CalendarEvent;
use App\Models\CalendarEventException;
use App\Models\User;
use App\Services\CalendarEventService;
use App\Services\CalendarRecurrenceService;
use Carbon\CarbonImmutable;

function recurrenceEvent(User $user, array $overrides = []): CalendarEvent
{
    return CalendarEvent::create(array_merge([
        'user_id' => $user->id,
        'event_calendar_id' => $user->eventCalendars()->firstOrFail()->id,
        'title' => 'Recurring event',
        'kind' => 'class',
        'is_all_day' => false,
        'starts_at' => '2026-08-31 01:00:00',
        'ends_at' => '2026-08-31 02:00:00',
        'timezone' => 'Asia/Manila',
        'recurrence_rule' => 'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6',
    ], $overrides))->load(['calendar', 'exceptions', 'reminders']);
}

it('expands a multi-weekday class schedule inside a bounded range', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user);

    $items = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event,
        CarbonImmutable::parse('2026-08-30T00:00:00Z'),
        CarbonImmutable::parse('2026-09-20T23:59:59Z')
    );

    expect(array_column($items, 'occurrenceKey'))->toBe([
        '2026-08-31T01:00:00Z',
        '2026-09-02T01:00:00Z',
        '2026-09-07T01:00:00Z',
        '2026-09-09T01:00:00Z',
        '2026-09-14T01:00:00Z',
        '2026-09-16T01:00:00Z',
    ]);
});

it('supports monthly ordinal weekdays and yearly rules', function () {
    $user = User::factory()->create();
    $monthly = recurrenceEvent($user, [
        'starts_at' => '2026-01-12 01:00:00',
        'ends_at' => '2026-01-12 02:00:00',
        'recurrence_rule' => 'FREQ=MONTHLY;BYDAY=2MO;COUNT=3',
    ]);
    $yearly = recurrenceEvent($user, [
        'starts_at' => '2026-06-15 01:00:00',
        'ends_at' => '2026-06-15 02:00:00',
        'recurrence_rule' => 'FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=15;COUNT=2',
    ]);
    $service = app(CalendarRecurrenceService::class);

    expect(array_column($service->occurrencesBetween(
        $monthly,
        CarbonImmutable::parse('2026-01-01'),
        CarbonImmutable::parse('2026-04-01')
    ), 'occurrenceKey'))->toBe([
        '2026-01-12T01:00:00Z',
        '2026-02-09T01:00:00Z',
        '2026-03-09T01:00:00Z',
    ])->and(count($service->occurrencesBetween(
        $yearly,
        CarbonImmutable::parse('2026-01-01'),
        CarbonImmutable::parse('2028-01-01')
    )))->toBe(2);
});

it('bounds infinite recurrence expansion to the requested window', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user, [
        'starts_at' => '2026-01-01 01:00:00',
        'ends_at' => '2026-01-01 02:00:00',
        'recurrence_rule' => 'FREQ=DAILY',
    ]);

    $items = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event,
        CarbonImmutable::parse('2026-02-01T00:00:00Z'),
        CarbonImmutable::parse('2026-02-08T00:00:00Z')
    );

    expect($items)->toHaveCount(7);
});

it('keeps local wall time through a daylight-saving transition', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user, [
        'starts_at' => '2026-03-07 14:00:00',
        'ends_at' => '2026-03-07 15:00:00',
        'timezone' => 'America/New_York',
        'recurrence_rule' => 'FREQ=DAILY;COUNT=3',
    ]);

    $items = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event,
        CarbonImmutable::parse('2026-03-07T00:00:00Z'),
        CarbonImmutable::parse('2026-03-11T00:00:00Z')
    );

    expect(array_column($items, 'start'))->toBe([
        '2026-03-07T14:00:00+00:00',
        '2026-03-08T13:00:00+00:00',
        '2026-03-09T13:00:00+00:00',
    ]);
});

it('uses inclusive all-day form dates and exclusive calendar ends', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user, [
        'is_all_day' => true,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-12',
        'starts_at' => null,
        'ends_at' => null,
        'recurrence_rule' => null,
    ]);

    $item = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event,
        CarbonImmutable::parse('2026-10-01'),
        CarbonImmutable::parse('2026-11-01')
    )[0];

    expect($item['start'])->toBe('2026-10-10')
        ->and($item['end'])->toBe('2026-10-13')
        ->and($item['allDay'])->toBeTrue();
});

it('cancels and moves single occurrences while preserving the series', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user);
    CalendarEventException::create([
        'calendar_event_id' => $event->id,
        'occurrence_key' => '2026-09-02T01:00:00Z',
        'is_cancelled' => true,
    ]);
    CalendarEventException::create([
        'calendar_event_id' => $event->id,
        'occurrence_key' => '2026-09-07T01:00:00Z',
        'starts_at' => '2026-09-07 04:00:00',
        'ends_at' => '2026-09-07 05:30:00',
        'overrides' => ['title' => 'Moved class'],
    ]);

    $items = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event->fresh(['calendar', 'exceptions', 'reminders']),
        CarbonImmutable::parse('2026-08-30'),
        CarbonImmutable::parse('2026-09-10')
    );

    expect(array_column($items, 'occurrenceKey'))->not->toContain('2026-09-02T01:00:00Z')
        ->and(collect($items)->firstWhere('occurrenceKey', '2026-09-07T01:00:00Z')['title'])
        ->toBe('Moved class')
        ->and(collect($items)->firstWhere('occurrenceKey', '2026-09-07T01:00:00Z')['start'])
        ->toBe('2026-09-07T04:00:00+00:00');
});

it('includes an occurrence moved into the range from a later series date', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user, ['recurrence_rule' => 'FREQ=WEEKLY;COUNT=8']);
    CalendarEventException::create([
        'calendar_event_id' => $event->id,
        'occurrence_key' => '2026-10-05T01:00:00Z',
        'starts_at' => '2026-09-03 04:00:00',
        'ends_at' => '2026-09-03 05:00:00',
        'overrides' => ['title' => 'Early class'],
    ]);

    $items = app(CalendarRecurrenceService::class)->occurrencesBetween(
        $event->fresh(['calendar', 'exceptions', 'reminders']),
        CarbonImmutable::parse('2026-09-01'),
        CarbonImmutable::parse('2026-09-05')
    );

    expect(collect($items)->firstWhere('occurrenceKey', '2026-10-05T01:00:00Z')['title'])
        ->toBe('Early class');
});

it('series edits preserve occurrence exceptions', function () {
    $user = User::factory()->create();
    $event = recurrenceEvent($user);
    CalendarEventException::create([
        'calendar_event_id' => $event->id,
        'occurrence_key' => '2026-09-02T01:00:00Z',
        'is_cancelled' => true,
    ]);

    app(CalendarEventService::class)->update($user, $event, [
        'scope' => 'series',
        'title' => 'Updated class title',
    ]);

    expect($event->exceptions()->count())->toBe(1)
        ->and($event->fresh()->title)->toBe('Updated class title');
});
