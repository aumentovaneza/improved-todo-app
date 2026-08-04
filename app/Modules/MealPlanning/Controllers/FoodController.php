<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Data\ExternalNutritionData;
use App\Modules\MealPlanning\Data\FoodSearchCriteria;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Requests\FoodLookupRequest;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;

class FoodController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private ProviderRegistry $providers, private ProviderImportService $imports) {}

    public function search(FoodLookupRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $local = Ingredient::with('nutritionRecords')->where('canonical_name', 'like', '%'.$request->validated('query').'%')->limit($request->integer('limit', 20))->get();
        $external = [];
        $providerName = $request->validated('provider', 'usda_fdc');
        foreach ($this->providers->nutrition() as $provider) {
            if ($provider->name() !== $providerName || ! $provider->enabled()) {
                continue;
            }
            try {
                $external = $provider->search(new FoodSearchCriteria($request->validated('query'), $request->integer('limit', 20)))->foods;
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        return response()->json(['data' => ['local' => $local, 'external' => collect($external)->map(fn (ExternalNutritionData $food) => $this->safe($food))], 'meta' => ['local_first' => true, 'provider' => $providerName]]);
    }

    public function import(FoodLookupRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $key = $request->validated('idempotency_key');
        if (! cache()->add('meal-food-import:'.$key, true, now()->addDay())) {
            return response()->json(['data' => ['duplicate' => true]], 202);
        }
        $providerName = $request->validated('provider', 'usda_fdc');
        foreach ($this->providers->nutrition() as $provider) {
            if ($provider->name() !== $providerName || ! $provider->enabled()) {
                continue;
            }
            $food = $provider->getNutrition($request->validated('external_id'));
            if ($food) {
                return response()->json(['data' => $this->imports->importNutrition($food, $request->integer('ingredient_id') ?: null)], 201);
            }
        }

        return response()->json(['message' => 'No local or cached nutrition record could satisfy the required lookup.'], 503);
    }

    private function safe(ExternalNutritionData $food): array
    {
        return ['provider' => $food->provider, 'external_id' => $food->externalId, 'description' => $food->description, 'serving_quantity' => $food->servingQuantity, 'serving_unit' => $food->servingUnit, 'nutrients' => $food->nutrients, 'confidence' => $food->confidence, 'source_url' => $food->sourceUrl];
    }
}
