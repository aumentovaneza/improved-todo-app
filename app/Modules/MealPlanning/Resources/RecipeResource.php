<?php

namespace App\Modules\MealPlanning\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\MealPlanning\Models\Recipe */
class RecipeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $version = $this->whenLoaded('latestVersion');

        return ['id' => $this->id, 'household_id' => $this->household_id, 'scope' => $this->scope, 'name' => $this->name, 'description' => $this->description, 'cuisine' => $this->cuisine, 'category' => $this->category, 'meal_types' => $this->meal_types ?? [], 'image_url' => $this->image_url, 'needs_review' => $this->needs_review, 'version' => $version && ! $version instanceof \Illuminate\Http\Resources\MissingValue ? ['id' => $version->id, 'version' => $version->version, 'servings' => $version->servings, 'preparation_minutes' => $version->preparation_minutes, 'cooking_minutes' => $version->cooking_minutes, 'equipment' => $version->equipment ?? [], 'allergens' => $version->allergens ?? [], 'dietary_tags' => $version->dietary_tags ?? [], 'steps' => $version->relationLoaded('steps') ? $version->steps->pluck('instruction')->all() : [], 'ingredients' => $version->relationLoaded('ingredients') ? $version->ingredients->map(fn ($row) => ['id' => $row->id, 'ingredient_id' => $row->ingredient_id, 'name' => $row->ingredient?->canonical_name, 'original_text' => $row->original_text, 'quantity' => $row->normalized_quantity, 'unit' => $row->normalized_unit, 'confidence' => $row->conversion_confidence])->all() : [], 'nutrition' => $version->latestNutrition?->nutrients] : null, 'sources' => $this->whenLoaded('sources')];
    }
}
