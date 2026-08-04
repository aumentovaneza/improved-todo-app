<?php

namespace App\Modules\MealPlanning\Requests;

use App\Modules\MealPlanning\Services\RecipeScorer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MealPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'start_date' => [$this->isMethod('post') ? 'required' : 'sometimes', 'date'],
            'number_of_days' => ['sometimes', 'integer', 'between:1,31'],
            'priority_profile' => ['sometimes', Rule::in(array_keys(RecipeScorer::PROFILES))],
            'settings' => ['nullable', 'array'], 'settings.meal_slots' => ['nullable', 'array'],
            'settings.meal_slots.*' => [Rule::in(['breakfast', 'lunch', 'dinner', 'snack'])],
            'settings.budget_total' => ['nullable', 'numeric', 'min:0'], 'settings.strict_budget_per_meal' => ['nullable', 'numeric', 'min:0'],
            'settings.preferred_preparation_minutes' => ['nullable', 'integer', 'min:1'], 'settings.strict_max_preparation_minutes' => ['nullable', 'integer', 'min:1'],
            'settings.equipment' => ['nullable', 'array'], 'settings.allow_specialty_ingredients' => ['nullable', 'boolean'], 'settings.enable_leftovers' => ['nullable', 'boolean'],
            'settings.strict_nutrition' => ['nullable', 'boolean'], 'settings.prohibited_ingredients' => ['nullable', 'array'], 'settings.prohibited_ingredients.*' => ['string', 'max:120'],
        ];
    }
}
