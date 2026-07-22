<?php

namespace App\Console\Commands;

use App\Jobs\GenerateDailySummaryJob;
use App\Models\User;
use App\Repositories\Contracts\DailySummaryRepositoryInterface;
use App\Services\DailySummaryService;
use Illuminate\Console\Command;

class GenerateDailySummaries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-daily-summaries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch AI daily summary generation for users whose local time matches their preference';

    /**
     * Execute the console command.
     */
    public function handle(
        DailySummaryService $summaryService,
        DailySummaryRepositoryInterface $repository
    ): int {
        $dispatched = 0;

        User::where('daily_summary_enabled', true)
            ->chunkById(200, function ($users) use ($summaryService, $repository, &$dispatched) {
                foreach ($users as $user) {
                    if (! $summaryService->userCanUseSummary($user)) {
                        continue;
                    }

                    $userNow = $user->nowInUserTimezone();
                    $currentHourLabel = $userNow->format('H:00');
                    $preferredHourLabel = $this->normalizeToHour($user->daily_summary_time);

                    if ($currentHourLabel !== $preferredHourLabel) {
                        continue;
                    }

                    // Skip if today's summary was already generated.
                    if ($repository->findForUserOnDate($user->id, $userNow)) {
                        continue;
                    }

                    GenerateDailySummaryJob::dispatch($user->id);
                    $dispatched++;
                }
            });

        $this->info("Dispatched {$dispatched} daily summary job(s).");

        return self::SUCCESS;
    }

    /**
     * Reduce a stored "HH:MM" (or "HH:MM:SS") preference to a top-of-hour label.
     */
    private function normalizeToHour(?string $time): string
    {
        if (! $time) {
            return '08:00';
        }

        $hour = explode(':', $time)[0] ?? '08';

        return str_pad($hour, 2, '0', STR_PAD_LEFT).':00';
    }
}
