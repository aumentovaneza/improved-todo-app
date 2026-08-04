<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegionalPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['ingredient_id' => ['required', Rule::exists('ingredients', 'id')], 'quantity' => ['required', 'numeric', 'gt:0'], 'unit' => ['required', Rule::in(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece'])], 'price' => ['required', 'numeric', 'min:0'], 'effective_on' => ['required', 'date'], 'exchange_rate' => ['nullable', 'numeric', 'gt:0']];
    }
}
