<?php

namespace App\Modules\MealPlanning\Data;

final readonly class ExternalPackagedFoodData
{
    public function __construct(
        public string $provider,
        public string $barcode,
        public string $name,
        public ?string $brand,
        public ?string $ingredientsText,
        public array $allergens,
        public array $markets,
        public float $servingQuantity,
        public string $servingUnit,
        public ?float $packageQuantity,
        public ?string $packageUnit,
        public array $nutrients,
        public ?string $imageUrl,
        public string $confidence,
        public ?string $sourceUrl,
        public ?string $license,
        public array $raw,
    ) {}
}
