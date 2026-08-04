<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\NutritionProvider;
use App\Modules\MealPlanning\Data\ExternalNutritionData;
use App\Modules\MealPlanning\Data\FoodSearchCriteria;
use App\Modules\MealPlanning\Data\FoodSearchResult;
use App\Modules\MealPlanning\Providers\Concerns\CallsMealProvider;
use Illuminate\Support\Facades\Cache;

class EdamamNutritionProvider implements NutritionProvider
{
    use CallsMealProvider;

    public function name(): string
    {
        return 'edamam';
    }

    public function enabled(): bool
    {
        return filled(config('services.meal_planning.edamam.app_id')) && filled(config('services.meal_planning.edamam.app_key'));
    }

    public function search(FoodSearchCriteria $criteria): FoodSearchResult
    {
        if (! $this->enabled()) {
            return new FoodSearchResult([], $this->name());
        }
        $key = 'meal-provider:edamam:search:'.hash('sha256', json_encode($criteria));
        $cached = Cache::has($key);
        $data = Cache::remember($key, now()->addDay(), fn () => $this->request('search', fn ($http) => $http->get(config('services.meal_planning.edamam.base_url').'/api/food-database/v2/parser', ['app_id' => config('services.meal_planning.edamam.app_id'), 'app_key' => config('services.meal_planning.edamam.app_key'), 'ingr' => $criteria->query])));
        $rows = array_slice($data['hints'] ?? [], 0, $criteria->limit);

        return new FoodSearchResult(array_map(fn ($row) => $this->normalize($row['food'] ?? []), $rows), $this->name(), $cached);
    }

    public function getNutrition(string $externalId): ?ExternalNutritionData
    {
        return null;
    }

    private function normalize(array $food): ExternalNutritionData
    {
        $n = $food['nutrients'] ?? [];

        return new ExternalNutritionData($this->name(), (string) ($food['foodId'] ?? ''), (string) ($food['label'] ?? 'Food'), 100, 'g', ['calories' => (float) ($n['ENERC_KCAL'] ?? 0), 'protein' => (float) ($n['PROCNT'] ?? 0), 'carbohydrates' => (float) ($n['CHOCDF'] ?? 0), 'fat' => (float) ($n['FAT'] ?? 0), 'fiber' => (float) ($n['FIBTG'] ?? 0)], 'medium', null, $food);
    }
}
