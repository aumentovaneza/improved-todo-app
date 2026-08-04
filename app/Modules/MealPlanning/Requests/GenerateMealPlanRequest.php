<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateMealPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['idempotency_key' => ['required', 'string', 'max:64'], 'date' => ['nullable', 'date'], 'meal_slot' => ['nullable', 'in:breakfast,lunch,dinner,snack'], 'reset_overrides' => ['nullable', 'boolean']];
    }
}
