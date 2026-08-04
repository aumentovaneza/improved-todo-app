<?php

use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Services\RecipeScorer;
use App\Modules\MealPlanning\Services\UnitNormalizer;

test('scoring profiles are normalized', function () {
    foreach (RecipeScorer::PROFILES as $weights) {
        expect(round(array_sum($weights), 8))->toBe(1.0);
    }
});

test('unit normalization marks density conversions as estimates and refuses unknown density', function () {
    $normalizer = new UnitNormalizer;
    $dense = new Ingredient(['density_g_per_ml' => 1.03]);
    expect($normalizer->normalize(1, 'kg', null))->toBe(['quantity' => 1000.0, 'unit' => 'g', 'confidence' => 'exact'])
        ->and($normalizer->normalize(1, 'cup', $dense)['confidence'])->toBe('estimated')
        ->and($normalizer->normalize(1, 'cup', new Ingredient))->toBe(['quantity' => 236.588, 'unit' => 'ml', 'confidence' => 'exact']);
});
