<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeStep extends Model
{
    protected $fillable = ['recipe_version_id', 'position', 'instruction', 'duration_minutes'];
}
