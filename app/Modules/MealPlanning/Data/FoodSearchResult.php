<?php

namespace App\Modules\MealPlanning\Data;

final readonly class FoodSearchResult
{
    /** @param array<int, ExternalNutritionData> $foods */
    public function __construct(public array $foods, public string $provider, public bool $fromCache = false) {}
}
