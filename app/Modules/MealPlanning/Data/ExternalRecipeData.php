<?php

namespace App\Modules\MealPlanning\Data;

final readonly class ExternalRecipeData
{
    public function __construct(
        public string $provider,
        public string $externalId,
        public string $name,
        public ?string $description,
        public ?string $cuisine,
        public ?string $category,
        public array $mealTypes,
        public array $ingredients,
        public array $steps,
        public int $servings,
        public int $preparationMinutes,
        public int $cookingMinutes,
        public array $equipment,
        public array $allergens,
        public array $dietaryTags,
        public ?array $nutrition,
        public ?string $imageUrl,
        public ?string $sourceUrl,
        public ?string $license,
        public ?string $attribution,
        public array $raw,
    ) {}
}
