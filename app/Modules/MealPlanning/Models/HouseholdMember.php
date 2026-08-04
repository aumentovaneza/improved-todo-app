<?php

namespace App\Modules\MealPlanning\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HouseholdMember extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'household_id', 'user_id', 'name', 'role', 'classification', 'sex_at_birth',
        'birth_date', 'height_cm', 'weight_kg', 'activity_level', 'nutrition_goal',
        'calorie_counting_enabled', 'nutrition_targets', 'target_source', 'professional_source',
        'allergies', 'dietary_restrictions', 'food_preferences', 'disliked_foods',
        'participation_schedule',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date', 'calorie_counting_enabled' => 'boolean',
            'nutrition_targets' => 'encrypted:array', 'allergies' => 'encrypted:array',
            'dietary_restrictions' => 'encrypted:array', 'food_preferences' => 'encrypted:array',
            'disliked_foods' => 'encrypted:array', 'participation_schedule' => 'encrypted:array',
            'professional_source' => 'encrypted',
            'height_cm' => 'decimal:2', 'weight_kg' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Household, $this> */
    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<MealDiaryEntry, $this> */
    public function diaryEntries(): HasMany
    {
        return $this->hasMany(MealDiaryEntry::class);
    }

    /** @return HasMany<MealPlanPortion, $this> */
    public function portions(): HasMany
    {
        return $this->hasMany(MealPlanPortion::class);
    }

    public function isChild(): bool
    {
        return $this->classification === 'child';
    }

    public function canAdminister(): bool
    {
        return in_array($this->role, ['owner', 'admin'], true);
    }
}
