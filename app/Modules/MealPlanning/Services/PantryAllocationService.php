<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\MealPlanItem;
use App\Modules\MealPlanning\Models\PantryItem;
use App\Modules\MealPlanning\Models\PantryReservation;
use Illuminate\Support\Facades\DB;

class PantryAllocationService
{
    public function reserve(MealPlanItem $item): void
    {
        if ($item->batch_source_item_id) {
            return;
        }
        $item->loadMissing('mealPlan.household', 'recipeVersion.ingredients', 'portions');
        $plannedServings = (float) data_get($item->manual_overrides, 'batch_serving_multiplier', $item->portions->sum('serving_multiplier'));
        $servingFactor = $plannedServings / max(1, $item->recipeVersion?->servings ?? 1);
        foreach ($item->recipeVersion?->ingredients ?? [] as $ingredient) {
            if (! $ingredient->ingredient_id || ! $ingredient->normalized_quantity || ! $ingredient->normalized_unit) {
                continue;
            }
            $needed = (float) $ingredient->normalized_quantity * $servingFactor;
            $pantry = PantryItem::where('household_id', $item->mealPlan->household_id)->where('ingredient_id', $ingredient->ingredient_id)->where('unit', $ingredient->normalized_unit)->orderByRaw('expires_on IS NULL')->orderBy('expires_on')->lockForUpdate()->get();
            foreach ($pantry as $stock) {
                $available = max(0, (float) $stock->quantity - (float) $stock->reserved_quantity);
                $allocated = min($available, $needed);
                if ($allocated <= 0) {
                    continue;
                }
                PantryReservation::create(['pantry_item_id' => $stock->id, 'meal_plan_item_id' => $item->id, 'quantity' => $allocated, 'unit' => $stock->unit, 'status' => 'reserved']);
                $stock->increment('reserved_quantity', $allocated);
                $needed -= $allocated;
                if ($needed <= .0001) {
                    break;
                }
            }
        }
    }

    public function confirmPrepared(MealPlanItem $item, int $userId, string $idempotencyKey): void
    {
        DB::transaction(function () use ($item, $userId, $idempotencyKey) {
            foreach ($item->reservations()->where('status', 'reserved')->lockForUpdate()->get() as $reservation) {
                $movementKey = $idempotencyKey.':'.$reservation->id;
                if (DB::table('pantry_movements')->where('idempotency_key', $movementKey)->exists()) {
                    continue;
                }
                $stock = PantryItem::lockForUpdate()->findOrFail($reservation->pantry_item_id);
                $stock->update(['quantity' => max(0, (float) $stock->quantity - (float) $reservation->quantity), 'reserved_quantity' => max(0, (float) $stock->reserved_quantity - (float) $reservation->quantity)]);
                DB::table('pantry_movements')->insert(['pantry_item_id' => $stock->id, 'meal_plan_item_id' => $item->id, 'created_by_user_id' => $userId, 'type' => 'deduction', 'quantity' => $reservation->quantity, 'unit' => $reservation->unit, 'idempotency_key' => $movementKey, 'created_at' => now(), 'updated_at' => now()]);
                $reservation->update(['status' => 'consumed', 'idempotency_key' => $movementKey, 'consumed_at' => now()]);
            }
            $item->update(['status' => 'prepared']);
        });
    }

    public function release(MealPlanItem $item): void
    {
        DB::transaction(function () use ($item) {
            foreach ($item->reservations()->where('status', 'reserved')->lockForUpdate()->get() as $reservation) {
                $stock = PantryItem::lockForUpdate()->find($reservation->pantry_item_id);
                $stock?->update(['reserved_quantity' => max(0, (float) $stock->reserved_quantity - (float) $reservation->quantity)]);
                $reservation->update(['status' => 'released']);
            }
        });
    }
}
