<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MealDiaryEntry extends Model
{
    use SoftDeletes;

    protected $fillable = ['household_id', 'household_member_id', 'meal_plan_item_id', 'finance_transaction_id', 'created_by_user_id', 'updated_by_user_id', 'consumed_at', 'meal_slot', 'status', 'planned_nutrition_snapshot', 'actual_nutrition_snapshot', 'notes', 'hunger_before', 'fullness_after', 'mood', 'energy_level'];

    protected function casts(): array
    {
        return ['consumed_at' => 'datetime', 'planned_nutrition_snapshot' => 'encrypted:array', 'actual_nutrition_snapshot' => 'encrypted:array', 'notes' => 'encrypted'];
    }

    /** @return BelongsTo<HouseholdMember, $this> */
    public function member(): BelongsTo
    {
        return $this->belongsTo(HouseholdMember::class, 'household_member_id');
    }

    /** @return BelongsTo<MealPlanItem, $this> */
    public function mealPlanItem(): BelongsTo
    {
        return $this->belongsTo(MealPlanItem::class);
    }

    /** @return HasMany<MealDiaryItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(MealDiaryItem::class);
    }
}
