<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $fillable = ['slug', 'canonical_name', 'category', 'density_g_per_ml', 'allergens', 'dietary_tags'];

    protected function casts(): array
    {
        return ['allergens' => 'array', 'dietary_tags' => 'array', 'density_g_per_ml' => 'decimal:4'];
    }

    /** @return HasMany<IngredientAlias, $this> */
    public function aliases(): HasMany
    {
        return $this->hasMany(IngredientAlias::class);
    }

    /** @return HasMany<IngredientNutrition, $this> */
    public function nutritionRecords(): HasMany
    {
        return $this->hasMany(IngredientNutrition::class);
    }
}
