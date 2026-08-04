<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolveDuplicateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(['merged', 'distinct'])]];
    }
}
