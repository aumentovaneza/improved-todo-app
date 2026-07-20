<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMonthTitleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'min:1970', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'title' => ['nullable', 'string', 'max:60'],
        ];
    }
}
