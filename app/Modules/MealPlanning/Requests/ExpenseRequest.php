<?php

namespace App\Modules\MealPlanning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount' => [$this->routeIs('meal-planning.api.expenses.store') ? 'required' : 'sometimes', 'numeric', 'min:0.01'],
            'currency' => [$this->routeIs('meal-planning.api.expenses.store') ? 'required' : 'sometimes', 'string', 'size:3'],
            'meal_plan_id' => ['nullable', 'integer'], 'shopping_list_id' => ['nullable', 'integer'], 'diary_entry_id' => ['nullable', 'integer'], 'idempotency_key' => ['required', 'string', 'max:64'],
            'wallet_user_id' => ['nullable', 'integer'], 'finance_category_id' => ['nullable', 'integer'], 'finance_account_id' => ['nullable', 'integer'],
            'description' => ['nullable', 'string', 'max:255'], 'notes' => ['nullable', 'string', 'max:2000'], 'payment_method' => ['nullable', 'string', 'max:100'], 'occurred_at' => ['nullable', 'date'],
        ];
    }
}
