<?php

namespace App\Http\Requests;

use App\Models\CalendarEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use RRule\RRule as RecurrenceRule;

class StoreCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'event_calendar_id' => [
                'nullable',
                'integer',
                Rule::exists('event_calendars', 'id')->where('user_id', $this->user()->id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:500'],
            'kind' => ['required', Rule::in(CalendarEvent::KINDS)],
            'is_all_day' => ['required', 'boolean'],
            'start_date' => ['nullable', 'required_if:is_all_day,true', 'date'],
            'end_date' => ['nullable', 'required_if:is_all_day,true', 'date', 'after_or_equal:start_date'],
            'starts_at' => ['nullable', 'required_if:is_all_day,false', 'date'],
            'ends_at' => ['nullable', 'required_if:is_all_day,false', 'date', 'after:starts_at'],
            'timezone' => ['required', 'timezone:all'],
            'color' => ['nullable', 'regex:/^#[0-9A-F]{6}$/i'],
            'recurrence_rule' => ['nullable', 'string', 'max:1000'],
            'reminder_offsets' => ['nullable', 'array', 'max:5'],
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
