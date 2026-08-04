<?php

namespace App\Modules\MealPlanning\Console\Commands;

use App\Modules\MealPlanning\Models\IngredientNutrition;
use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;
use Illuminate\Console\Command;

class RefreshStaleMealNutrition extends Command
{
    protected $signature = 'meal-planning:refresh-nutrition {--days=180}';

    protected $description = 'Refresh stale provider-backed ingredient nutrition snapshots';

    public function handle(ProviderRegistry $providers, ProviderImportService $imports): int
    {
        $providerMap = collect($providers->nutrition())->keyBy->name();
        $count = 0;
        IngredientNutrition::whereNotNull('external_id')->where('retrieved_at', '<', now()->subDays((int) $this->option('days')))->each(function (IngredientNutrition $record) use ($providerMap, $imports, &$count) {
            $provider = $providerMap->get($record->provider);
            if (! $provider?->enabled()) {
                return;
            }
            $fresh = $provider->getNutrition($record->external_id);
            if ($fresh) {
                $imports->importNutrition($fresh, $record->ingredient_id);
                $count++;
            }
        });
        $this->info("Refreshed {$count} nutrition records.");

        return self::SUCCESS;
    }
}
