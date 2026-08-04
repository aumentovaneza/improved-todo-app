<?php

namespace App\Modules\MealPlanning\Jobs;

use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Services\MealPlanGenerator;
use App\Modules\MealPlanning\Services\RecipeAcquisitionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class GenerateMealPlanJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [1, 2, 4];

    public function __construct(public int $mealPlanId, public array $scope = []) {}

    public function handle(MealPlanGenerator $generator, RecipeAcquisitionService $acquisition): void
    {
        $plan = MealPlan::findOrFail($this->mealPlanId);
        $acquisition->ensureCandidatePool($plan);
        $generator->generate($plan, $this->scope);
    }

    public function failed(Throwable $exception): void
    {
        MealPlan::whereKey($this->mealPlanId)->update(['status' => 'failed', 'failure_message' => $exception->getMessage()]);
    }
}
