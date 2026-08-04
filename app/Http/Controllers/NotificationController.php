<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mark a single notification as read for the current user.
     */
    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->whereKey($id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return redirect()->back();
    }

    /**
     * Mark all of the current user's notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return redirect()->back();
    }
}
