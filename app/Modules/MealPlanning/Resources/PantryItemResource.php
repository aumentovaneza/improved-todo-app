<?php

namespace App\Modules\MealPlanning\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\PantryItem */
class PantryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'household_id' => $this->household_id, 'ingredient' => $this->whenLoaded('ingredient'), 'quantity' => (float) $this->quantity, 'reserved_quantity' => (float) $this->reserved_quantity, 'available_quantity' => max(0, (float) $this->quantity - (float) $this->reserved_quantity), 'unit' => $this->unit, 'package_quantity' => $this->package_quantity, 'package_unit' => $this->package_unit, 'expires_on' => $this->expires_on ? Carbon::parse($this->expires_on)->toDateString() : null, 'unit_cost' => $this->unit_cost, 'currency' => $this->currency];
    }
}
