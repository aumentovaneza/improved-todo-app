<?php

namespace App\Modules\Points\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePomodoroSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['work', 'short_break', 'long_break', 'break'])],
            'duration_seconds' => ['required', 'integer', 'min:1'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['required', 'date', 'before_or_equal:now'],
            'client_request_id' => ['required', 'string', 'max:255'],
        ];
    }
}
