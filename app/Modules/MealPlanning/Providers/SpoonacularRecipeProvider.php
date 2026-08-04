<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\RecipeProvider;
use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Data\RecipeSearchResult;
use App\Modules\MealPlanning\Providers\Concerns\CallsMealProvider;
use Illuminate\Support\Facades\Cache;

class SpoonacularRecipeProvider implements RecipeProvider
{
    use CallsMealProvider;

    public function name(): string
    {
        return 'spoonacular';
    }

    public function enabled(): bool
    {
        return filled(config('services.meal_planning.spoonacular.key'));
    }

    public function search(RecipeSearchCriteria $criteria): RecipeSearchResult
    {
        if (! $this->enabled()) {
            return new RecipeSearchResult([], $this->name());
        }
        $key = 'meal-provider:spoonacular:search:'.hash('sha256', json_encode($criteria));
        $cached = Cache::has($key);
        $data = Cache::remember($key, now()->addDay(), fn () => $this->request('search', fn ($http) => $http->get(config('services.meal_planning.spoonacular.base_url').'/recipes/complexSearch', [
            'apiKey' => config('services.meal_planning.spoonacular.key'), 'query' => $criteria->query,
            'type' => $criteria->mealType, 'cuisine' => $criteria->cuisine, 'number' => $criteria->limit,
            'addRecipeInformation' => true, 'addRecipeInstructions' => true, 'addRecipeNutrition' => true,
        ])));

        return new RecipeSearchResult(array_map(fn ($row) => $this->normalize($row), $data['results'] ?? []), $this->name(), $cached);
    }

    public function find(string $externalId): ?ExternalRecipeData
    {
        if (! $this->enabled()) {
            return null;
        }
        $data = Cache::remember('meal-provider:spoonacular:find:'.$externalId, now()->addDays(7), fn () => $this->request('find', fn ($http) => $http->get(config('services.meal_planning.spoonacular.base_url')."/recipes/{$externalId}/information", ['apiKey' => config('services.meal_planning.spoonacular.key'), 'includeNutrition' => true])));

        return empty($data) ? null : $this->normalize($data);
    }

    private function normalize(array $row): ExternalRecipeData
    {
        $ingredients = array_map(fn ($i) => ['name' => $i['name'] ?? $i['originalName'] ?? 'Ingredient', 'original_text' => $i['original'] ?? '', 'quantity' => $i['amount'] ?? null, 'unit' => $i['unit'] ?? null], $row['extendedIngredients'] ?? []);
        $steps = [];
        foreach ($row['analyzedInstructions'] ?? [] as $group) {
            foreach ($group['steps'] ?? [] as $step) {
                $steps[] = $step['step'];
            }
        }
        $nutrients = [];
        foreach ($row['nutrition']['nutrients'] ?? [] as $n) {
            $nutrients[strtolower(str_replace(' ', '_', $n['name']))] = (float) $n['amount'];
        }

        return new ExternalRecipeData($this->name(), (string) $row['id'], (string) $row['title'], $row['summary'] ?? null, $row['cuisines'][0] ?? null, $row['dishTypes'][0] ?? null, $row['dishTypes'] ?? ['lunch', 'dinner'], $ingredients, $steps, (int) ($row['servings'] ?? 4), (int) ($row['preparationMinutes'] ?? 0), (int) ($row['cookingMinutes'] ?? 0), [], [], array_values(array_filter($row['diets'] ?? [])), $nutrients ?: null, $row['image'] ?? null, $row['sourceUrl'] ?? null, null, 'Spoonacular', $row);
    }
}
