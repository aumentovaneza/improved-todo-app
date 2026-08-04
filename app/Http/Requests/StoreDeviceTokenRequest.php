<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeviceTokenRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Auth is enforced by the route's ['auth','verified'] middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'platform' => ['required', 'string', Rule::in(['ios', 'android', 'web'])],
            'provider' => ['required', 'string', Rule::in(['apns', 'fcm', 'webpush'])],
            'token' => ['required', 'string', 'max:512'],
            'meta' => ['nullable', 'array'],
        ];
    }
}
