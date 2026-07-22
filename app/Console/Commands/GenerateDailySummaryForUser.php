<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DailySummaryService;
use Illuminate\Console\Command;

class GenerateDailySummaryForUser extends Command
{
    /**
     * Force-regenerate today's summary for a single user, overwriting any
     * existing one. Unlike the on-demand refresh endpoint, this bypasses the
     * once-per-day guard, so it is handy for testing the AI output.
     */
    protected $signature = 'app:generate-daily-summary {user : User id or email}';

    protected $description = "Force-generate (overwrite) today's AI daily summary for a single user";

    public function handle(DailySummaryService $service): int
    {
        $identifier = (string) $this->argument('user');

        $user = User::query()
            ->when(ctype_digit($identifier), fn ($q) => $q->where('id', (int) $identifier))
            ->when(! ctype_digit($identifier), fn ($q) => $q->where('email', $identifier))
            ->first();

        if (! $user) {
            $this->error("No user found matching \"{$identifier}\".");

            return self::FAILURE;
        }

        $this->info("Generating daily summary for {$user->name} <{$user->email}>...");

        $summary = $service->generateForUser($user);

        $this->newLine();
        $this->line('Date:     '.$summary->summary_date->format('Y-m-d'));
        $this->line("Provider: {$summary->provider} · {$summary->model}");
        $this->newLine();
        $this->line($summary->content);
        $this->newLine();

        return self::SUCCESS;
    }
}
