<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientNutrition extends Model
{
    protected $table = 'ingredient_nutrition';

    protected $fillable = ['ingredient_id', 'basis_quantity', 'basis_unit', 'nutrients', 'provider', 'external_id', 'confidence', 'calculation_version', 'retrieved_at'];

    protected function casts(): array
    {
        return ['nutrients' => 'array', 'retrieved_at' => 'datetime'];
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
