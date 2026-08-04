<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\RecipeProvider;
use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Data\RecipeSearchResult;
use App\Modules\MealPlanning\Providers\Concerns\CallsMealProvider;
use Illuminate\Support\Facades\Cache;

class TheMealDbRecipeProvider implements RecipeProvider
{
    use CallsMealProvider;

    public function name(): string
    {
        return 'themealdb';
    }

    public function enabled(): bool
    {
        $key = (string) config('services.meal_planning.themealdb.key', '1');

        return $key !== '' && (! app()->environment('production') || $key !== '1');
    }

    public function search(RecipeSearchCriteria $criteria): RecipeSearchResult
    {
        if (! $this->enabled()) {
            return new RecipeSearchResult([], $this->name());
        }
        $cacheKey = 'meal-provider:themealdb:search:'.hash('sha256', json_encode($criteria));
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return new RecipeSearchResult(array_map(fn ($row) => $this->normalize($row), $cached), $this->name(), true);
        }

        $data = $this->request('search', fn ($http) => $http->get($this->baseUrl().'/'.$this->key().'/search.php', ['s' => $criteria->query ?? '']));
        $rows = array_slice($data['meals'] ?? [], 0, $criteria->limit);
        Cache::put($cacheKey, $rows, now()->addDay());

        return new RecipeSearchResult(array_map(fn ($row) => $this->normalize($row), $rows), $this->name());
    }

    public function find(string $externalId): ?ExternalRecipeData
    {
        if (! $this->enabled()) {
            return null;
        }
        $row = Cache::remember('meal-provider:themealdb:find:'.$externalId, now()->addDays(7), function () use ($externalId) {
            $data = $this->request('find', fn ($http) => $http->get($this->baseUrl().'/'.$this->key().'/lookup.php', ['i' => $externalId]));

            return $data['meals'][0] ?? null;
        });

        return is_array($row) ? $this->normalize($row) : null;
    }

    private function normalize(array $row): ExternalRecipeData
    {
        $ingredients = [];
        for ($i = 1; $i <= 20; $i++) {
            $name = trim((string) ($row['strIngredient'.$i] ?? ''));
            if ($name === '') {
                continue;
            }
            $measure = trim((string) ($row['strMeasure'.$i] ?? ''));
            $ingredients[] = ['name' => $name, 'original_text' => trim($measure.' '.$name), 'quantity' => null, 'unit' => null];
        }
        $steps = array_values(array_filter(array_map('trim', preg_split('/(?:\r?\n)+/', (string) ($row['strInstructions'] ?? '')) ?: [])));

        return new ExternalRecipeData(
            $this->name(), (string) $row['idMeal'], (string) $row['strMeal'], null,
            $row['strArea'] ?? null, $row['strCategory'] ?? null, $this->mealTypes($row), $ingredients,
            $steps, 4, 0, 0, [], [], [], null, $row['strMealThumb'] ?? null,
            $row['strSource'] ?? null, null, 'TheMealDB', $row,
        );
    }

    private function mealTypes(array $row): array
    {
        $category = strtolower((string) ($row['strCategory'] ?? ''));
        if (str_contains($category, 'breakfast')) {
            return ['breakfast'];
        }
        if (str_contains($category, 'dessert') || str_contains($category, 'side')) {
            return ['snack'];
        }

        return ['lunch', 'dinner'];
    }

    private function key(): string
    {
        return (string) config('services.meal_planning.themealdb.key', '1');
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.meal_planning.themealdb.base_url'), '/');
    }
}
