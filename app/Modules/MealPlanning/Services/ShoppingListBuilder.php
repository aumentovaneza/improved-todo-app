<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\ShoppingList;
use Illuminate\Support\Facades\DB;

class ShoppingListBuilder
{
    public function build(MealPlan $plan): ShoppingList
    {
        $plan->loadMissing('household', 'items.recipeVersion.ingredients.ingredient', 'items.portions');
        $old = $plan->shoppingLists()->latest()->first();
        if ($old) {
            $old->delete();
        }
        $list = $plan->shoppingLists()->create(['known_cost_total' => 0, 'unknown_price_count' => 0, 'currency' => $plan->household->currency, 'budget_status' => 'indeterminate']);
        $needs = [];
        foreach ($plan->items->whereNotIn('status', ['skipped']) as $item) {
            if ($item->batch_source_item_id) {
                continue;
            }
            $plannedServings = (float) data_get($item->manual_overrides, 'batch_serving_multiplier', $item->portions->sum('serving_multiplier'));
            $factor = $plannedServings / max(1, $item->recipeVersion?->servings ?? 1);
            foreach ($item->recipeVersion?->ingredients ?? [] as $row) {
                if (! $row->ingredient_id || ! $row->normalized_quantity || ! $row->normalized_unit) {
                    continue;
                }
                $key = $row->ingredient_id.':'.$row->normalized_unit;
                $needs[$key] ??= ['ingredient' => $row->ingredient, 'quantity' => 0.0, 'unit' => $row->normalized_unit];
                $needs[$key]['quantity'] += (float) $row->normalized_quantity * $factor;
            }
        }
        $known = 0;
        $unknown = 0;
        foreach ($needs as $need) {
            $reserved = (float) DB::table('pantry_reservations')->join('pantry_items', 'pantry_items.id', '=', 'pantry_reservations.pantry_item_id')->join('meal_plan_items', 'meal_plan_items.id', '=', 'pantry_reservations.meal_plan_item_id')->where('meal_plan_items.meal_plan_id', $plan->id)->where('pantry_items.ingredient_id', $need['ingredient']->id)->where('pantry_reservations.status', 'reserved')->sum('pantry_reservations.quantity');
            $purchase = max(0, $need['quantity'] - $reserved);
            $package = DB::table('ingredient_package_sizes')->where('ingredient_id', $need['ingredient']->id)->where('country_code', $plan->household->country_code)->where('unit', $need['unit'])->orderBy('quantity')->first();
            if ($package && $purchase > 0) {
                $purchase = ceil($purchase / (float) $package->quantity) * (float) $package->quantity;
            }
            $price = DB::table('regional_ingredient_prices')->where('ingredient_id', $need['ingredient']->id)->where('currency', $plan->household->currency)->where(fn ($q) => $q->where('household_id', $plan->household_id)->orWhereNull('household_id'))->orderByRaw('household_id IS NULL')->first();
            $cost = $price && $price->unit === $need['unit'] ? round($purchase / max(.001, (float) $price->quantity) * (float) $price->price, 2) : null;
            $cost === null ? $unknown++ : $known += $cost;
            $list->items()->create(['ingredient_id' => $need['ingredient']->id, 'category' => $need['ingredient']->category, 'required_quantity' => $need['quantity'], 'pantry_quantity' => $reserved, 'purchase_quantity' => $purchase, 'unit' => $need['unit'], 'estimated_cost' => $cost, 'cost_confidence' => $cost === null ? 'unknown' : 'high']);
        }
        $budgetValue = data_get((array) $plan->getAttribute('settings'), 'budget_total');
        $budget = is_numeric($budgetValue) ? (float) $budgetValue : null;
        $status = $unknown ? 'indeterminate' : ($budget !== null && $known > $budget ? 'over' : 'within');
        $list->update(['known_cost_total' => $known, 'unknown_price_count' => $unknown, 'budget_status' => $status]);

        return $list->fresh('items');
    }
}
