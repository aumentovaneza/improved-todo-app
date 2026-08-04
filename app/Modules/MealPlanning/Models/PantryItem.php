<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PantryItem extends Model
{
    use SoftDeletes;

    protected $fillable = ['household_id', 'ingredient_id', 'quantity', 'unit', 'reserved_quantity', 'package_quantity', 'package_unit', 'expires_on', 'unit_cost', 'currency'];

    protected function casts(): array
    {
        return ['expires_on' => 'date'];
    }

    /** @return BelongsTo<Household, $this> */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /** @return BelongsTo<Ingredient, $this> */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /** @return HasMany<PantryReservation, $this> */
    public function reservations(): HasMany
    {
        return $this->hasMany(PantryReservation::class);
    }
}
