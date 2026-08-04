<?php

use App\Modules\MealPlanning\Controllers\FoodController;
use App\Modules\MealPlanning\Controllers\HouseholdController;
use App\Modules\MealPlanning\Controllers\HouseholdMemberController;
use App\Modules\MealPlanning\Controllers\MealDiaryController;
use App\Modules\MealPlanning\Controllers\MealIntegrationController;
use App\Modules\MealPlanning\Controllers\MealPlanController;
use App\Modules\MealPlanning\Controllers\MealPlanItemController;
use App\Modules\MealPlanning\Controllers\MealPlanningAdminController;
use App\Modules\MealPlanning\Controllers\MealPlanningPageController;
use App\Modules\MealPlanning\Controllers\PackagedFoodController;
use App\Modules\MealPlanning\Controllers\PantryController;
use App\Modules\MealPlanning\Controllers\RecipeController;
use App\Modules\MealPlanning\Controllers\RegionalPriceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'verified'])->group(function () {
    Route::prefix('meal-planning')->name('meal-planning.')->group(function () {
        Route::get('/', [MealPlanningPageController::class, 'index'])->name('index');
        Route::get('{household}/planner', [MealPlanningPageController::class, 'planner'])->name('planner');
        Route::get('{household}/calendar', [MealPlanningPageController::class, 'calendar'])->name('calendar');
        Route::get('{household}/recipes', [MealPlanningPageController::class, 'recipes'])->name('recipes');
        Route::get('{household}/pantry', [MealPlanningPageController::class, 'pantry'])->name('pantry');
        Route::get('{household}/grocery-list', [MealPlanningPageController::class, 'grocery'])->name('grocery');
        Route::get('{household}/nutrition-profiles', [MealPlanningPageController::class, 'members'])->name('members');
        Route::get('{household}/preferences', [MealPlanningPageController::class, 'preferences'])->name('preferences');
        Route::get('{household}/diary', [MealPlanningPageController::class, 'diary'])->name('diary');
    });

    Route::prefix('meal-planning/api')->name('meal-planning.api.')->group(function () {
        Route::get('households', [HouseholdController::class, 'index'])->name('households.index');
        Route::post('households', [HouseholdController::class, 'store'])->name('households.store');
        Route::get('households/{household}', [HouseholdController::class, 'show'])->name('households.show');
        Route::patch('households/{household}', [HouseholdController::class, 'update'])->name('households.update');
        Route::delete('households/{household}', [HouseholdController::class, 'destroy'])->name('households.destroy');
        Route::post('households/{household}/members', [HouseholdMemberController::class, 'store'])->name('members.store');
        Route::patch('households/{household}/members/{member}', [HouseholdMemberController::class, 'update'])->name('members.update');
        Route::delete('households/{household}/members/{member}', [HouseholdMemberController::class, 'destroy'])->name('members.destroy');
        Route::get('households/{household}/members/{member}/targets', [HouseholdMemberController::class, 'targets'])->name('members.targets');

        Route::get('households/{household}/recipes', [RecipeController::class, 'index'])->name('recipes.index');
        Route::post('households/{household}/recipes', [RecipeController::class, 'store'])->name('recipes.store');
        Route::get('households/{household}/recipes/provider-search', [RecipeController::class, 'searchProvider'])->name('recipes.provider-search');
        Route::post('households/{household}/recipes/import', [RecipeController::class, 'import'])->name('recipes.import');
        Route::get('households/{household}/recipes/{recipe}', [RecipeController::class, 'show'])->name('recipes.show');
        Route::put('households/{household}/recipes/{recipe}', [RecipeController::class, 'update'])->name('recipes.update');
        Route::delete('households/{household}/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('recipes.destroy');
        Route::post('households/{household}/packaged-foods/barcode', [PackagedFoodController::class, 'lookup'])->name('packaged-foods.lookup');
        Route::get('households/{household}/foods/search', [FoodController::class, 'search'])->name('foods.search');
        Route::post('households/{household}/foods/import', [FoodController::class, 'import'])->name('foods.import');
        Route::get('households/{household}/regional-prices', [RegionalPriceController::class, 'index'])->name('prices.index');
        Route::post('households/{household}/regional-prices', [RegionalPriceController::class, 'store'])->name('prices.store');
        Route::delete('households/{household}/regional-prices/{price}', [RegionalPriceController::class, 'destroy'])->name('prices.destroy');

        Route::get('households/{household}/pantry', [PantryController::class, 'index'])->name('pantry.index');
        Route::post('households/{household}/pantry', [PantryController::class, 'store'])->name('pantry.store');
        Route::patch('households/{household}/pantry/{pantryItem}', [PantryController::class, 'update'])->name('pantry.update');
        Route::delete('households/{household}/pantry/{pantryItem}', [PantryController::class, 'destroy'])->name('pantry.destroy');

        Route::get('households/{household}/plans', [MealPlanController::class, 'index'])->name('plans.index');
        Route::post('households/{household}/plans', [MealPlanController::class, 'store'])->name('plans.store');
        Route::get('households/{household}/plans/{mealPlan}', [MealPlanController::class, 'show'])->name('plans.show');
        Route::patch('households/{household}/plans/{mealPlan}', [MealPlanController::class, 'update'])->name('plans.update');
        Route::post('households/{household}/plans/{mealPlan}/generate', [MealPlanController::class, 'generate'])->name('plans.generate');
        Route::post('households/{household}/plans/{mealPlan}/regenerate', [MealPlanController::class, 'regenerate'])->name('plans.regenerate');
        Route::post('households/{household}/plans/{mealPlan}/days/{date}/regenerate', [MealPlanController::class, 'regenerateDay'])->where('date', '\\d{4}-\\d{2}-\\d{2}')->name('plans.regenerate-day');
        Route::patch('households/{household}/plans/{mealPlan}/items/{item}', [MealPlanItemController::class, 'update'])->name('plan-items.update');
        Route::post('households/{household}/plans/{mealPlan}/calendar/sync', [MealIntegrationController::class, 'syncCalendar'])->name('calendar.sync');
        Route::post('households/{household}/plans/{mealPlan}/shopping/rebuild', [MealPlanController::class, 'rebuildShopping'])->name('shopping.rebuild');

        Route::get('households/{household}/diary', [MealDiaryController::class, 'index'])->name('diary.index');
        Route::post('households/{household}/diary', [MealDiaryController::class, 'store'])->name('diary.store');
        Route::patch('households/{household}/diary/{entry}', [MealDiaryController::class, 'update'])->name('diary.update');
        Route::delete('households/{household}/diary/{entry}', [MealDiaryController::class, 'destroy'])->name('diary.destroy');
        Route::post('households/{household}/diary/{entry}/restore', [MealDiaryController::class, 'restore'])->name('diary.restore');
        Route::post('households/{household}/plan-items/{item}/mark-eaten', [MealDiaryController::class, 'markAsPlanned'])->name('diary.mark-planned');
        Route::get('households/{household}/members/{member}/nutrition-summary', [MealDiaryController::class, 'summary'])->name('diary.summary');

        Route::post('households/{household}/calendar-events/{event}/tasks', [MealIntegrationController::class, 'createTask'])->name('events.tasks.store');
        Route::patch('households/{household}/calendar-events/{event}', [MealIntegrationController::class, 'moveEvent'])->name('events.move');
        Route::post('households/{household}/planned-expenses', [MealIntegrationController::class, 'storeExpense'])->name('expenses.store');
        Route::post('households/{household}/planned-expenses/{expense}/confirm', [MealIntegrationController::class, 'confirmExpense'])->name('expenses.confirm');
    });

    Route::prefix('admin/meal-planning')->name('admin.meal-planning.')->middleware('admin')->group(function () {
        Route::get('/', [MealPlanningAdminController::class, 'index'])->name('index');
        Route::post('duplicates/{candidate}/resolve', [MealPlanningAdminController::class, 'resolveDuplicate'])->name('duplicates.resolve');
        Route::post('aliases/{alias}/confirm', [MealPlanningAdminController::class, 'confirmAlias'])->name('aliases.confirm');
        Route::delete('providers/{provider}/circuit', [MealPlanningAdminController::class, 'resetProvider'])->name('providers.reset');
    });
});
