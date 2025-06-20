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
