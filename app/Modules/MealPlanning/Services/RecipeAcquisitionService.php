<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\Recipe;

class RecipeAcquisitionService
{
    public function __construct(private ProviderRegistry $providers, private ProviderImportService $imports) {}

    public function ensureCandidatePool(MealPlan $plan, int $minimum = 20): void
    {
        if (Recipe::availableTo($plan->household_id)->count() >= $minimum) {
            return;
        }
        foreach ($this->providers->recipes() as $provider) {
            if (! $provider->enabled() || $provider->name() === 'internal') {
                continue;
            }
            try {
                $criteria = new RecipeSearchCriteria(query: data_get($plan->settings, 'acquisition_query'), limit: $minimum);
                foreach ($provider->search($criteria)->recipes as $recipe) {
                    $this->imports->importRecipe($recipe);
                }
            } catch (\Throwable $exception) {
                report($exception);
            }
            if (Recipe::availableTo($plan->household_id)->count() >= $minimum) {
                return;
            }
        }
    }
}
