<?php

namespace App\Modules\MealPlanning\Contracts;

use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Data\RecipeSearchResult;

interface RecipeProvider
{
    public function name(): string;

    public function enabled(): bool;

    public function search(RecipeSearchCriteria $criteria): RecipeSearchResult;

    public function find(string $externalId): ?ExternalRecipeData;
}
