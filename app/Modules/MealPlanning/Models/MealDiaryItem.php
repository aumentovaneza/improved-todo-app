<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealDiaryItem extends Model
{
    protected $fillable = ['meal_diary_entry_id', 'recipe_version_id', 'ingredient_id', 'packaged_food_id', 'type', 'name', 'quantity', 'unit', 'serving_multiplier', 'nutrition_snapshot', 'nutrition_source', 'nutrition_confidence', 'calculation_version', 'manual_overrides'];

    protected function casts(): array
    {
        return ['nutrition_snapshot' => 'encrypted:array', 'manual_overrides' => 'encrypted:array'];
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /** @return BelongsTo<RecipeVersion, $this> */
    public function recipeVersion(): BelongsTo
    {
        return $this->belongsTo(RecipeVersion::class);
    }

    /** @return BelongsTo<PackagedFood, $this> */
    public function packagedFood(): BelongsTo
    {
        return $this->belongsTo(PackagedFood::class);
    }
}
