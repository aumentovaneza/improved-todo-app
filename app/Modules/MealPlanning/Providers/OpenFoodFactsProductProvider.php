<?php

namespace App\Modules\MealPlanning\Providers;

use App\Modules\MealPlanning\Contracts\PackagedFoodProvider;
use App\Modules\MealPlanning\Data\ExternalPackagedFoodData;
use App\Modules\MealPlanning\Providers\Concerns\CallsMealProvider;
use Illuminate\Support\Facades\Cache;

class OpenFoodFactsProductProvider implements PackagedFoodProvider
{
    use CallsMealProvider;

    public function name(): string
    {
        return 'open_food_facts';
    }

    public function enabled(): bool
    {
        return filled(config('services.meal_planning.open_food_facts.base_url'));
    }

    public function findByBarcode(string $barcode): ?ExternalPackagedFoodData
    {
        $normalized = $this->normalizeBarcode($barcode);
        $data = Cache::remember('meal-provider:off:'.$normalized, now()->addDays(7), fn () => $this->request('barcode', fn ($http) => $http->withHeaders(['User-Agent' => config('services.meal_planning.open_food_facts.user_agent')])->get(rtrim(config('services.meal_planning.open_food_facts.base_url'), '/').'/product/'.$normalized, ['fields' => 'code,product_name,brands,serving_size,product_quantity,quantity,ingredients_text,allergens_tags,countries_tags,nutriments,image_front_url'])));
        $p = $data['product'] ?? null;
        if (! is_array($p) || empty($p['product_name'])) {
            return null;
        }
        $n = $p['nutriments'] ?? [];

        return new ExternalPackagedFoodData($this->name(), $normalized, $p['product_name'], $p['brands'] ?? null, $p['ingredients_text'] ?? null, $p['allergens_tags'] ?? [], $p['countries_tags'] ?? [], 100, 'g', isset($p['product_quantity']) ? (float) $p['product_quantity'] : null, null, ['calories' => (float) ($n['energy-kcal_100g'] ?? 0), 'protein' => (float) ($n['proteins_100g'] ?? 0), 'carbohydrates' => (float) ($n['carbohydrates_100g'] ?? 0), 'fat' => (float) ($n['fat_100g'] ?? 0), 'fiber' => (float) ($n['fiber_100g'] ?? 0), 'sugar' => (float) ($n['sugars_100g'] ?? 0), 'sodium' => (float) ($n['sodium_100g'] ?? 0)], $p['image_front_url'] ?? null, 'low', 'https://world.openfoodfacts.org/product/'.$normalized, 'ODbL / Database Contents License', $p);
    }

    private function normalizeBarcode(string $barcode): string
    {
        $digits = ltrim(preg_replace('/\D/', '', $barcode) ?? '', '0');
        if (strlen($digits) <= 7) {
            return str_pad($digits, 8, '0', STR_PAD_LEFT);
        }
        if (strlen($digits) >= 9 && strlen($digits) <= 12) {
            return str_pad($digits, 13, '0', STR_PAD_LEFT);
        }

        return $digits;
    }
}
