<?php

namespace App\Modules\MealPlanning\Data;

final readonly class RecipeSearchCriteria
{
    public function __construct(
        public ?string $query = null,
        public ?string $mealType = null,
        public ?string $cuisine = null,
        public array $includeIngredients = [],
        public array $excludeIngredients = [],
        public array $dietaryRestrictions = [],
        public int $limit = 20,
    ) {}
}
