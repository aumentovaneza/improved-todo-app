<?php

use App\Models\CalendarMonthTitle;
use App\Models\User;

test('calendar page exposes the custom title for the current month', function () {
    $user = User::factory()->create();

    CalendarMonthTitle::create([
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'Sprint season',
    ]);

    $this->actingAs($user)
        ->get('/calendar?date=2026-07-15')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Calendar/Index')
            ->where('monthTitle', 'Sprint season'));
});

test('month title is null when none is set', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/calendar?date=2026-07-15')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('monthTitle', null));
});

test('a user can set a title for a month', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('calendar.month-title.update'), [
            'year' => 2026,
            'month' => 7,
            'title' => '  Focus month  ',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('calendar_month_titles', [
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'Focus month',
    ]);
});

test('setting a title again updates the existing record', function () {
    $user = User::factory()->create();

    CalendarMonthTitle::create([
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'Old title',
    ]);

    $this->actingAs($user)
        ->post(route('calendar.month-title.update'), [
            'year' => 2026,
            'month' => 7,
            'title' => 'New title',
        ])
        ->assertRedirect();

    expect(CalendarMonthTitle::where('user_id', $user->id)->count())->toBe(1);
    $this->assertDatabaseHas('calendar_month_titles', [
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'New title',
    ]);
});

test('an empty title clears the month title', function () {
    $user = User::factory()->create();

    CalendarMonthTitle::create([
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
        'title' => 'Remove me',
    ]);

    $this->actingAs($user)
        ->post(route('calendar.month-title.update'), [
            'year' => 2026,
            'month' => 7,
            'title' => '   ',
        ])
        ->assertRedirect();

    $this->assertDatabaseMissing('calendar_month_titles', [
        'user_id' => $user->id,
        'year' => 2026,
        'month' => 7,
    ]);
});

test('month title update validates the month range', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('calendar.month-title.update'), [
            'year' => 2026,
            'month' => 13,
            'title' => 'Nope',
        ])
        ->assertSessionHasErrors('month');
});

test('guests cannot update a month title', function () {
    $this->post(route('calendar.month-title.update'), [
        'year' => 2026,
        'month' => 7,
        'title' => 'Nope',
    ])->assertRedirect('/login');
});
