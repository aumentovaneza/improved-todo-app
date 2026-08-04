<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\RecipeVersion;
use Illuminate\Support\Collection;

class RecipeCandidateFinder
{
    public function __construct(private RecipeScorer $scorer) {}

    public function ranked(Household $household, Collection $members, string $mealSlot, array $context): Collection
    {
        return RecipeVersion::query()->with(['recipe', 'ingredients.ingredient', 'latestNutrition'])
            ->whereHas('recipe', fn ($q) => $q->where('is_active', true)->where(fn ($available) => $available->whereNull('household_id')->orWhere('household_id', $household->id))->whereJsonContains('meal_types', $mealSlot))
            ->get()->map(function (RecipeVersion $version) use ($household, $members, $context) {
                $result = $this->scorer->score($version, $household, $members, $context);

                return ['version' => $version, ...$result, 'tie' => hash('sha256', ($context['seed'] ?? '').':'.$version->id)];
            })->where('eligible', true)->sort(fn ($a, $b) => $b['score'] <=> $a['score'] ?: strcmp($a['tie'], $b['tie']))->values();
    }
}
