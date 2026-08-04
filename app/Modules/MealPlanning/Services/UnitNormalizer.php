<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\Ingredient;

class UnitNormalizer
{
    private const MASS = ['g' => 1, 'gram' => 1, 'grams' => 1, 'kg' => 1000, 'kilogram' => 1000];

    private const VOLUME = ['ml' => 1, 'milliliter' => 1, 'l' => 1000, 'liter' => 1000, 'tsp' => 4.92892, 'teaspoon' => 4.92892, 'tbsp' => 14.7868, 'tablespoon' => 14.7868, 'cup' => 236.588];

    private const COUNT = ['piece' => 1, 'pieces' => 1, 'pc' => 1, 'pcs' => 1, 'whole' => 1];

    /** @return array{quantity: ?float, unit: ?string, confidence: string} */
    public function normalize(?float $quantity, ?string $unit, ?Ingredient $ingredient = null): array
    {
        if ($quantity === null || ! $unit) {
            return ['quantity' => null, 'unit' => null, 'confidence' => 'unknown'];
        }
        $key = strtolower(trim($unit, ". \t\n\r\0\x0B"));
        if (isset(self::MASS[$key])) {
            return ['quantity' => round($quantity * self::MASS[$key], 3), 'unit' => 'g', 'confidence' => 'exact'];
        }
        if (isset(self::VOLUME[$key])) {
            $ml = $quantity * self::VOLUME[$key];
            if ($ingredient?->density_g_per_ml) {
                return ['quantity' => round($ml * (float) $ingredient->density_g_per_ml, 3), 'unit' => 'g', 'confidence' => 'estimated'];
            }

            return ['quantity' => round($ml, 3), 'unit' => 'ml', 'confidence' => 'exact'];
        }
        if (isset(self::COUNT[$key])) {
            return ['quantity' => round($quantity, 3), 'unit' => 'piece', 'confidence' => 'exact'];
        }

        return ['quantity' => $quantity, 'unit' => $key, 'confidence' => 'unknown'];
    }
}
