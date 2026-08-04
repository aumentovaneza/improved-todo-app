<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MealPlanItem extends Model
{
    protected $fillable = ['meal_plan_id', 'recipe_version_id', 'batch_source_item_id', 'scheduled_date', 'meal_slot', 'participant_group', 'scheduled_time', 'status', 'is_locked', 'origin', 'score_breakdown', 'nutrition_snapshot', 'manual_overrides', 'warnings'];

    protected function casts(): array
    {
        return ['scheduled_date' => 'date', 'is_locked' => 'boolean', 'score_breakdown' => 'array', 'nutrition_snapshot' => 'array', 'manual_overrides' => 'array', 'warnings' => 'array'];
    }

    /** @return BelongsTo<MealPlan, $this> */
    public function mealPlan(): BelongsTo
    {
        return $this->belongsTo(MealPlan::class);
    }

    /** @return BelongsTo<RecipeVersion, $this> */
    public function recipeVersion(): BelongsTo
    {
        return $this->belongsTo(RecipeVersion::class);
    }

    /** @return HasMany<MealPlanPortion, $this> */
    public function portions(): HasMany
    {
        return $this->hasMany(MealPlanPortion::class);
    }

    /** @return HasMany<PantryReservation, $this> */
    public function reservations(): HasMany
    {
        return $this->hasMany(PantryReservation::class);
    }
}
