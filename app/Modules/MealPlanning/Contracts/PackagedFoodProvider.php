<?php

namespace App\Modules\MealPlanning\Contracts;

use App\Modules\MealPlanning\Data\ExternalPackagedFoodData;

interface PackagedFoodProvider
{
    public function name(): string;

    public function enabled(): bool;

    public function findByBarcode(string $barcode): ?ExternalPackagedFoodData;
}
