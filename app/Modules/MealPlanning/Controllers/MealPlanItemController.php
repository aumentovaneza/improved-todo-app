<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\MealPlanItem;
use App\Modules\MealPlanning\Models\RecipeVersion;
use App\Modules\MealPlanning\Requests\MealPlanItemRequest;
use App\Modules\MealPlanning\Resources\MealPlanResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\MealCalendarService;
use App\Modules\MealPlanning\Services\PantryAllocationService;
use App\Modules\MealPlanning\Services\RecipeNutritionCalculator;
use App\Modules\MealPlanning\Services\ShoppingListBuilder;
use Illuminate\Support\Facades\DB;

class MealPlanItemController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private PantryAllocationService $pantry, private ShoppingListBuilder $shopping, private MealCalendarService $calendar, private RecipeNutritionCalculator $nutrition) {}

    public function update(MealPlanItemRequest $request, Household $household, MealPlan $mealPlan, MealPlanItem $item)
    {
        $this->guard($household, $mealPlan, $item);
        $this->access->ensureMember($household, $request->user());
        if ($request->filled('recipe_version_id') && (int) $request->validated('recipe_version_id') !== $item->recipe_version_id) {
            abort_unless(in_array($item->status, ['planned', 'modified', 'replaced'], true), 409, "A {$item->status} meal cannot be replaced.");
            abort_unless(RecipeVersion::whereKey($request->integer('recipe_version_id'))->whereHas('recipe', fn ($query) => $query->where('is_active', true)->where(fn ($available) => $available->whereNull('household_id')->orWhere('household_id', $household->id)))->exists(), 404);
        }
        $nextStatus = $request->validated('status');
        if ($nextStatus && $nextStatus !== $item->status) {
            $allowed = [
                'planned' => ['prepared', 'eaten', 'modified', 'replaced', 'skipped', 'missed'],
                'prepared' => ['eaten', 'modified', 'replaced'],
                'modified' => ['prepared', 'eaten', 'replaced', 'skipped'],
                'replaced' => ['prepared', 'eaten', 'modified', 'skipped'],
                'missed' => ['planned'],
                'skipped' => ['planned'],
                'eaten' => [],
            ];
            abort_unless(in_array($nextStatus, $allowed[$item->status] ?? [], true), 409, "Cannot transition a meal from {$item->status} to {$nextStatus}.");
        }
        DB::transaction(function () use ($request, $item, $mealPlan) {
            $data = $request->safe()->except(['household_member_id', 'serving_multiplier', 'idempotency_key']);
            if (array_intersect(array_keys($data), ['scheduled_date', 'scheduled_time', 'status'])) {
                $data['manual_overrides'] = array_merge($item->manual_overrides ?? [], ['edited_at' => now()->toIso8601String(), 'fields' => array_values(array_intersect(array_keys($data), ['scheduled_date', 'scheduled_time', 'status']))]);
            }
            $recipeChanged = isset($data['recipe_version_id']) && (int) $data['recipe_version_id'] !== $item->recipe_version_id;
            if ($recipeChanged) {
                $this->pantry->release($item);
                $data['origin'] = 'replacement';
                $data['status'] = 'replaced';
            }
            if (($data['status'] ?? null) === 'skipped' && $item->status !== 'prepared') {
                $this->pantry->release($item);
            }
            $item->update($data);
            if ($recipeChanged) {
                $item->load('recipeVersion.latestNutrition');
                $base = $this->nutrition->perServing($item->recipeVersion);
                $item->update(['nutrition_snapshot' => $base]);
                foreach ($item->portions as $portion) {
                    $portion->update(['nutrition_snapshot' => $this->nutrition->scale($base, (float) $portion->serving_multiplier)]);
                } $this->pantry->reserve($item);
            }
            if ($request->filled('household_member_id') && $request->filled('serving_multiplier')) {
                $portion = $item->portions()->where('household_member_id', $request->integer('household_member_id'))->firstOrFail();
                $portion->update(['serving_multiplier' => $request->float('serving_multiplier'), 'nutrition_snapshot' => $this->nutrition->scale($item->nutrition_snapshot ?? [], $request->float('serving_multiplier')), 'is_manual' => true]);
            }
            if (($data['status'] ?? null) === 'prepared') {
                $this->pantry->confirmPrepared($item, $request->user()->id, (string) $request->validated('idempotency_key', 'prepared-'.$item->id));
            }
            $this->shopping->build($mealPlan->fresh());
            $this->calendar->syncPlan($mealPlan->fresh());
        });

        return MealPlanResource::make($mealPlan->fresh(['items.recipeVersion.recipe', 'items.portions.member', 'shoppingLists.items']));
    }

    private function guard(Household $h, MealPlan $p, MealPlanItem $i): void
    {
        abort_unless($p->household_id === $h->id && $i->meal_plan_id === $p->id, 404);
    }
}
