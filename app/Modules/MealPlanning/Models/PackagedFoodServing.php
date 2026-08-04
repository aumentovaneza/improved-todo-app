<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class PackagedFoodServing extends Model
{
    protected $fillable = ['packaged_food_id', 'quantity', 'unit', 'label', 'package_quantity', 'package_unit'];
}
