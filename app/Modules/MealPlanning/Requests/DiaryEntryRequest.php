<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DiaryEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'household_member_id' => [$required, 'integer', Rule::exists('household_members', 'id')], 'meal_plan_item_id' => ['nullable', 'integer', Rule::exists('meal_plan_items', 'id')],
            'consumed_at' => [$required, 'date'], 'meal_slot' => [$required, Rule::in(['breakfast', 'lunch', 'dinner', 'snack'])],
            'status' => [$required, Rule::in(['planned', 'eaten_as_planned', 'modified', 'replaced', 'skipped'])],
            'planned_nutrition_snapshot' => ['nullable', 'array'], 'notes' => ['nullable', 'string', 'max:4000'],
            'hunger_before' => ['nullable', 'integer', 'between:1,10'], 'fullness_after' => ['nullable', 'integer', 'between:1,10'],
            'mood' => ['nullable', 'string', 'max:50'], 'energy_level' => ['nullable', 'integer', 'between:1,10'],
            'items' => [$this->isMethod('post') ? 'required_unless:status,skipped' : 'sometimes', 'array'], 'items.*.type' => ['required', Rule::in(['recipe', 'food', 'packaged_food', 'restaurant', 'takeaway', 'drink', 'snack', 'leftover', 'manual'])],
            'items.*.name' => ['required', 'string', 'max:255'], 'items.*.recipe_version_id' => ['nullable', 'integer'], 'items.*.ingredient_id' => ['nullable', 'integer'],
            'items.*.packaged_food_id' => ['nullable', 'integer'], 'items.*.quantity' => ['nullable', 'numeric', 'min:0'], 'items.*.unit' => ['nullable', 'string', 'max:16'],
            'items.*.serving_multiplier' => ['nullable', 'numeric', 'between:0.01,20'], 'items.*.nutrition_snapshot' => ['required', 'array'],
            'items.*.nutrition_source' => ['required', 'string', 'max:80'], 'items.*.nutrition_confidence' => ['required', Rule::in(['low', 'medium', 'high', 'verified'])],
            'items.*.calculation_version' => ['required', 'string', 'max:80'], 'items.*.manual_overrides' => ['nullable', 'array'],
        ];
    }
}
