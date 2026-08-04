<?php

namespace App\Modules\MealPlanning\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\MealPlan */
class MealPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'household_id' => $this->household_id,
            'start_date' => $this->start_date ? Carbon::parse($this->start_date)->toDateString() : null,
            'number_of_days' => $this->number_of_days,
            'status' => $this->status,
            'priority_profile' => $this->priority_profile,
            'generation_seed' => $this->generation_seed,
            'calculation_version' => $this->calculation_version,
            'confidence' => $this->confidence,
            'source_versions' => $this->source_versions ?? [],
            'settings' => $this->settings ?? [],
            'warnings' => $this->warnings ?? [],
            'validation_results' => $this->validation_results ?? [],
            'failure_message' => $this->failure_message,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'date' => Carbon::parse($item->scheduled_date)->toDateString(),
                'meal_slot' => $item->meal_slot,
                'participant_group' => $item->participant_group,
                'scheduled_time' => $item->scheduled_time,
                'status' => $item->status,
                'is_locked' => $item->is_locked,
                'origin' => $item->origin,
                'recipe' => $item->recipeVersion?->recipe ? [
                    'id' => $item->recipeVersion->recipe->id,
                    'version_id' => $item->recipe_version_id,
                    'name' => $item->recipeVersion->recipe->name,
                    'image_url' => $item->recipeVersion->recipe->image_url,
                ] : null,
                'nutrition' => $item->nutrition_snapshot,
                'warnings' => $item->warnings ?? [],
                'score' => $item->score_breakdown,
                'portions' => $item->relationLoaded('portions') ? $item->portions->map(fn ($portion) => [
                    'id' => $portion->id,
                    'member' => $portion->member ? ['id' => $portion->member->id, 'name' => $portion->member->name] : null,
                    'serving_multiplier' => (float) $portion->serving_multiplier,
                    'nutrition' => $portion->nutrition_snapshot,
                    'is_manual' => $portion->is_manual,
                ])->all() : [],
            ])->all()),
            'shopping_lists' => $this->whenLoaded('shoppingLists'),
        ];
    }
}
