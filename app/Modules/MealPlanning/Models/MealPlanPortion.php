<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealPlanPortion extends Model
{
    protected $fillable = ['meal_plan_item_id', 'household_member_id', 'serving_multiplier', 'nutrition_snapshot', 'modifications', 'is_manual'];

    protected function casts(): array
    {
        return ['nutrition_snapshot' => 'array', 'modifications' => 'array', 'is_manual' => 'boolean'];
    }

    /** @return BelongsTo<HouseholdMember, $this> */
    public function member(): BelongsTo
    {
        return $this->belongsTo(HouseholdMember::class, 'household_member_id');
    }
}
