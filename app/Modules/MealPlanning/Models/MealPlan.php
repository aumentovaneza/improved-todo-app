<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MealPlan extends Model
{
    use SoftDeletes;

    protected $fillable = ['household_id', 'created_by_user_id', 'start_date', 'number_of_days', 'status', 'priority_profile', 'generation_seed', 'calculation_version', 'confidence', 'source_versions', 'settings', 'warnings', 'validation_results', 'failure_message'];

    protected function casts(): array
    {
        return ['start_date' => 'date', 'source_versions' => 'array', 'settings' => 'array', 'warnings' => 'array', 'validation_results' => 'array'];
    }

    /** @return BelongsTo<Household, $this> */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /** @return HasMany<MealPlanItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(MealPlanItem::class)->orderBy('scheduled_date')->orderBy('meal_slot');
    }

    /** @return HasMany<ShoppingList, $this> */
    public function shoppingLists(): HasMany
    {
        return $this->hasMany(ShoppingList::class);
    }
}
