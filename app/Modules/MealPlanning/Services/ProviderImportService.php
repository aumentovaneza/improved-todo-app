<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Data\ExternalNutritionData;
use App\Modules\MealPlanning\Data\ExternalPackagedFoodData;
use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Models\PackagedFood;
use App\Modules\MealPlanning\Models\PackagedFoodNutrition;
use App\Modules\MealPlanning\Models\PackagedFoodServing;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Models\RecipeSource;
use Illuminate\Support\Facades\DB;

class ProviderImportService
{
    public function __construct(private IngredientNormalizer $ingredients, private UnitNormalizer $units, private RecipeDuplicateDetector $duplicates) {}

    public function importRecipe(ExternalRecipeData $data, ?int $householdId = null, ?int $userId = null): Recipe
    {
        return DB::transaction(function () use ($data, $householdId, $userId) {
            $checksum = hash('sha256', json_encode($data->raw));
            $source = RecipeSource::where('provider', $data->provider)->where('external_id', $data->externalId)->first();
            $recipe = $source?->recipe_id ? Recipe::find($source->recipe_id) : null;
            $recipe ??= Recipe::create(['household_id' => $householdId, 'scope' => $householdId ? 'household' : 'imported', 'name' => $data->name, 'normalized_name' => $this->ingredients->normalizeName($data->name), 'description' => $data->description, 'cuisine' => $data->cuisine, 'category' => $data->category, 'meal_types' => $data->mealTypes, 'image_url' => $data->imageUrl]);
            $recipe->update(['name' => $data->name, 'normalized_name' => $this->ingredients->normalizeName($data->name), 'description' => $data->description, 'cuisine' => $data->cuisine, 'category' => $data->category, 'meal_types' => $data->mealTypes, 'image_url' => $data->imageUrl]);

            if (! $source || $source->payload_checksum !== $checksum) {
                $version = $recipe->versions()->max('version') + 1;
                $recipeVersion = $recipe->versions()->create(['version' => $version, 'servings' => max(1, $data->servings), 'preparation_minutes' => $data->preparationMinutes, 'cooking_minutes' => $data->cookingMinutes, 'equipment' => $data->equipment, 'allergens' => $data->allergens, 'dietary_tags' => $data->dietaryTags, 'leftover_suitable' => false, 'content_checksum' => $checksum, 'created_by_user_id' => $userId]);
                foreach ($data->ingredients as $row) {
                    $ingredient = $this->ingredients->resolve((string) ($row['name'] ?? $row['original_text'] ?? 'Ingredient'));
                    $normalized = $this->units->normalize(isset($row['quantity']) ? (float) $row['quantity'] : null, $row['unit'] ?? null, $ingredient);
                    $recipeVersion->ingredients()->create(['ingredient_id' => $ingredient?->id, 'original_text' => $row['original_text'] ?? $row['name'], 'original_quantity' => $row['quantity'] ?? null, 'original_unit' => $row['unit'] ?? null, 'normalized_quantity' => $normalized['quantity'], 'normalized_unit' => $normalized['unit'], 'conversion_confidence' => $normalized['confidence']]);
                }
                foreach ($data->steps as $position => $instruction) {
                    $recipeVersion->steps()->create(['position' => $position + 1, 'instruction' => strip_tags((string) $instruction)]);
                }
                if ($data->nutrition) {
                    $recipeVersion->nutritionSnapshots()->create(['nutrients' => $data->nutrition, 'source' => $data->provider, 'external_id' => $data->externalId, 'confidence' => 'medium', 'calculation_version' => 'provider-v1', 'calculated_at' => now()]);
                }
            }

            RecipeSource::updateOrCreate(['provider' => $data->provider, 'external_id' => $data->externalId], ['recipe_id' => $recipe->id, 'source_url' => $data->sourceUrl, 'license' => $data->license, 'attribution' => $data->attribution, 'source_confidence' => $data->provider === 'wevie' ? 'high' : 'medium', 'payload_checksum' => $checksum, 'import_status' => 'active', 'imported_at' => $source?->imported_at ?? now(), 'last_synchronized_at' => now()]);
            $this->duplicates->flag($recipe);

            return $recipe->fresh(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition', 'sources']);
        });
    }

    public function importPackagedFood(ExternalPackagedFoodData $data): PackagedFood
    {
        return DB::transaction(function () use ($data) {
            $food = PackagedFood::updateOrCreate(['barcode' => $data->barcode], ['brand' => $data->brand, 'name' => $data->name, 'image_url' => $data->imageUrl, 'ingredients_text' => $data->ingredientsText, 'allergens' => $data->allergens, 'markets' => $data->markets, 'confidence' => $data->confidence]);
            $serving = PackagedFoodServing::updateOrCreate(['packaged_food_id' => $food->id, 'quantity' => $data->servingQuantity, 'unit' => $data->servingUnit], ['label' => 'Per '.$data->servingQuantity.$data->servingUnit, 'package_quantity' => $data->packageQuantity, 'package_unit' => $data->packageUnit]);
            PackagedFoodNutrition::create(['packaged_food_id' => $food->id, 'packaged_food_serving_id' => $serving->id, 'nutrients' => $data->nutrients, 'source' => $data->provider, 'calculation_version' => 'label-v1', 'confidence' => $data->confidence, 'retrieved_at' => now()]);
            DB::table('packaged_food_sources')->updateOrInsert(['provider' => $data->provider, 'external_id' => $data->barcode], ['packaged_food_id' => $food->id, 'source_url' => $data->sourceUrl, 'license' => $data->license, 'payload_checksum' => hash('sha256', json_encode($data->raw)), 'imported_at' => now(), 'last_synchronized_at' => now(), 'created_at' => now(), 'updated_at' => now()]);

            return $food->fresh(['servings', 'nutrition']);
        });
    }

    public function importNutrition(ExternalNutritionData $data, ?int $ingredientId = null): Ingredient
    {
        return DB::transaction(function () use ($data, $ingredientId) {
            $ingredient = $ingredientId ? Ingredient::findOrFail($ingredientId) : $this->ingredients->resolve($data->description);
            $ingredient->nutritionRecords()->create(['basis_quantity' => $data->servingQuantity, 'basis_unit' => $data->servingUnit, 'nutrients' => $data->nutrients, 'provider' => $data->provider, 'external_id' => $data->externalId, 'confidence' => $data->confidence, 'calculation_version' => 'provider-normalized-v1', 'retrieved_at' => now()]);
            DB::table('ingredient_sources')->updateOrInsert(['provider' => $data->provider, 'external_id' => $data->externalId], ['ingredient_id' => $ingredient->id, 'source_url' => $data->sourceUrl, 'license' => null, 'payload_checksum' => hash('sha256', json_encode($data->raw)), 'import_status' => 'active', 'imported_at' => now(), 'last_synchronized_at' => now(), 'created_at' => now(), 'updated_at' => now()]);

            return $ingredient->fresh('nutritionRecords');
        });
    }
}
