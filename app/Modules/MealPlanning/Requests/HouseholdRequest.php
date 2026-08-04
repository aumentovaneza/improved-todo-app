<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HouseholdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'max:120'],
            'country_code' => ['sometimes', 'string', 'size:2', Rule::exists('countries', 'code')],
            'region_id' => ['nullable', 'integer', Rule::exists('regions', 'id')],
            'timezone' => ['sometimes', 'timezone'], 'currency' => ['sometimes', 'string', 'size:3'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
