<?php

namespace App\Repositories\Contracts;

use App\Models\CalendarEvent;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

interface CalendarEventRepositoryInterface
{
    public function getForRange(
        int $userId,
        CarbonInterface $start,
        CarbonInterface $end,
        array $calendarIds = []
    ): Collection;

    public function create(array $attributes): CalendarEvent;

    public function update(CalendarEvent $event, array $attributes): CalendarEvent;

    public function delete(CalendarEvent $event): bool;
}
