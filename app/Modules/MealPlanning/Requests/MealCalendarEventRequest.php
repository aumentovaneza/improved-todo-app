<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MealCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['starts_at' => ['required', 'date'], 'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at']];
    }
}
