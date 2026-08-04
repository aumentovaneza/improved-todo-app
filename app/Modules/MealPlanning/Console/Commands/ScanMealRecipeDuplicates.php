<?php

namespace App\Modules\MealPlanning\Console\Commands;

use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Services\RecipeDuplicateDetector;
use Illuminate\Console\Command;

class ScanMealRecipeDuplicates extends Command
{
    protected $signature = 'meal-planning:scan-duplicates';

    protected $description = 'Flag possible duplicate recipes for administrative review';

    public function handle(RecipeDuplicateDetector $duplicates): int
    {
        Recipe::with('latestVersion.ingredients', 'latestVersion.steps')->each(fn ($recipe) => $duplicates->flag($recipe));
        $this->info('Duplicate scan complete.');

        return self::SUCCESS;
    }
}
