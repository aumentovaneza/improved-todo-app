<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\RecipeProvider;
use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Data\RecipeSearchResult;
use App\Modules\MealPlanning\Models\Recipe;

class InternalRecipeProvider implements RecipeProvider
{
    public function name(): string
    {
        return 'internal';
    }

    public function enabled(): bool
    {
        return true;
    }

    public function search(RecipeSearchCriteria $criteria): RecipeSearchResult
    {
        $query = Recipe::query()->with(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition'])->where('is_active', true);
        if ($criteria->query) {
            $query->where('name', 'like', '%'.$criteria->query.'%');
        }

        return new RecipeSearchResult($query->limit($criteria->limit)->get()->map(fn ($recipe) => $this->fromModel($recipe))->all(), $this->name());
    }

    public function find(string $externalId): ?ExternalRecipeData
    {
        $recipe = Recipe::with(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition'])->find($externalId);

        return $recipe ? $this->fromModel($recipe) : null;
    }

    private function fromModel(Recipe $recipe): ExternalRecipeData
    {
        $v = $recipe->latestVersion;

        return new ExternalRecipeData($this->name(), (string) $recipe->id, $recipe->name, $recipe->description, $recipe->cuisine, $recipe->category, $recipe->meal_types ?? [], $v?->ingredients->map(fn ($i) => ['name' => $i->ingredient?->canonical_name ?? $i->original_text, 'original_text' => $i->original_text, 'quantity' => $i->normalized_quantity, 'unit' => $i->normalized_unit])->all() ?? [], $v?->steps->pluck('instruction')->all() ?? [], $v?->servings ?? 4, $v?->preparation_minutes ?? 0, $v?->cooking_minutes ?? 0, $v?->equipment ?? [], $v?->allergens ?? [], $v?->dietary_tags ?? [], $v?->latestNutrition?->nutrients, $recipe->image_url, null, 'Wevie original', 'Wevie', []);
    }
}
