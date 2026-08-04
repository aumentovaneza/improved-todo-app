<?php

namespace App\Modules\MealPlanning\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\MealDiaryEntry */
class MealDiaryEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'household_id' => $this->household_id, 'member' => $this->whenLoaded('member'), 'meal_plan_item_id' => $this->meal_plan_item_id, 'finance_transaction_id' => $this->finance_transaction_id, 'consumed_at' => $this->consumed_at ? Carbon::parse($this->consumed_at)->toIso8601String() : null, 'meal_slot' => $this->meal_slot, 'status' => $this->status, 'planned_nutrition' => $this->planned_nutrition_snapshot, 'actual_nutrition' => $this->actual_nutrition_snapshot, 'notes' => $this->notes, 'hunger_before' => $this->hunger_before, 'fullness_after' => $this->fullness_after, 'mood' => $this->mood, 'energy_level' => $this->energy_level, 'items' => $this->whenLoaded('items'), 'deleted_at' => $this->deleted_at];
    }
}
