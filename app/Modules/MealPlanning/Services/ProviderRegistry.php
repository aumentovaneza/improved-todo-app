<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Contracts\NutritionProvider;
use App\Modules\MealPlanning\Contracts\PackagedFoodProvider;
use App\Modules\MealPlanning\Contracts\RecipeProvider;
use App\Modules\MealPlanning\Providers\EdamamNutritionProvider;
use App\Modules\MealPlanning\Providers\InternalRecipeProvider;
use App\Modules\MealPlanning\Providers\OpenFoodFactsProductProvider;
use App\Modules\MealPlanning\Providers\SpoonacularRecipeProvider;
use App\Modules\MealPlanning\Providers\TheMealDbRecipeProvider;
use App\Modules\MealPlanning\Providers\UsdaNutritionProvider;
use InvalidArgumentException;

class ProviderRegistry
{
    /** @return array<int, RecipeProvider> */
    public function recipes(): array
    {
        return [app(InternalRecipeProvider::class), app(TheMealDbRecipeProvider::class), app(SpoonacularRecipeProvider::class)];
    }

    /** @return array<int, NutritionProvider> */
    public function nutrition(): array
    {
        return [app(UsdaNutritionProvider::class), app(EdamamNutritionProvider::class)];
    }

    /** @return array<int, PackagedFoodProvider> */
    public function packagedFoods(): array
    {
        return [app(OpenFoodFactsProductProvider::class)];
    }

    public function recipe(string $name): RecipeProvider
    {
        foreach ($this->recipes() as $provider) {
            if ($provider->name() === $name) {
                return $provider;
            }
        }
        throw new InvalidArgumentException("Unknown recipe provider: {$name}");
    }
}
