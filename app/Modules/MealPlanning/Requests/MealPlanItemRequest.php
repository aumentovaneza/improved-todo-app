<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MealPlanItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'recipe_version_id' => ['nullable', 'integer', Rule::exists('recipe_versions', 'id')], 'scheduled_date' => ['nullable', 'date'],
            'meal_slot' => ['nullable', Rule::in(['breakfast', 'lunch', 'dinner', 'snack'])], 'scheduled_time' => ['nullable', 'date_format:H:i'],
            'status' => ['nullable', Rule::in(['planned', 'prepared', 'eaten', 'modified', 'replaced', 'skipped', 'missed'])], 'is_locked' => ['nullable', 'boolean'],
            'household_member_id' => ['nullable', 'integer', Rule::exists('household_members', 'id')], 'serving_multiplier' => ['nullable', 'numeric', 'between:0.25,3'],
            'idempotency_key' => ['required_if:status,prepared', 'nullable', 'string', 'max:64'],
        ];
    }
}
