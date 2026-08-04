<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\NutritionProvider;
use App\Modules\MealPlanning\Data\ExternalNutritionData;
use App\Modules\MealPlanning\Data\FoodSearchCriteria;
use App\Modules\MealPlanning\Data\FoodSearchResult;
use App\Modules\MealPlanning\Providers\Concerns\CallsMealProvider;
use Illuminate\Support\Facades\Cache;

class UsdaNutritionProvider implements NutritionProvider
{
    use CallsMealProvider;

    public function name(): string
    {
        return 'usda_fdc';
    }

    public function enabled(): bool
    {
        return filled(config('services.meal_planning.usda.key'));
    }

    public function search(FoodSearchCriteria $criteria): FoodSearchResult
    {
        if (! $this->enabled()) {
            return new FoodSearchResult([], $this->name());
        }
        $key = 'meal-provider:usda:search:'.hash('sha256', json_encode($criteria));
        $cached = Cache::has($key);
        $data = Cache::remember($key, now()->addDay(), fn () => $this->request('search', fn ($http) => $http->post(config('services.meal_planning.usda.base_url').'/foods/search?api_key='.config('services.meal_planning.usda.key'), ['query' => $criteria->query, 'pageSize' => $criteria->limit])));

        return new FoodSearchResult(array_map(fn ($row) => $this->normalize($row), $data['foods'] ?? []), $this->name(), $cached);
    }

    public function getNutrition(string $externalId): ?ExternalNutritionData
    {
        if (! $this->enabled()) {
            return null;
        }
        $data = Cache::remember('meal-provider:usda:find:'.$externalId, now()->addDays(7), fn () => $this->request('find', fn ($http) => $http->get(config('services.meal_planning.usda.base_url').'/food/'.$externalId, ['api_key' => config('services.meal_planning.usda.key')])));

        return empty($data) ? null : $this->normalize($data);
    }

    private function normalize(array $row): ExternalNutritionData
    {
        $map = ['Energy' => 'calories', 'Protein' => 'protein', 'Carbohydrate, by difference' => 'carbohydrates', 'Total lipid (fat)' => 'fat', 'Fiber, total dietary' => 'fiber', 'Sugars, total including NLEA' => 'sugar', 'Sodium, Na' => 'sodium'];
        $nutrients = [];
        foreach ($row['foodNutrients'] ?? [] as $n) {
            $name = $n['nutrientName'] ?? $n['nutrient']['name'] ?? '';
            if (isset($map[$name])) {
                $nutrients[$map[$name]] = (float) ($n['value'] ?? $n['amount'] ?? 0);
            }
        }

        return new ExternalNutritionData($this->name(), (string) ($row['fdcId'] ?? ''), (string) ($row['description'] ?? 'Food'), 100, 'g', $nutrients, in_array($row['dataType'] ?? '', ['Foundation', 'SR Legacy'], true) ? 'high' : 'medium', isset($row['fdcId']) ? 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/'.$row['fdcId'].'/nutrients' : null, $row);
    }
}
