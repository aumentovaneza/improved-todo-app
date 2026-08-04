<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\RecipeVersion;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RecipeScorer
{
    public const PROFILES = [
        'balanced' => ['availability' => .22, 'nutrition' => .25, 'budget' => .15, 'preparation' => .10, 'preference' => .10, 'pantry' => .05, 'reuse' => .04, 'variety' => .04, 'leftovers' => .05],
        'lowest_cost' => ['availability' => .20, 'nutrition' => .15, 'budget' => .35, 'preparation' => .05, 'preference' => .08, 'pantry' => .07, 'reuse' => .04, 'variety' => .02, 'leftovers' => .04],
        'fastest_preparation' => ['availability' => .18, 'nutrition' => .20, 'budget' => .10, 'preparation' => .30, 'preference' => .08, 'pantry' => .04, 'reuse' => .03, 'variety' => .03, 'leftovers' => .04],
        'highest_nutrition_fit' => ['availability' => .15, 'nutrition' => .45, 'budget' => .10, 'preparation' => .08, 'preference' => .08, 'pantry' => .03, 'reuse' => .03, 'variety' => .04, 'leftovers' => .04],
        'maximum_pantry_usage' => ['availability' => .15, 'nutrition' => .20, 'budget' => .10, 'preparation' => .08, 'preference' => .07, 'pantry' => .30, 'reuse' => .04, 'variety' => .02, 'leftovers' => .04],
        'local_ingredients' => ['availability' => .45, 'nutrition' => .20, 'budget' => .10, 'preparation' => .07, 'preference' => .07, 'pantry' => .03, 'reuse' => .02, 'variety' => .02, 'leftovers' => .04],
    ];

    public function __construct(private RecipeNutritionCalculator $nutrition) {}

    /** @return array{eligible: bool, score: float, components: array<string, float>, warnings: array<int, string>} */
    public function score(RecipeVersion $version, Household $household, Collection $members, array $context): array
    {
        $version->loadMissing('recipe', 'ingredients.ingredient');
        $settings = $context['settings'] ?? [];
        $allergens = $members->flatMap(fn (HouseholdMember $m) => $m->allergies ?? [])->map(fn ($v) => strtolower((string) $v))->unique();
        $restrictions = $members->flatMap(fn (HouseholdMember $m) => $m->dietary_restrictions ?? [])->map(fn ($v) => strtolower((string) $v))->unique();
        if ($allergens->intersect(array_map('strtolower', $version->allergens ?? []))->isNotEmpty()) {
            return $this->rejected('Allergen conflict.');
        }
        if ($restrictions->diff(array_map('strtolower', $version->dietary_tags ?? []))->isNotEmpty()) {
            return $this->rejected('Mandatory dietary restriction conflict.');
        }
        $prohibited = collect($settings['prohibited_ingredients'] ?? [])->map(fn ($value) => strtolower((string) $value));
        $ingredientNames = $version->ingredients->map(fn ($row) => strtolower((string) $row->ingredient?->canonical_name));
        if ($prohibited->intersect($ingredientNames)->isNotEmpty()) {
            return $this->rejected('Recipe contains a prohibited ingredient.');
        }
        if ($members->contains(fn (HouseholdMember $member) => $member->isChild()) && in_array('child_unsafe', $version->dietary_tags ?? [], true)) {
            return $this->rejected('Recipe is not suitable for a child participant.');
        }
        if (array_diff($version->equipment ?? [], $settings['equipment'] ?? $version->equipment ?? [])) {
            return $this->rejected('Required equipment is unavailable.');
        }
        $minutes = $version->preparation_minutes + $version->cooking_minutes;
        if (($settings['strict_max_preparation_minutes'] ?? null) && $minutes > $settings['strict_max_preparation_minutes']) {
            return $this->rejected('Strict preparation-time limit exceeded.');
        }

        $availability = $this->availability($version, $household);
        if ($availability < 50 && ! ($settings['allow_specialty_ingredients'] ?? false)) {
            return $this->rejected('Local ingredient availability is below 50%.');
        }
        $recipeNutrition = $this->nutrition->perServing($version);
        if (($settings['strict_nutrition'] ?? false) && ($recipeNutrition['_confidence'] ?? null) !== 'high') {
            return $this->rejected('Strict nutrition validation requires exact, complete local nutrition data.');
        }
        $target = (float) ($context['target_calories_per_serving'] ?? 0);
        $nutritionScore = $target > 0 ? max(0, 100 - (abs(((float) ($recipeNutrition['calories'] ?? 0)) - $target) / $target * 100)) : 50;
        $knownCost = $this->cost($version, $household);
        if (($settings['strict_budget_per_meal'] ?? null) && $knownCost !== null && $knownCost > $settings['strict_budget_per_meal']) {
            return $this->rejected('Strict meal budget exceeded.');
        }
        $budgetScore = $knownCost === null ? 50 : max(0, 100 - min(100, $knownCost / max(1, (float) ($settings['budget_per_meal'] ?? $knownCost * 2)) * 100));
        $prepScore = max(0, 100 - min(100, $minutes / max(1, (int) ($settings['preferred_preparation_minutes'] ?? 60)) * 100));
        $preferenceScore = $this->preference($version, $members);
        $pantryScore = $this->pantry($version, $household);
        $reuseScore = count(array_intersect($version->ingredients->pluck('ingredient_id')->filter()->all(), $context['recent_ingredient_ids'] ?? [])) ? 100 : 40;
        $varietyScore = in_array($version->recipe_id, $context['recent_recipe_ids'] ?? [], true) ? 0 : 100;
        $components = ['availability' => $availability, 'nutrition' => $nutritionScore, 'budget' => $budgetScore, 'preparation' => $prepScore, 'preference' => $preferenceScore, 'pantry' => $pantryScore, 'reuse' => $reuseScore, 'variety' => $varietyScore, 'leftovers' => $version->leftover_suitable ? 100 : 40];
        $weights = self::PROFILES[$context['priority_profile'] ?? 'balanced'] ?? self::PROFILES['balanced'];
        $score = 0.0;
        foreach ($components as $component => $value) {
            $score += $value * $weights[$component];
        }
        $warnings = [];
        if ($availability < 75) {
            $warnings[] = 'Recipe requires local substitutions.';
        }
        if ($target <= 0) {
            $warnings[] = 'Nutrition fit could not be scored because a participant target is incomplete.';
        }
        if ($knownCost === null) {
            $warnings[] = 'Local cost is incomplete.';
        }
        if (($recipeNutrition['_confidence'] ?? null) === 'low') {
            $warnings[] = 'Nutrition contains uncertain or missing ingredient quantities.';
        }

        return ['eligible' => true, 'score' => round($score, 4), 'components' => $components, 'warnings' => $warnings];
    }

    private function availability(RecipeVersion $version, Household $household): float
    {
        $weighted = 0;
        $available = 0;
        foreach ($version->ingredients as $row) {
            $weight = $row->is_optional ? .25 : 1;
            $weighted += $weight;
            $record = DB::table('country_ingredients')->where('ingredient_id', $row->ingredient_id)->where('country_code', $household->country_code)->where(fn ($q) => $q->where('region_id', $household->region_id)->orWhereNull('region_id'))->orderByRaw('region_id IS NULL')->first();
            $available += $weight * match ($record?->availability ?? 'unknown') {
                'common' => 1, 'available' => .9, 'specialty' => .7, 'seasonal' => .6, 'rare' => .3, default => .5
            };
        }

        return $weighted ? round($available / $weighted * 100, 2) : 50;
    }

    private function cost(RecipeVersion $version, Household $household): ?float
    {
        $total = 0;
        foreach ($version->ingredients as $row) {
            if ($row->is_optional) {
                continue;
            }
            $price = DB::table('regional_ingredient_prices')->where('ingredient_id', $row->ingredient_id)->where(fn ($q) => $q->where('household_id', $household->id)->orWhereNull('household_id'))->where('currency', $household->currency)->orderByRaw('household_id IS NULL')->first();
            if (! $price || $row->normalized_quantity === null || $row->normalized_unit !== $price->unit) {
                return null;
            }
            $total += ((float) $row->normalized_quantity / max(.001, (float) $price->quantity)) * (float) $price->price;
        }

        return $total / max(1, $version->servings);
    }

    private function preference(RecipeVersion $version, Collection $members): float
    {
        $haystack = strtolower($version->recipe->name.' '.$version->ingredients->pluck('original_text')->implode(' '));
        $liked = $members->flatMap(fn ($m) => $m->food_preferences ?? [])->filter(fn ($v) => str_contains($haystack, strtolower((string) $v)))->count();
        $disliked = $members->flatMap(fn ($m) => $m->disliked_foods ?? [])->filter(fn ($v) => str_contains($haystack, strtolower((string) $v)))->count();

        return max(0, min(100, 60 + ($liked * 10) - ($disliked * 20)));
    }

    private function pantry(RecipeVersion $version, Household $household): float
    {
        $required = $version->ingredients->where('is_optional', false)->pluck('ingredient_id')->filter();
        if ($required->isEmpty()) {
            return 0;
        }
        $present = DB::table('pantry_items')->where('household_id', $household->id)->whereIn('ingredient_id', $required)->whereRaw('quantity > reserved_quantity')->distinct()->count('ingredient_id');

        return round($present / $required->count() * 100, 2);
    }

    private function rejected(string $warning): array
    {
        return ['eligible' => false, 'score' => 0, 'components' => [], 'warnings' => [$warning]];
    }
}
