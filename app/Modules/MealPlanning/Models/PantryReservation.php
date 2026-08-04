<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class PantryReservation extends Model
{
    protected $fillable = ['pantry_item_id', 'meal_plan_item_id', 'quantity', 'unit', 'status', 'idempotency_key', 'consumed_at'];

    protected function casts(): array
    {
        return ['consumed_at' => 'datetime'];
    }
}
