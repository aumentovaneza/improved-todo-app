<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class PlannedFoodExpense extends Model
{
    protected $fillable = ['household_id', 'meal_plan_id', 'shopping_list_id', 'diary_entry_id', 'created_by_user_id', 'wallet_user_id', 'finance_transaction_id', 'amount', 'currency', 'status', 'idempotency_key', 'confirmed_at'];

    protected function casts(): array
    {
        return ['confirmed_at' => 'datetime'];
    }
}
