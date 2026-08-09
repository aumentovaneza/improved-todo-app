<?php

namespace App\Modules\Points\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipAvatarRequest extends FormRequest
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
            'store_item_id' => ['required', 'integer', 'exists:store_items,id'],
        ];
    }
}
