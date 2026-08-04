<?php

namespace App\Modules\MealPlanning\Console\Commands;

use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;
use Illuminate\Console\Command;

class SyncMealProviders extends Command
{
    protected $signature = 'meal-planning:sync-providers {--query=} {--limit=20}';

    protected $description = 'Import normalized recipes from enabled recipe providers';

    public function handle(ProviderRegistry $providers, ProviderImportService $imports): int
    {
        $count = 0;
        foreach ($providers->recipes() as $provider) {
            if (! $provider->enabled() || $provider->name() === 'internal') {
                continue;
            }
            foreach ($provider->search(new RecipeSearchCriteria(query: $this->option('query'), limit: (int) $this->option('limit')))->recipes as $recipe) {
                $imports->importRecipe($recipe);
                $count++;
            }
        }
        $this->info("Imported or synchronized {$count} recipes.");

        return self::SUCCESS;
    }
}
