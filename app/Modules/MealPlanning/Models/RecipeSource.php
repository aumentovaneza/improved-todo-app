<?php

namespace App\Modules\MealPlanning\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeSource extends Model
{
    protected $fillable = ['recipe_id', 'provider', 'external_id', 'source_url', 'license', 'attribution', 'source_confidence', 'payload_checksum', 'import_status', 'imported_at', 'last_synchronized_at'];

    protected function casts(): array
    {
        return ['imported_at' => 'datetime', 'last_synchronized_at' => 'datetime'];
    }
}
