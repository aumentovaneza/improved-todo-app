<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:4000'],
            'cuisine' => ['nullable', 'string', 'max:80'], 'category' => ['nullable', 'string', 'max:80'],
            'meal_types' => ['required', 'array', 'min:1'], 'meal_types.*' => ['in:breakfast,lunch,dinner,snack'],
            'servings' => ['required', 'integer', 'between:1,100'], 'preparation_minutes' => ['nullable', 'integer', 'min:0'],
            'cooking_minutes' => ['nullable', 'integer', 'min:0'], 'equipment' => ['nullable', 'array'], 'allergens' => ['nullable', 'array'],
            'dietary_tags' => ['nullable', 'array'], 'steps' => ['required', 'array', 'min:1'], 'steps.*' => ['string', 'max:4000'],
            'ingredients' => ['required', 'array', 'min:1'], 'ingredients.*.name' => ['required', 'string', 'max:150'],
            'ingredients.*.quantity' => ['nullable', 'numeric', 'min:0'], 'ingredients.*.unit' => ['nullable', 'string', 'max:32'],
            'nutrition' => ['nullable', 'array'], 'image_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
