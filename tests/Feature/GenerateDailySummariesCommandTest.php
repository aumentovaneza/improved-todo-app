<?php

use App\Jobs\GenerateDailySummaryJob;
use App\Models\DailySummary;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;

afterEach(function () {
    Carbon::setTestNow();
});

it('dispatches the job only for enabled users whose local hour matches', function () {
    Queue::fake();

    // 2026-07-23 06:00 UTC.
    Carbon::setTestNow(Carbon::create(2026, 7, 23, 6, 0, 0, 'UTC'));

    // Manila is UTC+8 => local time is 14:00, matches "14:00".
    $due = User::factory()->create([
        'timezone' => 'Asia/Manila',
        'daily_summary_enabled' => true,
        'daily_summary_time' => '14:00',
    ]);

    // Same tz but preference is a different hour.
    $wrongHour = User::factory()->create([
        'timezone' => 'Asia/Manila',
        'daily_summary_enabled' => true,
        'daily_summary_time' => '09:00',
    ]);

    // Right hour but summaries disabled.
    $disabled = User::factory()->create([
        'timezone' => 'Asia/Manila',
        'daily_summary_enabled' => false,
        'daily_summary_time' => '14:00',
    ]);

    $this->artisan('app:generate-daily-summaries')->assertSuccessful();

    Queue::assertPushed(GenerateDailySummaryJob::class, 1);
    Queue::assertPushed(
        GenerateDailySummaryJob::class,
        fn (GenerateDailySummaryJob $job) => $job->userId === $due->id
    );
});

it('does not re-dispatch when a summary already exists for today', function () {
    Queue::fake();

    Carbon::setTestNow(Carbon::create(2026, 7, 23, 6, 0, 0, 'UTC'));

    $user = User::factory()->create([
        'timezone' => 'Asia/Manila',
        'daily_summary_enabled' => true,
        'daily_summary_time' => '14:00',
    ]);

    DailySummary::factory()->create([
        'user_id' => $user->id,
        'summary_date' => $user->nowInUserTimezone()->toDateString(),
    ]);

    $this->artisan('app:generate-daily-summaries')->assertSuccessful();

    Queue::assertNotPushed(GenerateDailySummaryJob::class);
});
