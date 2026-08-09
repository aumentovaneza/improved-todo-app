<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\Ingredient;
use App\Modules\MealPlanning\Models\MealCalendarEvent;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Resources\HouseholdResource;
use App\Modules\MealPlanning\Resources\MealDiaryEntryResource;
use App\Modules\MealPlanning\Resources\MealPlanResource;
use App\Modules\MealPlanning\Resources\PantryItemResource;
use App\Modules\MealPlanning\Resources\RecipeResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MealPlanningPageController extends Controller
{
    public function __construct(private HouseholdAccessService $access) {}

    public function index(Request $request): Response
    {
        $households = Household::with('members')->whereHas('members', fn ($q) => $q->where('user_id', $request->user()->id))->get();
        $countries = DB::table('countries')->orderBy('name')->get(['code', 'name', 'currency']);

        return Inertia::render('MealPlanning/Index', [
            'households' => HouseholdResource::collection($households)->resolve(),
            'countries' => $countries,
            'userTimezone' => $request->user()->timezone,
        ]);
    }

    public function planner(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());
        $household->load('members');
        $plan = $household->mealPlans()->with(['items.recipeVersion.recipe', 'items.portions.member', 'shoppingLists.items'])->latest('start_date')->first();

        return $this->page('Planner', $household, ['plan' => $plan ? MealPlanResource::make($plan)->resolve() : null]);
    }

    public function recipes(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());

        return $this->page('Recipes', $household, ['recipes' => RecipeResource::collection(Recipe::availableTo($household->id)->with(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition', 'sources'])->limit(100)->get())->resolve()]);
    }

    public function pantry(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());

        return $this->page('Pantry', $household, ['pantryItems' => PantryItemResource::collection($household->pantryItems()->with('ingredient')->orderBy('expires_on')->get())->resolve(), 'ingredients' => Ingredient::orderBy('canonical_name')->limit(500)->get(['id', 'canonical_name', 'category'])]);
    }

    public function members(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());

        return $this->page('Members', $household);
    }

    public function preferences(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());

        return $this->page('Preferences', $household);
    }

    public function calendar(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());
        $events = MealCalendarEvent::where('household_id', $household->id)->orderBy('starts_at')->limit(200)->get();

        return $this->page('Calendar', $household, ['events' => $events]);
    }

    public function grocery(Request $request, Household $household): Response
    {
        $this->access->ensureMember($household, $request->user());
        $list = $household->mealPlans()->latest('start_date')->first()?->shoppingLists()->with('items.ingredient')->latest()->first();

        return $this->page('GroceryList', $household, ['shoppingList' => $list]);
    }

    public function diary(Request $request, Household $household): Response
    {
        $actor = $this->access->ensureMember($household, $request->user());
        $query = MealDiaryEntry::with(['member', 'items'])->where('household_id', $household->id)->whereDate('consumed_at', $request->get('date', now($household->timezone)->toDateString()));
        if ($request->filled('member_id')) {
            $member = HouseholdMember::where('household_id', $household->id)->findOrFail($request->integer('member_id'));
            $this->access->ensureDiaryAccess($member, $request->user());
            $query->where('household_member_id', $member->id);
        } elseif (! $actor->canAdminister()) {
            $query->where('household_member_id', $actor->id);
        }
        $entries = $query->orderBy('consumed_at')->get();

        return $this->page('Diary', $household, ['entries' => MealDiaryEntryResource::collection($entries)->resolve(), 'date' => $request->get('date', now($household->timezone)->toDateString())]);
    }

    private function page(string $name, Household $household, array $extra = []): Response
    {
        return Inertia::render('MealPlanning/'.$name, ['household' => HouseholdResource::make($household->loadMissing('members'))->resolve(), ...$extra]);
    }
}
