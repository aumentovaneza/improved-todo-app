<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FoodLookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'provider' => ['nullable', Rule::in(['usda_fdc', 'edamam'])],
            'query' => [$this->routeIs('meal-planning.api.foods.search') ? 'required' : 'nullable', 'string', 'max:150'],
            'external_id' => [$this->routeIs('meal-planning.api.foods.import') ? 'required' : 'nullable', 'string', 'max:150'],
            'ingredient_id' => ['nullable', 'integer', Rule::exists('ingredients', 'id')],
            'limit' => ['nullable', 'integer', 'between:1,50'],
            'idempotency_key' => [$this->routeIs('meal-planning.api.foods.import') ? 'required' : 'nullable', 'string', 'max:64'],
        ];
    }
}
