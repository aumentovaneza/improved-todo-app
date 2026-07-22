<?php

namespace App\Http\Requests;

use App\Support\DashboardWidgets;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateDashboardLayoutRequest extends FormRequest
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
            'widgets' => ['required', 'array', 'min:1'],
            'widgets.*.key' => ['required', 'string', Rule::in(DashboardWidgets::keys())],
            'widgets.*.size' => ['required', 'string', Rule::in(['sm', 'md', 'lg'])],
            'widgets.*.enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * Additional cross-field validation: the chosen size must be within the
     * widget's own allowed sizes (which vary per widget).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ((array) $this->input('widgets', []) as $index => $widget) {
                $key = $widget['key'] ?? null;
                $size = $widget['size'] ?? null;

                if (! is_string($key)) {
                    continue;
                }

                $allowed = DashboardWidgets::allowedSizesFor($key);

                if ($allowed !== [] && ! in_array($size, $allowed, true)) {
                    $validator->errors()->add(
                        "widgets.{$index}.size",
                        "The selected size is not allowed for the {$key} widget."
                    );
                }
            }
        });
    }

    /**
     * Normalize the enabled flag so string/int booleans validate cleanly.
     */
    protected function prepareForValidation(): void
    {
        $widgets = $this->input('widgets');

        if (! is_array($widgets)) {
            return;
        }

        $this->merge([
            'widgets' => array_map(function ($widget) {
                if (is_array($widget) && array_key_exists('enabled', $widget)) {
                    $widget['enabled'] = filter_var(
                        $widget['enabled'],
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    ) ?? $widget['enabled'];
                }

                return $widget;
            }, $widgets),
        ]);
    }
}
