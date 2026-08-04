<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeNutritionSnapshot extends Model
{
    protected $fillable = ['recipe_version_id', 'nutrients', 'source', 'external_id', 'confidence', 'calculation_version', 'calculated_at'];

    protected function casts(): array
    {
        return ['nutrients' => 'array', 'calculated_at' => 'datetime'];
    }
}
