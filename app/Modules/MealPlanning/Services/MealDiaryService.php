<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\MealPlanItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MealDiaryService
{
    public function __construct(private MealCalendarService $calendar, private PantryAllocationService $pantry, private NutritionTargetCalculator $targets) {}

    public function create(array $data, int $userId): MealDiaryEntry
    {
        return DB::transaction(function () use ($data, $userId) {
            $items = $data['items'] ?? [];
            unset($data['items']);
            $data['created_by_user_id'] = $userId;
            $data['updated_by_user_id'] = $userId;
            $entry = MealDiaryEntry::create($data);
            foreach ($items as $item) {
                $entry->items()->create($item);
            }
            $this->refreshSnapshot($entry);
            $this->syncPlanState($entry);

            return $entry->fresh(['member', 'items', 'mealPlanItem']);
        });
    }

    public function markAsPlanned(MealPlanItem $item, HouseholdMember $member, int $userId, ?Carbon $consumedAt = null): MealDiaryEntry
    {
        $portion = $item->portions()->where('household_member_id', $member->id)->firstOrFail();

        $payload = [
            'household_id' => $item->mealPlan->household_id,
            'household_member_id' => $member->id,
            'meal_plan_item_id' => $item->id,
            'consumed_at' => $consumedAt ?? now(),
            'meal_slot' => $item->meal_slot,
            'status' => 'eaten_as_planned',
            'planned_nutrition_snapshot' => $portion->nutrition_snapshot,
            'items' => [[
                'recipe_version_id' => $item->recipe_version_id,
                'type' => 'recipe',
                'name' => $item->recipeVersion?->recipe?->name ?? 'Planned meal',
                'serving_multiplier' => $portion->serving_multiplier,
                'nutrition_snapshot' => $portion->nutrition_snapshot ?? [],
                'nutrition_source' => 'meal_plan_snapshot',
                'nutrition_confidence' => 'high',
                'calculation_version' => $item->mealPlan->calculation_version,
            ]],
        ];

        $existing = MealDiaryEntry::where('meal_plan_item_id', $item->id)->where('household_member_id', $member->id)->first();

        return $existing ? $this->update($existing, $payload, $userId) : $this->create($payload, $userId);
    }

    public function update(MealDiaryEntry $entry, array $data, int $userId): MealDiaryEntry
    {
        return DB::transaction(function () use ($entry, $data, $userId) {
            $items = $data['items'] ?? null;
            unset($data['items']);
            $entry->update([...$data, 'updated_by_user_id' => $userId]);
            if ($items !== null) {
                $entry->items()->delete();
                foreach ($items as $item) {
                    $entry->items()->create($item);
                }
                $this->refreshSnapshot($entry->fresh('items'));
            }
            $this->syncPlanState($entry);

            return $entry->fresh(['member', 'items', 'mealPlanItem']);
        });
    }

    public function summary(HouseholdMember $member, Carbon $start, Carbon $end): array
    {
        $entries = $member->diaryEntries()->withTrashed(false)->with('items.ingredient')->whereBetween('consumed_at', [$start, $end])->get();
        $totals = ['calories' => 0, 'protein' => 0, 'carbohydrates' => 0, 'fat' => 0, 'fiber' => 0, 'sugar' => 0, 'sodium' => 0];
        $planned = $totals;
        foreach ($entries as $entry) {
            foreach ($planned as $key => $_) {
                $planned[$key] += (float) ($entry->planned_nutrition_snapshot[$key] ?? 0);
            }
            if ($entry->status === 'skipped') {
                continue;
            }
            foreach ($entry->items as $item) {
                foreach ($totals as $key => $_) {
                    $totals[$key] += (float) ($item->nutrition_snapshot[$key] ?? 0);
                }
            }
        }

        $base = ['member_id' => $member->id, 'from' => $start->toDateString(), 'to' => $end->toDateString(), 'totals' => array_map(fn ($v) => round($v, 2), $totals), 'meals_logged' => $entries->where('status', '!=', 'skipped')->count(), 'meals_skipped' => $entries->where('status', 'skipped')->count(), 'child_safe' => $member->isChild()];
        if ($member->isChild()) {
            $items = $entries->where('status', '!=', 'skipped')->flatMap->items;
            $produceServings = $items->filter(fn ($item) => $item->ingredient?->category === 'produce')->sum('serving_multiplier');

            return [...$base, 'participation' => ['meals_logged' => $base['meals_logged']], 'variety' => ['unique_foods' => $items->pluck('name')->map(fn ($name) => mb_strtolower($name))->unique()->count()], 'food_groups' => $items->pluck('ingredient.category')->filter()->unique()->values(), 'fruit_and_vegetable_servings' => round((float) $produceServings, 2)];
        }
        $days = max(1, $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1);
        $targetResult = $this->targets->calculate($member);
        $targetCalories = isset($targetResult['targets']['calories']) ? (float) $targetResult['targets']['calories'] * $days : null;

        return [...$base, 'planned' => array_map(fn ($value) => round($value, 2), $planned), 'target' => $targetResult, 'target_variance' => $targetCalories === null ? null : round($totals['calories'] - $targetCalories, 2)];
    }

    private function refreshSnapshot(MealDiaryEntry $entry): void
    {
        $totals = ['calories' => 0, 'protein' => 0, 'carbohydrates' => 0, 'fat' => 0, 'fiber' => 0, 'sugar' => 0, 'sodium' => 0];
        foreach ($entry->items as $item) {
            foreach ($totals as $key => $_) {
                $totals[$key] += (float) ($item->nutrition_snapshot[$key] ?? 0);
            }
        }
        $entry->update(['actual_nutrition_snapshot' => $totals]);
    }

    private function syncPlanState(MealDiaryEntry $entry): void
    {
        if (! $entry->meal_plan_item_id) {
            return;
        }
        $status = match ($entry->status) {
            'eaten_as_planned' => 'eaten', 'modified' => 'modified', 'replaced' => 'replaced', 'skipped' => 'skipped', default => 'planned'
        };
        $item = MealPlanItem::find($entry->meal_plan_item_id);
        if (! $item) {
            return;
        }
        $wasPrepared = $item->status === 'prepared';
        $item->update(['status' => $status]);
        $this->calendar->updateState($item->id, $status);
        if ($status === 'skipped' && ! $wasPrepared) {
            $this->pantry->release($item);
        }
    }
}
