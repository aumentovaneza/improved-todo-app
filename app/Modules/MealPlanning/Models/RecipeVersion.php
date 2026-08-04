<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RecipeVersion extends Model
{
    protected $fillable = ['recipe_id', 'version', 'servings', 'preparation_minutes', 'cooking_minutes', 'equipment', 'allergens', 'dietary_tags', 'storage_guidance', 'child_modifications', 'variations', 'cost_confidence', 'leftover_suitable', 'leftover_days', 'content_checksum', 'created_by_user_id'];

    protected function casts(): array
    {
        return ['equipment' => 'array', 'allergens' => 'array', 'dietary_tags' => 'array', 'storage_guidance' => 'array', 'child_modifications' => 'array', 'variations' => 'array', 'leftover_suitable' => 'boolean'];
    }

    /** @return BelongsTo<Recipe, $this> */
    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    /** @return HasMany<RecipeIngredient, $this> */
    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    /** @return HasMany<RecipeStep, $this> */
    public function steps(): HasMany
    {
        return $this->hasMany(RecipeStep::class)->orderBy('position');
    }

    /** @return HasMany<RecipeNutritionSnapshot, $this> */
    public function nutritionSnapshots(): HasMany
    {
        return $this->hasMany(RecipeNutritionSnapshot::class);
    }

    /** @return HasOne<RecipeNutritionSnapshot, $this> */
    public function latestNutrition(): HasOne
    {
        return $this->hasOne(RecipeNutritionSnapshot::class)->latestOfMany();
    }
}
