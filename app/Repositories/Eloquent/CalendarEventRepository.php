<?php

namespace App\Repositories\Eloquent;

use App\Models\CalendarEvent;
use App\Repositories\Contracts\CalendarEventRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

class CalendarEventRepository implements CalendarEventRepositoryInterface
{
    public function getForRange(
        int $userId,
        CarbonInterface $start,
        CarbonInterface $end,
        array $calendarIds = []
    ): Collection {
        return CalendarEvent::query()
            ->where('user_id', $userId)
            ->when($calendarIds, fn ($query) => $query->whereIn('event_calendar_id', $calendarIds))
            ->where(function ($query) use ($start, $end) {
                $query->whereNotNull('recurrence_rule')
                    ->orWhere(function ($timed) use ($start, $end) {
                        $timed->where('is_all_day', false)
                            ->where('starts_at', '<=', $end)
                            ->where('ends_at', '>=', $start);
                    })
                    ->orWhere(function ($allDay) use ($start, $end) {
                        $allDay->where('is_all_day', true)
                            ->whereDate('start_date', '<=', $end->format('Y-m-d'))
                            ->whereDate('end_date', '>=', $start->format('Y-m-d'));
                    });
            })
            ->with(['calendar', 'exceptions', 'reminders'])
            ->get();
    }

    public function create(array $attributes): CalendarEvent
    {
        return CalendarEvent::create($attributes);
    }

    public function update(CalendarEvent $event, array $attributes): CalendarEvent
    {
        $event->update($attributes);

        return $event->fresh(['calendar', 'exceptions', 'reminders']);
    }

    public function delete(CalendarEvent $event): bool
    {
        return $event->delete();
    }
}
