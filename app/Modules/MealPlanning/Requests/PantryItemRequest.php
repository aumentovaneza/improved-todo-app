<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PantryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'ingredient_id' => [$this->isMethod('post') ? 'required' : 'sometimes', 'integer', Rule::exists('ingredients', 'id')],
            'quantity' => [$this->isMethod('post') ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'unit' => [$this->isMethod('post') ? 'required' : 'sometimes', Rule::in(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece'])],
            'package_quantity' => ['nullable', 'numeric', 'min:0'], 'package_unit' => ['nullable', 'string', 'max:16'],
            'expires_on' => ['nullable', 'date'], 'unit_cost' => ['nullable', 'numeric', 'min:0'], 'currency' => ['nullable', 'string', 'size:3'],
        ];
    }
}
