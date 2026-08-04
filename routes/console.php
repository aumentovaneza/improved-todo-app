<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the recurring tasks reset to run daily at midnight
Schedule::command('tasks:reset-recurring')
    ->daily()
    ->description('Reset completed recurring tasks for the next occurrence');

// Dispatch AI daily summaries every hour; the command decides which users are
// due based on their per-user local time preference.
Schedule::command('app:generate-daily-summaries')
    ->hourly()
    ->description('Generate AI daily summaries');

// Dispatch due reminders and due-soon/overdue task notifications. Runs often so
// due-soon windows are caught promptly; idempotency markers prevent duplicates.
Schedule::command('notifications:dispatch')
    ->everyFifteenMinutes()
    ->description('Dispatch reminder and task due/overdue notifications');

Schedule::command('calendar:dispatch-reminders')
    ->everyMinute()
    ->withoutOverlapping()
    ->description('Dispatch native calendar event reminders');

// Dispatch daily digests every hour; the command sends to each user only when
// their local time hits the digest hour.
Schedule::command('notifications:send-digests')
    ->hourly()
    ->description('Send daily task digest emails to opted-in users');
