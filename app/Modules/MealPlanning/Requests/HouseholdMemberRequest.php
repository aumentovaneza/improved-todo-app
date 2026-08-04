<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HouseholdMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'name' => [$required, 'string', 'max:120'], 'role' => ['sometimes', Rule::in(['owner', 'admin', 'member'])],
            'classification' => [$required, Rule::in(['adult', 'child'])], 'sex_at_birth' => ['nullable', Rule::in(['female', 'male'])],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'], 'height_cm' => ['nullable', 'numeric', 'between:30,300'],
            'weight_kg' => ['nullable', 'numeric', 'between:1,500'], 'activity_level' => ['nullable', Rule::in(['sedentary', 'low_active', 'active', 'very_active'])],
            'nutrition_goal' => ['sometimes', Rule::in(['maintenance', 'gradual_loss', 'gradual_gain', 'custom'])],
            'calorie_counting_enabled' => ['sometimes', 'boolean'], 'nutrition_targets' => ['nullable', 'array'],
            'nutrition_targets.calories' => ['nullable', 'numeric', 'min:0'], 'target_source' => ['nullable', Rule::in(['derived', 'manual', 'professional'])],
            'professional_source' => ['nullable', 'string', 'max:255'], 'allergies' => ['nullable', 'array'], 'allergies.*' => ['string', 'max:80'],
            'dietary_restrictions' => ['nullable', 'array'], 'dietary_restrictions.*' => ['string', 'max:80'],
            'food_preferences' => ['nullable', 'array'], 'disliked_foods' => ['nullable', 'array'], 'participation_schedule' => ['nullable', 'array'],
        ];
    }
}
