<?php

namespace App\Modules\MealPlanning\Data;

final readonly class RecipeSearchResult
{
    /** @param array<int, ExternalRecipeData> $recipes */
    public function __construct(public array $recipes, public string $provider, public bool $fromCache = false) {}
}
