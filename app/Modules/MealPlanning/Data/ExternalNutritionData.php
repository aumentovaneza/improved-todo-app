<?php

namespace App\Modules\MealPlanning\Data;

final readonly class ExternalNutritionData
{
    public function __construct(
        public string $provider,
        public string $externalId,
        public string $description,
        public float $servingQuantity,
        public string $servingUnit,
        public array $nutrients,
        public string $confidence,
        public ?string $sourceUrl,
        public array $raw,
    ) {}
}
