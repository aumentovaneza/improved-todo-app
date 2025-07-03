<?php

namespace App\Http\Controllers;

use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GoogleCalendarController extends Controller
{
    public function __construct(
        private GoogleCalendarService $googleCalendarService
    ) {}

    /**
     * Redirect to Google OAuth
     */
    public function redirect()
    {
        return redirect($this->googleCalendarService->getAuthUrl());
    }

    /**
     * Handle OAuth callback
     */
    public function callback(Request $request)
    {
        $user = Auth::user();
        $result = $this->googleCalendarService->handleCallback($request->input('code'), $user);

        if ($result['success']) {
            return redirect()->route('tasks.index')->with('success', $result['message']);
        }

        return redirect()->route('tasks.index')->with('error', $result['message']);
    }

    /**
     * Disconnect Google Calendar
     */
    public function disconnect()
    {
        $user = Auth::user();
        $success = $this->googleCalendarService->disconnect($user);

        if ($success) {
            return redirect()->back()->with('success', 'Google Calendar disconnected successfully');
        }

        return redirect()->back()->with('error', 'Failed to disconnect Google Calendar');
    }

    /**
     * Sync tasks from Google Calendar
     */
    public function sync()
    {
        $user = Auth::user();
        $result = $this->googleCalendarService->syncFromCalendar($user);

        if ($result['success']) {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Get sync statistics
     */
    public function stats()
    {
        $user = Auth::user();
        $stats = $this->googleCalendarService->getSyncStats($user);

        return response()->json($stats);
    }
}
