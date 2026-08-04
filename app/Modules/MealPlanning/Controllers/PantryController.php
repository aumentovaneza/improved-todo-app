<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\PantryItem;
use App\Modules\MealPlanning\Requests\PantryItemRequest;
use App\Modules\MealPlanning\Resources\PantryItemResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PantryController extends Controller
{
    public function __construct(private HouseholdAccessService $access) {}

    public function index(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());

        return PantryItemResource::collection($household->pantryItems()->with('ingredient')->orderBy('expires_on')->get());
    }

    public function store(PantryItemRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $item = $household->pantryItems()->create($request->validated());
        $this->movement($item, $request->user()->id, 'addition', (float) $item->quantity, ['source' => 'pantry_api']);

        return PantryItemResource::make($item->load('ingredient'))->response()->setStatusCode(201);
    }

    public function update(PantryItemRequest $request, Household $household, PantryItem $pantryItem)
    {
        $this->guard($household, $pantryItem);
        $this->access->ensureMember($household, $request->user());
        $oldQuantity = (float) $pantryItem->quantity;
        $pantryItem->update($request->validated());
        if ($request->filled('quantity') && (float) $pantryItem->quantity !== $oldQuantity) {
            $this->movement($pantryItem, $request->user()->id, 'adjustment', (float) $pantryItem->quantity - $oldQuantity, ['from' => $oldQuantity, 'to' => (float) $pantryItem->quantity]);
        }

        return PantryItemResource::make($pantryItem->fresh('ingredient'));
    }

    public function destroy(Request $request, Household $household, PantryItem $pantryItem)
    {
        $this->guard($household, $pantryItem);
        $this->access->ensureMember($household, $request->user());
        abort_if($pantryItem->reservations()->where('status', 'reserved')->exists(), 409, 'Release active meal-plan reservations first.');
        $this->movement($pantryItem, $request->user()->id, 'adjustment', -((float) $pantryItem->quantity), ['reason' => 'pantry_item_removed']);
        $pantryItem->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function guard(Household $h, PantryItem $i): void
    {
        abort_unless($i->household_id === $h->id, 404);
    }

    private function movement(PantryItem $item, int $userId, string $type, float $quantity, array $metadata): void
    {
        DB::table('pantry_movements')->insert(['pantry_item_id' => $item->id, 'created_by_user_id' => $userId, 'type' => $type, 'quantity' => $quantity, 'unit' => $item->unit, 'idempotency_key' => (string) Str::uuid(), 'metadata' => json_encode($metadata), 'created_at' => now(), 'updated_at' => now()]);
    }
}
