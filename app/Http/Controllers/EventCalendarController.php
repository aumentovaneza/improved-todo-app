<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventCalendarRequest;
use App\Models\EventCalendar;
use App\Services\CalendarEventService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EventCalendarController extends Controller
{
    public function __construct(private CalendarEventService $events) {}

    public function store(StoreEventCalendarRequest $request): RedirectResponse
    {
        $this->events->createCalendar($request->user(), $request->validated());

        return back()->with('message', 'Calendar created.');
    }

    public function update(StoreEventCalendarRequest $request, EventCalendar $eventCalendar): RedirectResponse
    {
        $this->events->updateCalendar($request->user(), $eventCalendar, $request->validated());

        return back()->with('message', 'Calendar updated.');
    }

    public function destroy(Request $request, EventCalendar $eventCalendar): RedirectResponse
    {
        $this->events->deleteCalendar($request->user(), $eventCalendar);

        return back()->with('message', 'Calendar removed.');
    }
}
