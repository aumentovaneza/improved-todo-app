<?php

namespace App\Modules\MealPlanning\Contracts;

use App\Modules\MealPlanning\Data\ExternalNutritionData;
use App\Modules\MealPlanning\Data\FoodSearchCriteria;
use App\Modules\MealPlanning\Data\FoodSearchResult;

interface NutritionProvider
{
    public function name(): string;

    public function enabled(): bool;

    public function search(FoodSearchCriteria $criteria): FoodSearchResult;

    public function getNutrition(string $externalId): ?ExternalNutritionData;
}
