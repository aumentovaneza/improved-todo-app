<?php

namespace App\Modules\MealPlanning\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Household extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'owner_user_id', 'region_id', 'country_code', 'name', 'timezone', 'currency',
        'meal_planning_enabled', 'settings',
    ];

    protected function casts(): array
    {
        return ['meal_planning_enabled' => 'boolean', 'settings' => 'encrypted:array'];
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /** @return HasMany<HouseholdMember, $this> */
    public function members(): HasMany
    {
        return $this->hasMany(HouseholdMember::class);
    }

    /** @return HasMany<MealPlan, $this> */
    public function mealPlans(): HasMany
    {
        return $this->hasMany(MealPlan::class);
    }

    /** @return HasMany<PantryItem, $this> */
    public function pantryItems(): HasMany
    {
        return $this->hasMany(PantryItem::class);
    }

    public function membershipFor(User $user): ?HouseholdMember
    {
        return $this->members()->where('user_id', $user->id)->first();
    }

    public function contains(User $user): bool
    {
        return $this->owner_user_id === $user->id || $this->members()->where('user_id', $user->id)->exists();
    }
}
