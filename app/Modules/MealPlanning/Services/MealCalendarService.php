<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\MealCalendarEvent;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\PantryItem;
use Carbon\Carbon;

class MealCalendarService
{
    public function syncPlan(MealPlan $plan): void
    {
        $plan->loadMissing('household', 'items.recipeVersion.recipe');
        MealCalendarEvent::where('meal_plan_id', $plan->id)->delete();
        $times = ['breakfast' => '08:00', 'lunch' => '12:00', 'dinner' => '18:30', 'snack' => '15:30'];
        foreach ($plan->items as $item) {
            $scheduledDate = Carbon::parse($item->scheduled_date)->format('Y-m-d');
            $starts = Carbon::parse($scheduledDate.' '.($item->scheduled_time ?: $times[$item->meal_slot]), $plan->household->timezone)->utc();
            MealCalendarEvent::create(['household_id' => $plan->household_id, 'meal_plan_id' => $plan->id, 'meal_plan_item_id' => $item->id, 'type' => 'meal', 'title' => $item->recipeVersion?->recipe?->name ?? ucfirst($item->meal_slot), 'starts_at' => $starts, 'ends_at' => $starts->copy()->addHour(), 'status' => $item->status, 'metadata' => ['recipe_version_id' => $item->recipe_version_id, 'meal_slot' => $item->meal_slot]]);
            $preparationMinutes = (int) (($item->recipeVersion?->preparation_minutes ?? 0) + ($item->recipeVersion?->cooking_minutes ?? 0));
            if ($preparationMinutes > 0 && ! $item->batch_source_item_id) {
                $preparationStarts = $starts->copy()->subMinutes($preparationMinutes);
                $type = data_get($item->manual_overrides, 'batch_serving_multiplier') ? 'batch_cooking' : 'preparation';
                MealCalendarEvent::create(['household_id' => $plan->household_id, 'meal_plan_id' => $plan->id, 'meal_plan_item_id' => $item->id, 'type' => $type, 'title' => 'Prepare '.($item->recipeVersion?->recipe?->name ?? ucfirst($item->meal_slot)), 'starts_at' => $preparationStarts, 'ends_at' => $starts, 'status' => 'planned', 'metadata' => ['preparation_minutes' => $preparationMinutes]]);
            }
        }
        $planStart = Carbon::parse($plan->start_date);
        $groceryStarts = Carbon::parse($planStart->format('Y-m-d').' 17:00', $plan->household->timezone)->subDay()->utc();
        MealCalendarEvent::create(['household_id' => $plan->household_id, 'meal_plan_id' => $plan->id, 'type' => 'grocery', 'title' => 'Shop for meal plan', 'starts_at' => $groceryStarts, 'ends_at' => $groceryStarts->copy()->addHour(), 'status' => 'planned', 'metadata' => ['shopping_list_id' => $plan->shoppingLists()->latest()->value('id')]]);
        $endDate = $planStart->copy()->addDays($plan->number_of_days - 1);
        PantryItem::with('ingredient')->where('household_id', $plan->household_id)->whereBetween('expires_on', [$planStart, $endDate])->each(function (PantryItem $pantry) use ($plan) {
            $starts = Carbon::parse(Carbon::parse($pantry->expires_on)->format('Y-m-d').' 09:00', $plan->household->timezone)->utc();
            MealCalendarEvent::create(['household_id' => $plan->household_id, 'meal_plan_id' => $plan->id, 'type' => 'pantry_expiry', 'title' => ($pantry->ingredient?->canonical_name ?? 'Pantry item').' expires', 'starts_at' => $starts, 'status' => 'planned', 'metadata' => ['pantry_item_id' => $pantry->id]]);
        });
    }

    public function updateState(int $mealPlanItemId, string $status): void
    {
        MealCalendarEvent::where('meal_plan_item_id', $mealPlanItemId)->where('type', 'meal')->update(['status' => $status]);
    }
}
