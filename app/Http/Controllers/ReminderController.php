<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use App\Services\ReminderService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    public function __construct(
        private ReminderService $reminderService
    ) {}

    /**
     * Display a listing of the user's reminders
     */
    public function index(): Response
    {
        $reminders = $this->reminderService->getRemindersForUser(Auth::id());
        $reminderStats = $this->reminderService->getReminderStatsForUser(Auth::id());

        return Inertia::render('Reminders/Index', [
            'reminders' => $reminders,
            'stats' => $reminderStats,
        ]);
    }

    /**
     * Store a newly created reminder
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'remind_at' => 'required|date|after:now',
                'type' => 'required|string|in:email,notification,sms',
                'message' => 'nullable|string|max:500',
            ]);

            $reminder = $this->reminderService->createReminder($validated, Auth::id());

            return back()->with('message', 'Reminder created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create reminder: ' . $e->getMessage()]);
        }
    }

    /**
     * Update the specified reminder
     */
    public function update(Request $request, Reminder $reminder): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'remind_at' => 'required|date|after:now',
                'type' => 'required|string|in:email,notification,sms',
                'message' => 'nullable|string|max:500',
            ]);

            $updatedReminder = $this->reminderService->updateReminder($reminder, $validated, Auth::id());

            return back()->with('message', 'Reminder updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update reminder: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified reminder
     */
    public function destroy(Reminder $reminder): RedirectResponse
    {
        try {
            $this->reminderService->deleteReminder($reminder, Auth::id());
            return back()->with('message', 'Reminder deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete reminder: ' . $e->getMessage()]);
        }
    }

    /**
     * Snooze the specified reminder
     */
    public function snooze(Request $request, Reminder $reminder): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'minutes' => 'required|integer|min:5|max:1440', // 5 minutes to 24 hours
            ]);

            $snoozedReminder = $this->reminderService->snoozeReminder(
                $reminder,
                $validated['minutes'],
                Auth::id()
            );

            return back()->with('message', "Reminder snoozed for {$validated['minutes']} minutes");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to snooze reminder: ' . $e->getMessage()]);
        }
    }

    /**
     * Get pending reminders for the authenticated user
     */
    public function pending(): Response
    {
        $pendingReminders = $this->reminderService->getPendingRemindersForUser(Auth::id());
        $overdueReminders = $this->reminderService->getOverdueRemindersForUser(Auth::id());

        return Inertia::render('Reminders/Pending', [
            'pending' => $pendingReminders,
            'overdue' => $overdueReminders,
        ]);
    }

    /**
     * Get reminders for a specific task
     */
    public function forTask(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
        ]);

        try {
            $reminders = $this->reminderService->getRemindersForTask($validated['task_id'], Auth::id());
            return response()->json(['reminders' => $reminders]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch reminders'], 500);
        }
    }

    /**
     * Create multiple reminders for a task
     */
    public function createMultiple(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'reminders' => 'required|array|min:1',
                'reminders.*.remind_at' => 'required|date|after:now',
                'reminders.*.type' => 'required|string|in:email,notification,sms',
                'reminders.*.message' => 'nullable|string|max:500',
            ]);

            $reminders = $this->reminderService->createMultipleReminders(
                $validated['task_id'],
                $validated['reminders'],
                Auth::id()
            );

            return back()->with('message', "Created {$reminders->count()} reminders successfully");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create reminders: ' . $e->getMessage()]);
        }
    }
}
