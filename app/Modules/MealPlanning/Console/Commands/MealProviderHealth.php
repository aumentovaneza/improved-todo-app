<?php

namespace App\Modules\MealPlanning\Console\Commands;

use App\Modules\MealPlanning\Models\MealProviderRequest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class MealProviderHealth extends Command
{
    protected $signature = 'meal-planning:provider-health';

    protected $description = 'Report provider usage, failures, latency, and circuit state';

    public function handle(): int
    {
        $rows = MealProviderRequest::where('created_at', '>=', now()->subDay())->get()->groupBy('provider')->map(function ($requests, $provider) {
            return [$provider, $requests->count(), $requests->where('successful', false)->count(), round((float) $requests->avg('duration_ms')), Cache::get('meal-provider-circuit:'.$provider) ? 'open' : 'closed'];
        })->values()->all();
        $this->table(['Provider', 'Requests (24h)', 'Failures', 'Average ms', 'Circuit'], $rows);

        return self::SUCCESS;
    }
}
