<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use SoftDeletes;

    protected $fillable = ['household_id', 'scope', 'name', 'normalized_name', 'description', 'cuisine', 'category', 'meal_types', 'image_url', 'is_active', 'needs_review'];

    protected function casts(): array
    {
        return ['meal_types' => 'array', 'is_active' => 'boolean', 'needs_review' => 'boolean'];
    }

    /** @return BelongsTo<Household, $this> */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /** @return HasMany<RecipeVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(RecipeVersion::class);
    }

    /** @return HasMany<RecipeSource, $this> */
    public function sources(): HasMany
    {
        return $this->hasMany(RecipeSource::class);
    }

    /** @return HasOne<RecipeVersion, $this> */
    public function latestVersion(): HasOne
    {
        return $this->hasOne(RecipeVersion::class)->latestOfMany('version');
    }

    /** @param Builder<Recipe> $query
     * @return Builder<Recipe>
     */
    public function scopeAvailableTo(Builder $query, ?int $householdId): Builder
    {
        return $query->where('is_active', true)->where(fn (Builder $q) => $q->whereNull('household_id')->orWhere('household_id', $householdId));
    }
}
