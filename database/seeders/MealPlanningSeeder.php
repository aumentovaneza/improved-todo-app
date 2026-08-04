<?php

namespace Database\Seeders;

use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Models\IngredientAlias;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Services\RecipeNutritionCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MealPlanningSeeder extends Seeder
{
    public function run(): void
    {
        $ingredients = $this->seedIngredients();
        $this->seedSubstitutions($ingredients);

        foreach ($this->recipes() as $entry) {
            $recipe = Recipe::updateOrCreate(
                ['scope' => 'system', 'normalized_name' => Str::lower($entry['name'])],
                ['name' => $entry['name'], 'description' => $entry['description'], 'cuisine' => 'Filipino', 'category' => $entry['category'], 'meal_types' => $entry['meal_types'], 'is_active' => true, 'needs_review' => false]
            );
            $version = $recipe->versions()->updateOrCreate(['version' => 1], [
                'servings' => 4,
                'preparation_minutes' => $entry['prep'],
                'cooking_minutes' => $entry['cook'],
                'equipment' => ['knife', 'cutting board', 'stove', 'pot'],
                'allergens' => $entry['allergens'],
                'dietary_tags' => $entry['tags'],
                'storage_guidance' => ['refrigerate_within_hours' => 2, 'refrigerated_days' => 3, 'reheat_until_steaming' => true],
                'child_modifications' => ['serve_sauce_or_broth_separately', 'reduce_chili_and_salt', 'cut_bones_and_firm_foods_to_age_safe_sizes'],
                'variations' => ['regional' => $entry['variation'], 'household' => 'Adjust sourness, seasoning, and vegetables to the household preference.'],
                'cost_confidence' => 'unknown',
                'leftover_suitable' => true,
                'leftover_days' => 3,
                'content_checksum' => hash('sha256', json_encode($entry)),
            ]);
            $version->steps()->delete();
            foreach ($entry['steps'] as $position => $instruction) {
                $version->steps()->create(['position' => $position + 1, 'instruction' => $instruction]);
            }
            $version->ingredients()->delete();
            foreach ($entry['ingredients'] as [$name, $grams, $optional]) {
                $version->ingredients()->create([
                    'ingredient_id' => $ingredients[$name]->id,
                    'original_text' => $grams.' g '.$name,
                    'original_quantity' => $grams,
                    'original_unit' => 'g',
                    'normalized_quantity' => $grams,
                    'normalized_unit' => 'g',
                    'conversion_confidence' => 'exact',
                    'is_optional' => $optional,
                ]);
            }
            $version->nutritionSnapshots()->delete();
            $nutrients = app(RecipeNutritionCalculator::class)->perServing($version->fresh('ingredients.ingredient.nutritionRecords'));
            $version->nutritionSnapshots()->create(['nutrients' => $nutrients, 'source' => 'wevie_ingredient_calculation', 'confidence' => $nutrients['_confidence'] === 'high' ? 'high' : 'low', 'calculation_version' => RecipeNutritionCalculator::VERSION, 'calculated_at' => now()]);
            $recipe->sources()->updateOrCreate(['provider' => 'wevie', 'external_id' => 'curated-'.Str::slug($entry['name'])], ['source_url' => null, 'license' => 'Wevie original', 'attribution' => 'Wevie culinary catalog', 'source_confidence' => 'high', 'payload_checksum' => hash('sha256', json_encode($entry)), 'import_status' => 'active', 'imported_at' => now(), 'last_synchronized_at' => now()]);
        }
    }

    /** @return array<string, Ingredient> */
    private function seedIngredients(): array
    {
        $facts = [
            'chicken' => [239, 27, 0, 14], 'pork' => [242, 27, 0, 14], 'beef' => [250, 26, 0, 15], 'eggplant' => [25, 1, 6, .2],
            'mung beans' => [347, 24, 63, 1.2], 'rice' => [365, 7, 80, .7], 'soy sauce' => [53, 8, 5, .6], 'vinegar' => [18, 0, .04, 0],
            'garlic' => [149, 6.4, 33, .5], 'onion' => [40, 1.1, 9.3, .1], 'tomato' => [18, .9, 3.9, .2], 'ginger' => [80, 1.8, 18, .8],
            'tamarind' => [239, 2.8, 63, .6], 'water spinach' => [19, 2.6, 3.1, .2], 'green papaya' => [43, .5, 11, .3], 'chayote' => [19, .8, 4.5, .1],
            'peanut butter' => [588, 25, 20, 50], 'yardlong beans' => [47, 2.8, 8.4, .4], 'bok choy' => [13, 1.5, 2.2, .2], 'coconut milk' => [230, 2.3, 5.5, 24],
            'squash' => [26, 1, 6.5, .1], 'okra' => [33, 1.9, 7.5, .2], 'bitter melon' => [17, 1, 3.7, .2], 'carrot' => [41, .9, 10, .2],
            'potato' => [77, 2, 17, .1], 'bell pepper' => [31, 1, 6, .3], 'green peas' => [81, 5, 14, .4], 'egg' => [155, 13, 1.1, 11],
            'spring roll wrapper' => [290, 8, 58, 3], 'fish sauce' => [35, 5, 3.6, 0], 'chili' => [40, 1.9, 8.8, .4], 'bay leaf' => [313, 7.6, 75, 8.4],
            'black pepper' => [251, 10, 64, 3.3], 'cooking oil' => [884, 0, 0, 100], 'cabbage' => [25, 1.3, 5.8, .1], 'lemongrass' => [99, 1.8, 25, .5],
            'cilantro' => [23, 2.1, 3.7, .5],
            'spring onion' => [32, 1.8, 7.3, .2],
        ];
        $models = [];
        foreach ($facts as $name => [$calories, $protein, $carbs, $fat]) {
            $ingredient = Ingredient::updateOrCreate(['slug' => Str::slug($name)], ['canonical_name' => Str::title($name), 'category' => $this->category($name), 'allergens' => in_array($name, ['soy sauce', 'peanut butter', 'fish sauce']) ? [$name === 'peanut butter' ? 'peanut' : ($name === 'soy sauce' ? 'soy' : 'fish')] : [], 'dietary_tags' => []]);
            IngredientAlias::updateOrCreate(['normalized_alias' => $name, 'locale' => null], ['ingredient_id' => $ingredient->id, 'alias' => $name, 'match_status' => 'confirmed']);
            $ingredient->nutritionRecords()->updateOrCreate(['provider' => 'wevie', 'external_id' => 'curated-'.Str::slug($name)], ['basis_quantity' => 100, 'basis_unit' => 'g', 'nutrients' => compact('calories', 'protein', 'carbs', 'fat') + ['carbohydrates' => $carbs, 'fiber' => 0, 'sugar' => 0, 'sodium' => 0], 'confidence' => 'medium', 'calculation_version' => 'curated-reference-v1', 'retrieved_at' => now()]);
            DB::table('country_ingredients')->updateOrInsert(['ingredient_id' => $ingredient->id, 'country_code' => 'PH', 'region_id' => null], ['availability' => 'common', 'affordability' => 'moderate', 'likely_store_types' => json_encode(['wet_market', 'supermarket', 'neighborhood_grocery']), 'confidence' => 'high', 'created_at' => now(), 'updated_at' => now()]);
            DB::table('ingredient_package_sizes')->updateOrInsert(['ingredient_id' => $ingredient->id, 'country_code' => 'PH', 'region_id' => null, 'quantity' => $this->category($name) === 'protein' ? 500 : 250, 'unit' => 'g'], ['label' => $this->category($name) === 'protein' ? '500 g pack' : '250 g pack', 'created_at' => now(), 'updated_at' => now()]);
            $models[$name] = $ingredient;
        }
        $this->seedAliases($models);

        return $models;
    }

    private function seedAliases(array $ingredients): void
    {
        foreach (['scallion', 'spring onion', 'green onion'] as $alias) {
            IngredientAlias::updateOrCreate(['normalized_alias' => $alias, 'locale' => null], ['ingredient_id' => $ingredients['spring onion']->id, 'alias' => $alias, 'match_status' => 'confirmed']);
        }
        foreach (['cilantro', 'coriander leaves', 'wansoy'] as $alias) {
            IngredientAlias::updateOrCreate(['normalized_alias' => $alias, 'locale' => null], ['ingredient_id' => $ingredients['cilantro']->id, 'alias' => $alias, 'match_status' => 'confirmed']);
        }
        DB::table('ingredient_localizations')->updateOrInsert(['ingredient_id' => $ingredients['cilantro']->id, 'country_code' => 'PH', 'locale' => 'fil-PH'], ['display_name' => 'Wansoy', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('ingredient_localizations')->updateOrInsert(['ingredient_id' => $ingredients['spring onion']->id, 'country_code' => 'PH', 'locale' => 'en-PH'], ['display_name' => 'Spring Onion', 'created_at' => now(), 'updated_at' => now()]);
    }

    private function seedSubstitutions(array $ingredients): void
    {
        $rows = [
            ['green papaya', 'chayote', 1, ['soup', 'tinola'], 'Milder and slightly less sweet.', 'Similar tender-crisp texture.', 'high', false],
            ['water spinach', 'bok choy', 1, ['soup', 'stew'], 'Milder leafy flavor.', 'Crisper stems.', 'high', false],
            ['yardlong beans', 'green peas', .75, ['stew'], 'Sweeter flavor and more carbohydrate.', 'Smaller and softer.', 'medium', true],
        ];
        foreach ($rows as [$from, $to, $ratio, $suitable, $flavor, $texture, $confidence, $confirmation]) {
            DB::table('ingredient_substitutions')->updateOrInsert(['ingredient_id' => $ingredients[$from]->id, 'substitute_ingredient_id' => $ingredients[$to]->id, 'country_code' => 'PH', 'region_id' => null], ['ratio' => $ratio, 'ratio_unit' => 'weight', 'suitable_for' => json_encode($suitable), 'dietary_implications' => json_encode([]), 'nutrition_difference' => json_encode(['review_local_nutrition' => true]), 'flavor_difference' => $flavor, 'texture_difference' => $texture, 'confidence' => $confidence, 'requires_confirmation' => $confirmation, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    private function category(string $name): string
    {
        if (in_array($name, ['chicken', 'pork', 'beef', 'egg'])) {
            return 'protein';
        }
        if (in_array($name, ['rice', 'mung beans', 'spring roll wrapper'])) {
            return 'grains_and_starches';
        }
        if (in_array($name, ['soy sauce', 'vinegar', 'fish sauce', 'cooking oil', 'peanut butter'])) {
            return 'pantry';
        }

        return 'produce';
    }

    private function recipes(): array
    {
        $i = fn (...$items) => $items;

        return [
            ['name' => 'Chicken Adobo', 'description' => 'Chicken gently braised in vinegar, soy, garlic, and bay leaf.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 40, 'allergens' => ['soy'], 'tags' => [], 'variation' => 'Use coconut milk for adobo sa gata.', 'ingredients' => $i(['chicken', 900, false], ['soy sauce', 80, false], ['vinegar', 100, false], ['garlic', 35, false], ['bay leaf', 2, false], ['black pepper', 3, false]), 'steps' => ['Brown the chicken lightly in a covered pot, then add garlic and pepper.', 'Add soy sauce, vinegar, bay leaf, and a little water; simmer covered, then reduce until glossy and the chicken is cooked through.']],
            ['name' => 'Pork Adobo', 'description' => 'Pork braised until tender in the classic vinegar-soy base.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 55, 'allergens' => ['soy'], 'tags' => [], 'variation' => 'Batangas-style may omit soy and emphasize vinegar.', 'ingredients' => $i(['pork', 900, false], ['soy sauce', 80, false], ['vinegar', 100, false], ['garlic', 35, false], ['bay leaf', 2, false], ['black pepper', 3, false]), 'steps' => ['Sear the pork in batches and soften the garlic in the rendered fat.', 'Pour in soy sauce, vinegar, bay leaf, and water; cover until tender, then uncover to reduce.']],
            ['name' => 'Sinigang', 'description' => 'A bright tamarind broth with pork and market vegetables.', 'category' => 'soup', 'meal_types' => ['lunch', 'dinner'], 'prep' => 20, 'cook' => 55, 'allergens' => ['fish'], 'tags' => [], 'variation' => 'Use shrimp, fish, or beef and adjust the local souring fruit.', 'ingredients' => $i(['pork', 700, false], ['tamarind', 120, false], ['tomato', 180, false], ['onion', 120, false], ['water spinach', 180, false], ['yardlong beans', 150, false], ['fish sauce', 30, true]), 'steps' => ['Simmer pork with onion and tomato, skimming the broth, until nearly tender.', 'Add tamarind, beans, and then water spinach; season gently and stop cooking while the greens are bright.']],
            ['name' => 'Tinola', 'description' => 'Ginger chicken soup with green papaya and leafy vegetables.', 'category' => 'soup', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 40, 'allergens' => ['fish'], 'tags' => [], 'variation' => 'Substitute chayote for green papaya.', 'ingredients' => $i(['chicken', 800, false], ['ginger', 45, false], ['onion', 100, false], ['garlic', 25, false], ['green papaya', 400, false], ['water spinach', 150, false], ['fish sauce', 25, true]), 'steps' => ['Sauté ginger, onion, and garlic; add chicken and cook until no longer pink outside.', 'Add water and simmer until tender, then cook papaya and fold in greens just before serving.']],
            ['name' => 'Kare-Kare', 'description' => 'Beef and vegetables in a savory peanut sauce.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 25, 'cook' => 100, 'allergens' => ['peanut'], 'tags' => [], 'variation' => 'Use oxtail, tripe, beef shank, or a vegetable-only mix.', 'ingredients' => $i(['beef', 800, false], ['peanut butter', 180, false], ['eggplant', 250, false], ['yardlong beans', 180, false], ['bok choy', 180, false], ['onion', 100, false]), 'steps' => ['Simmer beef until very tender and reserve its cooking broth.', 'Build a smooth peanut sauce with the broth, then gently cook the vegetables and return the beef to warm through.']],
            ['name' => 'Bicol Express', 'description' => 'Pork simmered in coconut milk with chili.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 45, 'allergens' => ['fish'], 'tags' => [], 'variation' => 'Adjust chili heat by region and household.', 'ingredients' => $i(['pork', 700, false], ['coconut milk', 500, false], ['chili', 40, false], ['garlic', 25, false], ['onion', 100, false], ['fish sauce', 20, true]), 'steps' => ['Sauté pork with onion and garlic until lightly browned.', 'Add coconut milk and simmer gently until thick; add chili near the end and season to taste.']],
            ['name' => 'Ginisang Monggo', 'description' => 'Mung beans stewed with tomato and leafy greens.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 55, 'allergens' => ['fish'], 'tags' => ['dairy_free'], 'variation' => 'Add squash, pork, shrimp, or smoked fish when desired.', 'ingredients' => $i(['mung beans', 300, false], ['tomato', 180, false], ['onion', 100, false], ['garlic', 25, false], ['water spinach', 180, false], ['fish sauce', 20, true]), 'steps' => ['Simmer mung beans in fresh water until soft.', 'Sauté tomato, onion, and garlic, combine with the beans, then fold in greens and season.']],
            ['name' => 'Tortang Talong', 'description' => 'Charred eggplant folded into a simple egg omelet.', 'category' => 'main', 'meal_types' => ['breakfast', 'lunch', 'dinner'], 'prep' => 15, 'cook' => 20, 'allergens' => ['egg'], 'tags' => ['vegetarian'], 'variation' => 'Add chopped tomato or cooked minced meat as a household variation.', 'ingredients' => $i(['eggplant', 500, false], ['egg', 200, false], ['onion', 50, true], ['cooking oil', 25, false]), 'steps' => ['Char the eggplants until soft, cool slightly, peel, and flatten while keeping the stem.', 'Dip each eggplant in beaten egg and pan-cook on both sides until set and golden.']],
            ['name' => 'Ginataang Kalabasa', 'description' => 'Squash and long beans gently cooked in coconut milk.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 15, 'cook' => 30, 'allergens' => [], 'tags' => ['vegetarian', 'dairy_free'], 'variation' => 'Add shrimp or tofu, or combine squash with sitaw.', 'ingredients' => $i(['squash', 600, false], ['yardlong beans', 200, false], ['coconut milk', 500, false], ['ginger', 20, false], ['onion', 80, false], ['chili', 10, true]), 'steps' => ['Soften onion and ginger, then add coconut milk and bring to a gentle simmer.', 'Cook squash until nearly tender, add beans, and simmer just until the vegetables are done.']],
            ['name' => 'Pinakbet', 'description' => 'A northern Filipino vegetable medley cooked until just tender.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 20, 'cook' => 30, 'allergens' => ['fish'], 'tags' => [], 'variation' => 'Ilocano versions commonly use bagoong isda; other regions may use shrimp paste.', 'ingredients' => $i(['bitter melon', 200, false], ['eggplant', 250, false], ['okra', 180, false], ['squash', 300, false], ['tomato', 150, false], ['fish sauce', 20, true]), 'steps' => ['Layer tomato and the firmer vegetables in a wide pot with a small amount of water.', 'Cover and steam-braise, adding quick-cooking vegetables last; turn gently so the pieces stay intact.']],
            ['name' => 'Lumpiang Shanghai', 'description' => 'Crisp small spring rolls filled with seasoned pork and vegetables.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner', 'snack'], 'prep' => 35, 'cook' => 25, 'allergens' => ['egg'], 'tags' => [], 'variation' => 'Use chicken, fish, or a vegetable filling.', 'ingredients' => $i(['pork', 500, false], ['carrot', 120, false], ['onion', 80, false], ['egg', 50, false], ['spring roll wrapper', 300, false], ['cooking oil', 300, false]), 'steps' => ['Mix pork, finely cut vegetables, and egg, then cook a teaspoon of filling to check seasoning.', 'Roll in small tight wrappers and fry in batches until crisp and the center reaches a safe temperature.']],
            ['name' => 'Chicken Afritada', 'description' => 'Chicken and vegetables in a bright tomato stew.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 20, 'cook' => 45, 'allergens' => [], 'tags' => [], 'variation' => 'Pork afritada follows the same tomato-based method.', 'ingredients' => $i(['chicken', 800, false], ['tomato', 350, false], ['potato', 300, false], ['carrot', 180, false], ['bell pepper', 160, false], ['green peas', 100, true]), 'steps' => ['Brown chicken, then sauté onion, garlic, and tomato until saucy.', 'Simmer chicken until almost tender; add potato, carrot, pepper, and peas in order of cooking time.']],
            ['name' => 'Pork Menudo', 'description' => 'Small-cut pork, potato, and carrot in tomato sauce.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 25, 'cook' => 55, 'allergens' => ['soy'], 'tags' => [], 'variation' => 'Households may add liver, raisins, chickpeas, or hotdog.', 'ingredients' => $i(['pork', 700, false], ['tomato', 350, false], ['potato', 300, false], ['carrot', 180, false], ['bell pepper', 150, false], ['soy sauce', 40, false]), 'steps' => ['Marinate pork briefly in soy, then brown it with onion and garlic.', 'Add tomato and water; simmer until tender, then cook potato, carrot, and pepper until just done.']],
            ['name' => 'Beef Caldereta', 'description' => 'A rich tomato beef stew with potato, carrot, and pepper.', 'category' => 'main', 'meal_types' => ['lunch', 'dinner'], 'prep' => 25, 'cook' => 110, 'allergens' => [], 'tags' => [], 'variation' => 'Goat is traditional in some areas; chili and richness vary by household.', 'ingredients' => $i(['beef', 850, false], ['tomato', 350, false], ['potato', 300, false], ['carrot', 180, false], ['bell pepper', 160, false], ['chili', 10, true]), 'steps' => ['Brown beef and soften the onion and garlic, then add tomato and enough water to braise.', 'Cook slowly until tender; add potato and carrot, then pepper and chili near the end.']],
            ['name' => 'Arroz Caldo', 'description' => 'Ginger chicken rice porridge made for a comforting shared meal.', 'category' => 'porridge', 'meal_types' => ['breakfast', 'lunch', 'dinner'], 'prep' => 15, 'cook' => 50, 'allergens' => ['fish'], 'tags' => [], 'variation' => 'Use toasted garlic, egg, scallion, and citrus as optional table garnishes.', 'ingredients' => $i(['rice', 300, false], ['chicken', 600, false], ['ginger', 45, false], ['garlic', 30, false], ['onion', 100, false], ['fish sauce', 20, true], ['egg', 200, true]), 'steps' => ['Sauté ginger, garlic, onion, and chicken, then stir in rinsed rice.', 'Add water gradually and simmer, stirring occasionally, until the rice breaks down and the chicken is cooked through.']],
        ];
    }
}
