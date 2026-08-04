<?php

namespace App\Console\Commands;

use App\Jobs\SendDailyDigestJob;
use App\Models\User;
use Illuminate\Console\Command;

class SendDailyDigests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-digests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch the daily task digest to opted-in users at their local morning hour';

    /**
     * The local hour (24h) at which the digest is delivered. There is no
     * per-user digest-time preference column yet, so we use a fixed morning
     * hour; the per-user timezone still staggers delivery across the day.
     */
    private const DIGEST_HOUR = 8;

    /**
     * Execute the console command.
     *
     * Scheduled hourly. For each opted-in user we compare the current hour in
     * their own timezone against the digest hour; only the single matching
     * hourly run per user dispatches a job, which keeps delivery idempotent
     * (one digest per user per day) without a separate tracking table.
     */
    public function handle(): int
    {
        $dispatched = 0;

        User::where('daily_digest_enabled', true)
            ->chunkById(200, function ($users) use (&$dispatched) {
                foreach ($users as $user) {
                    if ((int) $user->nowInUserTimezone()->hour !== self::DIGEST_HOUR) {
                        continue;
                    }

                    SendDailyDigestJob::dispatch($user->id);
                    $dispatched++;
                }
            });

        $this->info("Dispatched {$dispatched} daily digest job(s).");

        return self::SUCCESS;
    }
}
