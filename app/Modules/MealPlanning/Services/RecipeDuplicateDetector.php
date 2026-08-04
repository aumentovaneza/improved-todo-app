<?php

namespace App\Modules\MealPlanning\Services;

use App\Modules\MealPlanning\Models\Recipe;
use Illuminate\Support\Facades\DB;

class RecipeDuplicateDetector
{
    public function flag(Recipe $recipe): void
    {
        $recipe->loadMissing('latestVersion.ingredients', 'latestVersion.steps');
        Recipe::query()->whereKeyNot($recipe->id)->where('normalized_name', $recipe->normalized_name)
            ->with('latestVersion.ingredients', 'latestVersion.steps')->each(function (Recipe $candidate) use ($recipe) {
                $ingredient = $this->jaccard($recipe->latestVersion?->ingredients->pluck('ingredient_id')->filter()->all() ?? [], $candidate->latestVersion?->ingredients->pluck('ingredient_id')->filter()->all() ?? []);
                $instructions = $this->textSimilarity($recipe->latestVersion?->steps->pluck('instruction')->implode(' ') ?? '', $candidate->latestVersion?->steps->pluck('instruction')->implode(' ') ?? '');
                if ($ingredient >= .85 || ($instructions >= .90 && $recipe->cuisine === $candidate->cuisine)) {
                    DB::table('recipe_duplicate_candidates')->updateOrInsert(
                        ['recipe_id' => $recipe->id, 'candidate_recipe_id' => $candidate->id],
                        ['name_similarity' => 1, 'ingredient_similarity' => $ingredient, 'instruction_similarity' => $instructions, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]
                    );
                    $recipe->update(['needs_review' => true]);
                }
            });
    }

    private function jaccard(array $a, array $b): float
    {
        $a = array_unique($a);
        $b = array_unique($b);
        $union = array_unique(array_merge($a, $b));

        return count($union) ? count(array_intersect($a, $b)) / count($union) : 0;
    }

    private function textSimilarity(string $a, string $b): float
    {
        similar_text(strtolower($a), strtolower($b), $percent);

        return $percent / 100;
    }
}
