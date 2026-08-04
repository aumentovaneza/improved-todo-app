<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class MealProviderRequest extends Model
{
    protected $fillable = ['provider', 'operation', 'status_code', 'duration_ms', 'quota_cost', 'successful', 'error'];

    protected function casts(): array
    {
        return ['successful' => 'boolean'];
    }
}
