<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\DailySummaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateDailySummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $userId
    ) {}

    public function handle(DailySummaryService $service): void
    {
        $user = User::find($this->userId);

        if (! $user) {
            return;
        }

        if (! $service->userCanUseSummary($user)) {
            return;
        }

        $service->generateForUser($user);
    }
}
