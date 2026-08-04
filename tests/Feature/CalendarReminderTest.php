<?php

use App\Jobs\DispatchCalendarEventReminderJob;
use App\Models\CalendarEvent;
use App\Models\CalendarEventReminderDelivery;
use App\Models\User;
use App\Notifications\CalendarEventReminderNotification;
use App\Notifications\Channels\WebPushChannel;
use App\Services\CalendarEventService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Queue;
use NotificationChannels\Apn\ApnChannel;

function reminderEvent(User $user, array $overrides = []): CalendarEvent
{
    return CalendarEvent::create(array_merge([
        'user_id' => $user->id,
        'event_calendar_id' => $user->eventCalendars()->firstOrFail()->id,
        'title' => 'Study session',
        'kind' => 'routine',
        'is_all_day' => false,
        'starts_at' => '2026-09-15 02:00:00',
        'ends_at' => '2026-09-15 03:00:00',
        'timezone' => 'Asia/Manila',
        'recurrence_rule' => 'FREQ=DAILY;COUNT=3',
    ], $overrides))->load(['calendar', 'exceptions', 'reminders']);
}

it('calculates the next occurrence and advances after a cancellation', function () {
    CarbonImmutable::setTestNow('2026-09-14T00:00:00Z');
    $user = User::factory()->create();
    $event = reminderEvent($user);
    $reminder = $event->reminders()->create(['offset_minutes' => 60]);
    $event = $event->fresh(['calendar', 'exceptions', 'reminders']);
    $service = app(CalendarEventService::class);
    $service->refreshReminderSchedule($event);

    expect($reminder->fresh()->next_occurrence_key)->toBe('2026-09-15T02:00:00Z')
        ->and($reminder->fresh()->next_remind_at->toIso8601String())->toBe('2026-09-15T01:00:00+00:00');

    $service->delete($user, $event, 'occurrence', '2026-09-15T02:00:00Z');

    expect($reminder->fresh()->next_occurrence_key)->toBe('2026-09-16T02:00:00Z');
});

it('recalculates reminder timing after a series edit', function () {
    CarbonImmutable::setTestNow('2026-09-14T00:00:00Z');
    $user = User::factory()->create();
    $event = reminderEvent($user, ['recurrence_rule' => null]);
    $event->reminders()->create(['offset_minutes' => 60]);
    $event = $event->fresh(['calendar', 'exceptions', 'reminders']);
    $service = app(CalendarEventService::class);
    $service->refreshReminderSchedule($event);

    $service->update($user, $event, [
        'scope' => 'series',
        'starts_at' => '2026-09-15T12:00:00Z',
        'ends_at' => '2026-09-15T13:00:00Z',
    ]);

    expect($event->reminders()->first()->next_remind_at->toIso8601String())
        ->toBe('2026-09-15T11:00:00+00:00');
});

it('uses a moved occurrence time when recalculating its reminder', function () {
    CarbonImmutable::setTestNow('2026-09-14T00:00:00Z');
    $user = User::factory()->create();
    $event = reminderEvent($user);
    $event->reminders()->create(['offset_minutes' => 60]);
    $event = $event->fresh(['calendar', 'exceptions', 'reminders']);

    app(CalendarEventService::class)->update($user, $event, [
        'scope' => 'occurrence',
        'occurrence_key' => '2026-09-15T02:00:00Z',
        'starts_at' => '2026-09-15T05:00:00Z',
        'ends_at' => '2026-09-15T06:00:00Z',
    ]);

    expect($event->reminders()->first()->next_remind_at->toIso8601String())
        ->toBe('2026-09-15T04:00:00+00:00');
});

it('creates one delivery per reminder occurrence when dispatch runs repeatedly', function () {
    Queue::fake();
    CarbonImmutable::setTestNow('2026-09-15T01:05:00Z');
    $user = User::factory()->create();
    $event = reminderEvent($user, ['recurrence_rule' => null]);
    $event->reminders()->create([
        'offset_minutes' => 60,
        'next_remind_at' => '2026-09-15 01:00:00',
        'next_occurrence_key' => '2026-09-15T02:00:00Z',
    ]);

    $this->artisan('calendar:dispatch-reminders')->assertSuccessful();
    $this->artisan('calendar:dispatch-reminders')->assertSuccessful();

    expect(CalendarEventReminderDelivery::query()->count())->toBe(1);
    Queue::assertPushed(DispatchCalendarEventReminderJob::class, 1);
});

it('always uses the in-app bell and only adds configured push channels', function () {
    $user = User::factory()->create(['push_notifications_enabled' => true]);
    $event = reminderEvent($user, ['recurrence_rule' => null]);
    $reminder = $event->reminders()->create(['offset_minutes' => 10]);
    $delivery = $reminder->deliveries()->create([
        'occurrence_key' => '2026-09-15T02:00:00Z',
        'scheduled_for' => '2026-09-15 01:50:00',
    ]);
    $notification = new CalendarEventReminderNotification($delivery);

    expect($notification->via($user))->toBe(['database']);

    $user->pushTokens()->create([
        'platform' => 'web',
        'provider' => 'webpush',
        'token' => 'web-token',
    ]);
    $user->pushTokens()->create([
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'apns-token',
    ]);

    expect($notification->via($user->fresh()))->toContain('database', WebPushChannel::class, ApnChannel::class);

    $user->update(['push_notifications_enabled' => false]);
    expect($notification->via($user->fresh()))->toBe(['database']);
});
