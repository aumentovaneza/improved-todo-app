<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCalendarEventRequest;
use App\Http\Requests\UpdateCalendarEventRequest;
use App\Models\CalendarEvent;
use App\Services\CalendarEventService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function __construct(private CalendarEventService $events) {}

    public function store(StoreCalendarEventRequest $request): RedirectResponse
    {
        $this->events->create($request->user(), $request->validated());

        return back()->with('message', 'Event added to your calendar.');
    }

    public function update(UpdateCalendarEventRequest $request, CalendarEvent $calendarEvent): RedirectResponse
    {
        $this->events->update($request->user(), $calendarEvent, $request->validated());

        return back()->with('message', 'Event updated.');
    }

    public function destroy(Request $request, CalendarEvent $calendarEvent): RedirectResponse
    {
        $validated = $request->validate([
            'scope' => ['required', 'in:series,occurrence'],
            'occurrence_key' => ['nullable', 'required_if:scope,occurrence', 'string', 'max:80'],
        ]);

        $this->events->delete(
            $request->user(),
            $calendarEvent,
            $validated['scope'],
            $validated['occurrence_key'] ?? null
        );

        return back()->with('message', 'Event removed.');
    }
}
