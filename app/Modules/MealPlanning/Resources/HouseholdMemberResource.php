<?php

namespace App\Modules\MealPlanning\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\HouseholdMember */
class HouseholdMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'household_id' => $this->household_id, 'user_id' => $this->user_id, 'name' => $this->name, 'role' => $this->role, 'classification' => $this->classification, 'sex_at_birth' => $this->sex_at_birth, 'birth_date' => $this->birth_date ? Carbon::parse($this->birth_date)->toDateString() : null, 'height_cm' => $this->height_cm, 'weight_kg' => $this->weight_kg, 'activity_level' => $this->activity_level, 'nutrition_goal' => $this->nutrition_goal, 'calorie_counting_enabled' => $this->calorie_counting_enabled, 'nutrition_targets' => $this->nutrition_targets, 'target_source' => $this->target_source, 'professional_source' => $this->professional_source, 'allergies' => $this->allergies ?? [], 'dietary_restrictions' => $this->dietary_restrictions ?? [], 'food_preferences' => $this->food_preferences ?? [], 'disliked_foods' => $this->disliked_foods ?? [], 'participation_schedule' => $this->participation_schedule ?? []];
    }
}
