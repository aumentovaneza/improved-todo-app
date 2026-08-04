<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * The full notification center (paginated history).
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Notifications/Index', [
            'notifications' => $request->user()->notifications()->paginate(20),
        ]);
    }

    /**
     * The bell popover's data source: the latest notifications plus the live
     * unread count. Session-authed web route returning JSON (not a separate
     * API layer) — mirrors the app's other JSON web endpoints.
     */
    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'notifications' => $user->notifications()->latest()->limit(15)->get(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return back();
    }

    /**
     * Mark every unread notification as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): RedirectResponse
    {
        $request->user()->notifications()->findOrFail($id)->delete();

        return back();
    }
}
