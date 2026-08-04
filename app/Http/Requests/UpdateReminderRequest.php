<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReminderRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'remind_at' => ['required', 'date', 'after:now'],
            'type' => ['required', 'string', Rule::in(['email', 'notification', 'sms', 'both', 'push'])],
            'message' => ['nullable', 'string', 'max:500'],
        ];
    }
}
