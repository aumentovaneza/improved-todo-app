<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\RecipeVersion;

class RecipeNutritionCalculator
{
    public const VERSION = 'ingredient-sum-v1';

    public function perServing(RecipeVersion $version): array
    {
        $version->loadMissing('latestNutrition', 'ingredients.ingredient.nutritionRecords');
        if ($version->latestNutrition) {
            return $version->latestNutrition->nutrients ?? [];
        }
        $totals = $this->blank();
        $uncertain = false;
        foreach ($version->ingredients as $row) {
            $nutrition = $row->ingredient?->nutritionRecords->sortByDesc('created_at')->first();
            if (! $nutrition || $row->normalized_unit !== $nutrition->basis_unit || $row->normalized_quantity === null) {
                $uncertain = true;

                continue;
            }
            $factor = (float) $row->normalized_quantity / max(0.001, (float) $nutrition->basis_quantity);
            foreach ($totals as $key => $value) {
                $totals[$key] += (float) ($nutrition->nutrients[$key] ?? 0) * $factor;
            }
        }
        $servings = max(1, $version->servings);
        foreach ($totals as $key => $value) {
            $totals[$key] = round($value / $servings, 2);
        }
        $totals['_confidence'] = $uncertain ? 'low' : 'high';

        return $totals;
    }

    public function scale(array $nutrition, float $multiplier): array
    {
        $scaled = [];
        foreach ($nutrition as $key => $value) {
            $scaled[$key] = is_numeric($value) ? round((float) $value * $multiplier, 2) : $value;
        }

        return $scaled;
    }

    private function blank(): array
    {
        return ['calories' => 0.0, 'protein' => 0.0, 'carbohydrates' => 0.0, 'fat' => 0.0, 'fiber' => 0.0, 'sugar' => 0.0, 'sodium' => 0.0];
    }
}
