<?php

namespace App\Modules\MealPlanning\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\Household */
class HouseholdResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'owner_user_id' => $this->owner_user_id, 'name' => $this->name, 'country_code' => $this->country_code, 'region_id' => $this->region_id, 'timezone' => $this->timezone, 'currency' => $this->currency, 'meal_planning_enabled' => $this->meal_planning_enabled, 'settings' => $this->settings ?? [], 'members' => HouseholdMemberResource::collection($this->whenLoaded('members')), 'created_at' => $this->created_at];
    }
}
