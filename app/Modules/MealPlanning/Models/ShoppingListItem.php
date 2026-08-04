<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingListItem extends Model
{
    protected $fillable = ['shopping_list_id', 'ingredient_id', 'category', 'required_quantity', 'pantry_quantity', 'purchase_quantity', 'unit', 'estimated_cost', 'cost_confidence', 'is_checked'];

    protected function casts(): array
    {
        return ['is_checked' => 'boolean'];
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
