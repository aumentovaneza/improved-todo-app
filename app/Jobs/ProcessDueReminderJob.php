<?php

namespace App\Jobs;

use App\Models\Reminder;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessDueReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $reminderId
    ) {}

    public function handle(NotificationService $service): void
    {
        $reminder = Reminder::with('task.user')->find($this->reminderId);

        // Skip if the reminder vanished or was already delivered (idempotency).
        if (! $reminder || $reminder->is_sent) {
            return;
        }

        $service->sendCustomReminder($reminder);
    }
}
