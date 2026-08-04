<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class PackagedFoodNutrition extends Model
{
    protected $table = 'packaged_food_nutrition';

    protected $fillable = ['packaged_food_id', 'packaged_food_serving_id', 'nutrients', 'source', 'calculation_version', 'confidence', 'retrieved_at'];

    protected function casts(): array
    {
        return ['nutrients' => 'array', 'retrieved_at' => 'datetime'];
    }
}
