<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\MealPlanItem;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MealPlanGenerator
{
    private const SLOT_RATIOS = ['breakfast' => .25, 'lunch' => .30, 'dinner' => .35, 'snack' => .10];

    public function __construct(
        private NutritionTargetCalculator $targets,
        private RecipeCandidateFinder $candidates,
        private RecipeNutritionCalculator $nutrition,
        private PantryAllocationService $pantry,
        private ShoppingListBuilder $shopping,
        private MealCalendarService $calendar,
    ) {}

    public function generate(MealPlan $plan, array $scope = []): MealPlan
    {
        $plan->loadMissing('household.members');
        $planStart = Carbon::parse($plan->start_date);
        $seed = $plan->generation_seed ?: hash('sha256', $plan->household_id.':'.$planStart->format('Y-m-d').':'.$plan->created_at?->timestamp);
        $settings = array_merge(['meal_slots' => array_keys(self::SLOT_RATIOS)], $plan->settings ?? []);

        return DB::transaction(function () use ($plan, $scope, $seed, $settings, $planStart) {
            $plan->update(['status' => 'generating', 'generation_seed' => $seed, 'failure_message' => null]);
            $this->removeRegenerableItems($plan, $scope);
            $existing = $plan->items()->get()->keyBy(fn ($item) => Carbon::parse($item->scheduled_date)->format('Y-m-d').':'.$item->meal_slot);
            $warnings = [];
            $leftoverSources = [];
            $recentRecipeIds = $existing->pluck('recipeVersion.recipe_id')->filter()->all();
            $recentIngredientIds = $existing->flatMap(fn ($item) => $item->recipeVersion?->ingredients?->pluck('ingredient_id') ?? [])->filter()->unique()->all();

            for ($offset = 0; $offset < $plan->number_of_days; $offset++) {
                $date = $planStart->copy()->addDays($offset);
                if (isset($scope['date']) && $date->format('Y-m-d') !== $scope['date']) {
                    continue;
                }
                foreach ($settings['meal_slots'] as $slot) {
                    if (isset($scope['meal_slot']) && $slot !== $scope['meal_slot']) {
                        continue;
                    }
                    $key = $date->format('Y-m-d').':'.$slot;
                    if ($existing->has($key)) {
                        continue;
                    }
                    $participants = $this->participants($plan->household->members, $date, $slot);
                    if ($participants->isEmpty()) {
                        continue;
                    }
                    $memberTargets = $participants->mapWithKeys(fn (HouseholdMember $member) => [$member->id => $this->targets->calculate($member)]);
                    foreach ($memberTargets as $result) {
                        $warnings = array_merge($warnings, $result['warnings']);
                    }
                    $knownCalories = $memberTargets->pluck('targets.calories')->filter(fn ($value) => $value !== null);
                    $targetCalories = $knownCalories->isEmpty() ? null : $knownCalories->avg() * self::SLOT_RATIOS[$slot];
                    $ranked = $this->candidates->ranked($plan->household, $participants, $slot, ['settings' => $settings, 'priority_profile' => $plan->priority_profile, 'seed' => $seed.':'.$key, 'target_calories_per_serving' => $targetCalories, 'recent_recipe_ids' => $recentRecipeIds, 'recent_ingredient_ids' => $recentIngredientIds]);
                    $batchSource = null;
                    $leftoverChoice = null;
                    if (($settings['enable_leftovers'] ?? false) && isset($leftoverSources[$slot])) {
                        $candidateSource = $leftoverSources[$slot];
                        $leftoverChoice = $ranked->first(fn ($candidate) => $candidate['version']->id === $candidateSource->recipe_version_id);
                        if ($leftoverChoice) {
                            $batchSource = $candidateSource;
                        }
                    }
                    $choice = $batchSource ? $leftoverChoice : $ranked->first();
                    if (! $choice) {
                        $createdSeparate = false;
                        foreach ($participants as $member) {
                            $memberDaily = $memberTargets[$member->id]['targets']['calories'] ?? null;
                            $memberRanked = $this->candidates->ranked($plan->household, collect([$member]), $slot, ['settings' => $settings, 'priority_profile' => $plan->priority_profile, 'seed' => $seed.':'.$key.':'.$member->id, 'target_calories_per_serving' => $memberDaily ? $memberDaily * self::SLOT_RATIOS[$slot] : null, 'recent_recipe_ids' => $recentRecipeIds, 'recent_ingredient_ids' => $recentIngredientIds]);
                            $memberChoice = $memberRanked->first();
                            if (! $memberChoice) {
                                $warnings[] = "No safe {$slot} recipe found for {$member->name} on {$date->format('Y-m-d')}.";

                                continue;
                            }
                            $this->createItem($plan, $date, $slot, $memberChoice, collect([$member]), collect([$member->id => $memberTargets[$member->id]]), 'member-'.$member->id);
                            $createdSeparate = true;
                        }
                        if ($createdSeparate) {
                            $warnings[] = "Separate safe recipes were assigned for {$key}; no shared recipe met every hard constraint.";
                        }

                        continue;
                    }
                    $version = $choice['version'];
                    $createdItem = $this->createItem($plan, $date, $slot, $choice, $participants, $memberTargets, 'shared', $batchSource);
                    if ($batchSource) {
                        $this->expandBatchReservation($batchSource, $createdItem);
                        unset($leftoverSources[$slot]);
                    } elseif ($version->leftover_suitable) {
                        $leftoverSources[$slot] = $createdItem;
                    }
                    $recentRecipeIds[] = $version->recipe_id;
                    $recentIngredientIds = array_values(array_unique(array_merge($recentIngredientIds, $version->ingredients->pluck('ingredient_id')->filter()->all())));
                }
            }
            $plan->refresh()->load('items.recipeVersion.recipe', 'items.portions');
            $shopping = $this->shopping->build($plan);
            $this->calendar->syncPlan($plan);
            $warnings = array_values(array_unique($warnings));
            $validation = ['complete_slots' => $plan->items->count(), 'budget_status' => $shopping->budget_status, 'unknown_prices' => $shopping->unknown_price_count, 'nutrition_version' => NutritionTargetCalculator::VERSION];
            $confidence = $warnings ? 'low' : ($shopping->unknown_price_count ? 'medium' : 'high');
            $plan->update(['status' => $warnings ? 'needs_review' : 'ready', 'confidence' => $confidence, 'source_versions' => ['nutrition' => NutritionTargetCalculator::VERSION, 'recipe_calculation' => RecipeNutritionCalculator::VERSION, 'scoring' => 'deterministic-v1'], 'warnings' => $warnings, 'validation_results' => $validation]);

            return $plan->fresh(['household.members', 'items.recipeVersion.recipe', 'items.portions.member', 'shoppingLists.items']);
        });
    }

    private function createItem(MealPlan $plan, Carbon $date, string $slot, array $choice, Collection $participants, Collection $memberTargets, string $participantGroup = 'shared', ?MealPlanItem $batchSource = null): MealPlanItem
    {
        $version = $choice['version'];
        $baseNutrition = $this->nutrition->perServing($version);
        $item = $plan->items()->create(['recipe_version_id' => $version->id, 'batch_source_item_id' => $batchSource?->id, 'scheduled_date' => $date, 'meal_slot' => $slot, 'participant_group' => $participantGroup, 'status' => 'planned', 'origin' => $batchSource ? 'leftover' : 'generated', 'score_breakdown' => ['total' => $choice['score'], ...$choice['components']], 'nutrition_snapshot' => $baseNutrition, 'warnings' => $choice['warnings']]);
        foreach ($participants as $member) {
            $daily = $memberTargets[$member->id]['targets']['calories'] ?? null;
            $mealTarget = $daily ? (float) $daily * self::SLOT_RATIOS[$slot] : null;
            $baseCalories = max(1, (float) ($baseNutrition['calories'] ?? 0));
            $multiplier = $mealTarget ? max(.25, min(3, round(($mealTarget / $baseCalories) * 20) / 20)) : 1.0;
            $item->portions()->create(['household_member_id' => $member->id, 'serving_multiplier' => $multiplier, 'nutrition_snapshot' => $this->nutrition->scale($baseNutrition, $multiplier)]);
        }
        $this->pantry->reserve($item->fresh(['mealPlan.household', 'recipeVersion.ingredients', 'portions']));

        return $item;
    }

    private function expandBatchReservation(MealPlanItem $source, MealPlanItem $leftover): void
    {
        $totalServings = (float) $source->portions()->sum('serving_multiplier') + (float) $leftover->portions()->sum('serving_multiplier');
        $this->pantry->release($source);
        $source->update(['manual_overrides' => array_merge($source->manual_overrides ?? [], ['batch_serving_multiplier' => $totalServings, 'leftover_item_id' => $leftover->id])]);
        $this->pantry->reserve($source->fresh(['mealPlan.household', 'recipeVersion.ingredients', 'portions']));
    }

    private function removeRegenerableItems(MealPlan $plan, array $scope): void
    {
        $query = $plan->items();
        if (! ($scope['reset_overrides'] ?? false)) {
            $query->where('is_locked', false)->whereNotIn('origin', ['manual', 'replacement'])->whereNull('manual_overrides')->where('status', 'planned');
        }
        if (isset($scope['date'])) {
            $query->whereDate('scheduled_date', $scope['date']);
        }
        if (isset($scope['meal_slot'])) {
            $query->where('meal_slot', $scope['meal_slot']);
        }
        foreach ($query->get() as $item) {
            $this->pantry->release($item);
            $item->delete();
        }
    }

    private function participants(Collection $members, Carbon $date, string $slot): Collection
    {
        $day = strtolower($date->format('l'));

        return $members->filter(function (HouseholdMember $member) use ($day, $slot) {
            $schedule = $member->participation_schedule ?? [];

            return (bool) data_get($schedule, "{$day}.{$slot}", data_get($schedule, "default.{$slot}", true));
        });
    }
}
