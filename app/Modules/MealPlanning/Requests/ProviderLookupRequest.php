<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProviderLookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'provider' => ['sometimes', Rule::in(['internal', 'themealdb', 'spoonacular'])],
            'query' => ['nullable', 'string', 'max:150'], 'external_id' => ['nullable', 'string', 'max:150'],
            'barcode' => ['nullable', 'string', 'max:32'], 'meal_type' => ['nullable', Rule::in(['breakfast', 'lunch', 'dinner', 'snack'])],
            'limit' => ['nullable', 'integer', 'between:1,50'], 'idempotency_key' => [$this->routeIs('meal-planning.api.recipes.import', 'meal-planning.api.packaged-foods.lookup') ? 'required' : 'nullable', 'string', 'max:64'],
        ];
    }
}
