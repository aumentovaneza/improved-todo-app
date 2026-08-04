<?php

namespace App\Http\Requests;

use App\Models\CalendarEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use RRule\RRule as RecurrenceRule;

class UpdateCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', Rule::in(['series', 'occurrence'])],
            'occurrence_key' => ['nullable', 'required_if:scope,occurrence', 'string', 'max:80'],
            'event_calendar_id' => [
                'sometimes',
                'integer',
                Rule::exists('event_calendars', 'id')->where('user_id', $this->user()->id),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:500'],
            'kind' => ['sometimes', Rule::in(CalendarEvent::KINDS)],
            'is_all_day' => ['sometimes', 'boolean'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'timezone' => ['sometimes', 'timezone:all'],
            'color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-F]{6}$/i'],
            'recurrence_rule' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'reminder_offsets' => ['sometimes', 'nullable', 'array', 'max:5'],
            'reminder_offsets.*' => ['integer', 'between:0,40320', 'distinct'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if (! $this->filled('recurrence_rule')) {
                return;
            }

            try {
                $rule = preg_replace('/^RRULE:/i', '', trim($this->string('recurrence_rule')->toString()));
                new RecurrenceRule($rule);
            } catch (\Throwable) {
                $validator->errors()->add('recurrence_rule', 'Choose a valid repeat pattern.');
            }
        }];
    }
}
