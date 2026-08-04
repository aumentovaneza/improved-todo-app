<?php

namespace App\Services;

use App\Mail\TestToolEmail;
use App\Models\DailySummary;
use App\Models\User;
use App\Modules\Finance\Models\FinanceInsight;
use App\Notifications\TestNotification;
use Illuminate\Support\Facades\Mail;

class AdminToolsService
{
    /**
     * Send a simple test email to an arbitrary address.
     */
    public function sendTestEmail(string $email, ?string $subject = null, ?string $message = null): void
    {
        Mail::to($email)->send(new TestToolEmail($subject, $message));
    }

    /**
     * Send a test notification to a specific user (mail + database channels).
     */
    public function sendTestNotification(User $user, ?string $message = null): void
    {
        $user->notify(new TestNotification($message));
    }

    /**
     * Clear a user's cached AI daily summaries. Returns the number of rows removed.
     */
    public function clearDailySummary(User $user): int
    {
        return DailySummary::where('user_id', $user->id)->delete();
    }

    /**
     * Clear a user's cached AI spending insights. Returns the number of rows removed.
     */
    public function clearSpendingInsights(User $user): int
    {
        return FinanceInsight::where('user_id', $user->id)->delete();
    }
}
