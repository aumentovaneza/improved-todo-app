<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Jobs\GenerateMealPlanJob;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Requests\GenerateMealPlanRequest;
use App\Modules\MealPlanning\Requests\MealPlanRequest;
use App\Modules\MealPlanning\Resources\MealPlanResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\ShoppingListBuilder;
use Illuminate\Http\Request;

class MealPlanController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private ShoppingListBuilder $shopping) {}

    public function index(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());

        return MealPlanResource::collection($household->mealPlans()->latest('start_date')->paginate(20));
    }

    public function store(MealPlanRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $data = $request->validated();
        $data['settings'] = array_merge($household->settings ?? [], $data['settings'] ?? []);
        $data['priority_profile'] = $data['priority_profile'] ?? data_get($household->settings, 'priority_profile', 'balanced');
        $plan = $household->mealPlans()->create(['created_by_user_id' => $request->user()->id, 'status' => 'draft', ...$data]);

        return MealPlanResource::make($plan)->response()->setStatusCode(201);
    }

    public function show(Request $request, Household $household, MealPlan $mealPlan)
    {
        $this->guard($household, $mealPlan);
        $this->access->ensureMember($household, $request->user());

        return MealPlanResource::make($this->full($mealPlan));
    }

    public function update(MealPlanRequest $request, Household $household, MealPlan $mealPlan)
    {
        $this->guard($household, $mealPlan);
        $this->access->ensureMember($household, $request->user());
        $mealPlan->update($request->validated());

        return MealPlanResource::make($this->full($mealPlan));
    }

    public function generate(GenerateMealPlanRequest $request, Household $household, MealPlan $mealPlan)
    {
        return $this->dispatch($request, $household, $mealPlan, $request->safe()->only(['reset_overrides']));
    }

    public function regenerate(GenerateMealPlanRequest $request, Household $household, MealPlan $mealPlan)
    {
        return $this->dispatch($request, $household, $mealPlan, $request->safe()->only(['date', 'meal_slot', 'reset_overrides']));
    }

    public function regenerateDay(GenerateMealPlanRequest $request, Household $household, MealPlan $mealPlan, string $date)
    {
        return $this->dispatch($request, $household, $mealPlan, ['date' => $date, ...$request->safe()->only(['reset_overrides'])]);
    }

    public function rebuildShopping(Request $request, Household $household, MealPlan $mealPlan)
    {
        $this->guard($household, $mealPlan);
        $this->access->ensureMember($household, $request->user());
        $list = $this->shopping->build($mealPlan->fresh());

        return response()->json(['data' => $list->load('items.ingredient')]);
    }

    private function dispatch(GenerateMealPlanRequest $request, Household $household, MealPlan $mealPlan, array $scope)
    {
        $this->guard($household, $mealPlan);
        $this->access->ensureMember($household, $request->user());
        $settings = $mealPlan->settings ?? [];
        $key = $request->validated('idempotency_key');
        if ($mealPlan->status === 'generating' || ($settings['last_generation_idempotency_key'] ?? null) === $key) {
            return response()->json(['data' => MealPlanResource::make($mealPlan)->resolve(), 'meta' => ['duplicate' => true]], 202);
        }
        $settings['last_generation_idempotency_key'] = $key;
        $mealPlan->update(['status' => 'generating', 'settings' => $settings, 'generation_seed' => $mealPlan->generation_seed ?: hash('sha256', $key)]);
        GenerateMealPlanJob::dispatch($mealPlan->id, $scope);

        return MealPlanResource::make($mealPlan->fresh())->response()->setStatusCode(202);
    }

    private function guard(Household $h, MealPlan $p): void
    {
        abort_unless($p->household_id === $h->id, 404);
    }

    private function full(MealPlan $p): MealPlan
    {
        return $p->fresh(['household.members', 'items.recipeVersion.recipe', 'items.portions.member', 'shoppingLists.items']);
    }
}
