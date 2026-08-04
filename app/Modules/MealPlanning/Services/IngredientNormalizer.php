<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Models\IngredientAlias;
use Illuminate\Support\Str;

class IngredientNormalizer
{
    public function normalizeName(string $name): string
    {
        return Str::of($name)->lower()->ascii()->replaceMatches('/[^a-z0-9]+/', ' ')->squish()->toString();
    }

    public function resolve(string $name, bool $createSuggested = true): ?Ingredient
    {
        $normalized = $this->normalizeName($name);
        $alias = IngredientAlias::with('ingredient')->where('normalized_alias', $normalized)->where('match_status', 'confirmed')->first();
        if ($alias) {
            return $alias->ingredient;
        }
        $ingredient = Ingredient::where('slug', Str::slug($normalized))
            ->orWhereRaw('LOWER(canonical_name) = ?', [$normalized])
            ->first();
        if ($ingredient) {
            return $ingredient;
        }
        if (! $createSuggested) {
            return null;
        }
        $baseSlug = Str::slug($normalized) ?: 'ingredient';
        $slug = Ingredient::where('slug', $baseSlug)->exists()
            ? $baseSlug.'-'.substr(hash('sha1', $normalized), 0, 6)
            : $baseSlug;
        $ingredient = Ingredient::create(['slug' => $slug, 'canonical_name' => Str::title($normalized)]);
        IngredientAlias::create(['ingredient_id' => $ingredient->id, 'alias' => $name, 'normalized_alias' => $normalized, 'locale' => null, 'match_status' => 'suggested']);

        return $ingredient;
    }
}
