<?php

use App\Models\CalendarEvent;
use App\Models\EventCalendar;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

function calendarEventPayload(EventCalendar $calendar, array $overrides = []): array
{
    return array_merge([
        'event_calendar_id' => $calendar->id,
        'title' => 'Dentist appointment',
        'notes' => 'Bring insurance card',
        'location' => 'Makati clinic',
        'kind' => 'appointment',
        'is_all_day' => false,
        'starts_at' => '2026-09-14T09:00:00+08:00',
        'ends_at' => '2026-09-14T10:00:00+08:00',
        'timezone' => 'Asia/Manila',
        'reminder_offsets' => [10, 60],
    ], $overrides);
}

it('creates one encrypted personal calendar for a new user', function () {
    $user = User::factory()->create();
    $calendar = $user->eventCalendars()->sole();

    expect($calendar->name)->toBe('Personal')
        ->and($calendar->is_default)->toBeTrue()
        ->and(DB::table('event_calendars')->where('id', $calendar->id)->value('name'))
        ->not->toBe('Personal');
});

it('lazily creates a personal calendar for an existing user without one', function () {
    $user = User::factory()->create();
    $user->eventCalendars()->delete();

    $this->actingAs($user)->get(route('calendar.index'))->assertOk();

    expect($user->eventCalendars()->count())->toBe(1)
        ->and($user->eventCalendars()->first()->name)->toBe('Personal');
});

it('creates events with encrypted private fields and reminders', function () {
    $user = User::factory()->create();
    $calendar = $user->eventCalendars()->firstOrFail();

    $this->actingAs($user)
        ->post(route('calendar-events.store'), calendarEventPayload($calendar))
        ->assertRedirect();

    $event = CalendarEvent::query()->sole();
    $raw = DB::table('calendar_events')->where('id', $event->id)->first();

    expect($event->title)->toBe('Dentist appointment')
        ->and($event->notes)->toBe('Bring insurance card')
        ->and($event->location)->toBe('Makati clinic')
        ->and(Crypt::decryptString($raw->title))->toBe('Dentist appointment')
        ->and($raw->notes)->not->toContain('insurance')
        ->and($raw->location)->not->toContain('Makati')
        ->and($event->reminders()->pluck('offset_minutes')->sort()->values()->all())
        ->toBe([10, 60])
        ->and($event->reminders()->whereNull('next_remind_at')->count())->toBe(0);
});

it('validates calendar ownership and event time boundaries', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->post(route('calendar-events.store'), calendarEventPayload(
            $other->eventCalendars()->firstOrFail(),
            ['ends_at' => '2026-09-14T08:00:00+08:00']
        ))
        ->assertSessionHasErrors(['event_calendar_id', 'ends_at']);
});

it('denies cross-user event and custom calendar changes', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $event = CalendarEvent::create([
        'user_id' => $owner->id,
        'event_calendar_id' => $owner->eventCalendars()->firstOrFail()->id,
        'title' => 'Private event',
        'kind' => 'event',
        'is_all_day' => true,
        'start_date' => '2026-09-20',
        'end_date' => '2026-09-20',
        'timezone' => 'Asia/Manila',
    ]);

    $this->actingAs($intruder)
        ->put(route('calendar-events.update', $event), [
            'scope' => 'series',
            'title' => 'Stolen',
        ])
        ->assertForbidden();

    $this->actingAs($intruder)
        ->delete(route('event-calendars.destroy', $owner->eventCalendars()->firstOrFail()))
        ->assertForbidden();
});

it('returns only requested sources, calendars, and the visible range', function () {
    $user = User::factory()->create();
    $personal = $user->eventCalendars()->firstOrFail();
    $school = $user->eventCalendars()->create([
        'name' => 'School',
        'color' => '#6366F1',
        'position' => 1,
    ]);
    foreach ([[$personal, 'Personal event'], [$school, 'School event']] as [$calendar, $title]) {
        CalendarEvent::create([
            'user_id' => $user->id,
            'event_calendar_id' => $calendar->id,
            'title' => $title,
            'kind' => 'event',
            'is_all_day' => true,
            'start_date' => '2026-09-14',
            'end_date' => '2026-09-14',
            'timezone' => 'Asia/Manila',
        ]);
    }
    Task::create([
        'user_id' => $user->id,
        'title' => 'Task in range',
        'priority' => 'medium',
        'status' => 'pending',
        'position' => 1,
        'due_date' => '2026-09-14',
    ]);

    $this->actingAs($user)
        ->get(route('calendar.index', [
            'date' => '2026-09-14',
            'start' => '2026-09-01',
            'end' => '2026-09-30',
            'sources' => 'events',
            'calendars' => (string) $school->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Calendar/Index')
            ->has('calendarItems', 1)
            ->where('calendarItems.0.title', 'School event')
            ->where('calendarItems.0.sourceType', 'event'));

    $this->actingAs($user)
        ->get(route('calendar.index', [
            'start' => '2020-01-01',
            'end' => '2026-09-30',
        ]))
        ->assertUnprocessable();
});

it('validates source and owned-calendar query selections', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->get(route('calendar.index', ['sources' => 'events,unknown']))
        ->assertSessionHasErrors('sources');

    $this->actingAs($user)
        ->get(route('calendar.index', ['calendars' => (string) $other->eventCalendars()->firstOrFail()->id]))
        ->assertSessionHasErrors('calendars');
});

it('can hide every native calendar without leaking all event calendars back in', function () {
    $user = User::factory()->create();
    CalendarEvent::create([
        'user_id' => $user->id,
        'event_calendar_id' => $user->eventCalendars()->firstOrFail()->id,
        'title' => 'Hidden event',
        'kind' => 'event',
        'is_all_day' => true,
        'start_date' => '2026-09-14',
        'end_date' => '2026-09-14',
        'timezone' => 'UTC',
    ]);

    $this->actingAs($user)
        ->get('/calendar?date=2026-09-14&sources=events&calendars=')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('calendarItems', 0));
});

it('updates and cancels recurring occurrences through scoped CRUD', function () {
    $user = User::factory()->create();
    $event = CalendarEvent::create([
        'user_id' => $user->id,
        'event_calendar_id' => $user->eventCalendars()->firstOrFail()->id,
        'title' => 'Weekly class',
        'kind' => 'class',
        'is_all_day' => false,
        'starts_at' => '2026-09-14 01:00:00',
        'ends_at' => '2026-09-14 02:00:00',
        'timezone' => 'Asia/Manila',
        'recurrence_rule' => 'FREQ=WEEKLY;COUNT=4',
    ]);

    $this->actingAs($user)
        ->put(route('calendar-events.update', $event), [
            'scope' => 'occurrence',
            'occurrence_key' => '2026-09-21T01:00:00Z',
            'title' => 'Moved class',
            'starts_at' => '2026-09-21T04:00:00Z',
            'ends_at' => '2026-09-21T05:00:00Z',
        ])
        ->assertRedirect();

    expect($event->exceptions()->sole()->overrides['title'])->toBe('Moved class');

    $this->actingAs($user)
        ->delete(route('calendar-events.destroy', $event), [
            'scope' => 'occurrence',
            'occurrence_key' => '2026-09-21T01:00:00Z',
        ])
        ->assertRedirect();

    expect($event->exceptions()->sole()->is_cancelled)->toBeTrue();
});

it('can create, update, and remove an empty custom calendar but protects the default', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('event-calendars.store'), ['name' => 'School', 'color' => '#6366F1'])
        ->assertRedirect();

    $school = $user->eventCalendars()->where('is_default', false)->sole();
    $this->actingAs($user)
        ->put(route('event-calendars.update', $school), ['name' => 'University', 'color' => '#8B5CF6'])
        ->assertRedirect();
    expect($school->fresh()->name)->toBe('University');

    $this->actingAs($user)->delete(route('event-calendars.destroy', $school))->assertRedirect();
    expect($school->fresh())->toBeNull();

    $this->actingAs($user)
        ->delete(route('event-calendars.destroy', $user->eventCalendars()->firstOrFail()))
        ->assertSessionHasErrors('calendar');
});
