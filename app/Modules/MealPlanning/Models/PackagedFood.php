<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackagedFood extends Model
{
    protected $fillable = ['barcode', 'brand', 'name', 'image_url', 'ingredients_text', 'allergens', 'markets', 'confidence'];

    protected function casts(): array
    {
        return ['allergens' => 'array', 'markets' => 'array'];
    }

    public function servings(): HasMany
    {
        return $this->hasMany(PackagedFoodServing::class);
    }

    public function nutrition(): HasMany
    {
        return $this->hasMany(PackagedFoodNutrition::class);
    }
}
