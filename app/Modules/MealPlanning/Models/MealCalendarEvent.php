<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealCalendarEvent extends Model
{
    protected $fillable = ['household_id', 'meal_plan_id', 'meal_plan_item_id', 'type', 'title', 'starts_at', 'ends_at', 'status', 'metadata'];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'metadata' => 'array'];
    }

    /** @return BelongsTo<Household, $this> */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /** @return BelongsTo<MealPlan, $this> */
    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class);
    }

    /** @return BelongsTo<MealPlanItem, $this> */
    public function mealPlanItem(): BelongsTo
    {
        return $this->belongsTo(MealPlanItem::class);
    }
}
