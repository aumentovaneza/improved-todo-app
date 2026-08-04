<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MealPrepTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['household_member_id' => ['required', Rule::exists('household_members', 'id')], 'title' => ['nullable', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:4000'], 'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])], 'remind_at' => ['nullable', 'date']];
    }
}
