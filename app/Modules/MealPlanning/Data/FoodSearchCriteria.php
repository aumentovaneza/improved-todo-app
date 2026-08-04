<?php

namespace App\Modules\MealPlanning\Data;

final readonly class FoodSearchCriteria
{
    public function __construct(public string $query, public int $limit = 20) {}
}
