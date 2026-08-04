<?php

namespace App\Modules\MealPlanning;

use App\Modules\MealPlanning\Console\Commands\MealProviderHealth;
use App\Modules\MealPlanning\Console\Commands\RefreshStaleMealNutrition;
use App\Modules\MealPlanning\Console\Commands\ScanMealRecipeDuplicates;
use App\Modules\MealPlanning\Console\Commands\SyncMealProviders;
use App\Modules\MealPlanning\Contracts\NutritionProvider;
use App\Modules\MealPlanning\Contracts\PackagedFoodProvider;
use App\Modules\MealPlanning\Contracts\RecipeProvider;
use App\Modules\MealPlanning\Providers\OpenFoodFactsProductProvider;
use App\Modules\MealPlanning\Providers\TheMealDbRecipeProvider;
use App\Modules\MealPlanning\Providers\UsdaNutritionProvider;
use Illuminate\Support\ServiceProvider;

class MealPlanningServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(RecipeProvider::class, TheMealDbRecipeProvider::class);
        $this->app->bind(NutritionProvider::class, UsdaNutritionProvider::class);
        $this->app->bind(PackagedFoodProvider::class, OpenFoodFactsProductProvider::class);
    }

    public function boot(): void
    {
        if (config('services.meal_planning.enabled', true)) {
            $this->loadRoutesFrom(__DIR__.'/routes.php');
        }
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
        if ($this->app->runningInConsole()) {
            $this->commands([SyncMealProviders::class, ScanMealRecipeDuplicates::class, RefreshStaleMealNutrition::class, MealProviderHealth::class]);
        }
    }
}
