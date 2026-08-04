<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkMealAsPlannedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['household_member_id' => ['required', Rule::exists('household_members', 'id')], 'consumed_at' => ['nullable', 'date']];
    }
}
