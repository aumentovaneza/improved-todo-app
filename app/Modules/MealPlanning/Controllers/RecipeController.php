<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Data\ExternalRecipeData;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Jobs\ImportRecipeJob;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Requests\ProviderLookupRequest;
use App\Modules\MealPlanning\Requests\RecipeRequest;
use App\Modules\MealPlanning\Resources\RecipeResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\ProviderImportService;
use App\Modules\MealPlanning\Services\ProviderRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RecipeController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private ProviderRegistry $providers, private ProviderImportService $imports) {}

    public function index(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $query = Recipe::availableTo($household->id)->with(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition', 'sources']);
        if ($request->filled('query')) {
            $query->where('name', 'like', '%'.$request->string('query').'%');
        }

        return RecipeResource::collection($query->paginate(30));
    }

    public function store(RecipeRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $data = $this->manualData($request->validated(), (string) Str::uuid());

        return RecipeResource::make($this->imports->importRecipe($data, $household->id, $request->user()->id))->response()->setStatusCode(201);
    }

    public function show(Request $request, Household $household, Recipe $recipe)
    {
        $this->access->ensureMember($household, $request->user());
        $this->guardAvailable($household, $recipe);

        return RecipeResource::make($recipe->load(['latestVersion.ingredients.ingredient', 'latestVersion.steps', 'latestVersion.latestNutrition', 'sources']));
    }

    public function update(RecipeRequest $request, Household $household, Recipe $recipe)
    {
        $this->access->ensureMember($household, $request->user());
        $this->guardOwned($household, $recipe);
        $source = $recipe->sources()->where('provider', 'manual')->firstOrFail();
        $updated = $this->imports->importRecipe($this->manualData($request->validated(), $source->external_id), $household->id, $request->user()->id);

        return RecipeResource::make($updated);
    }

    public function destroy(Request $request, Household $household, Recipe $recipe)
    {
        $this->access->ensureMember($household, $request->user());
        $this->guardOwned($household, $recipe);
        $recipe->delete();

        return response()->noContent();
    }

    public function searchProvider(ProviderLookupRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $provider = $this->providers->recipe($request->validated('provider', 'themealdb'));
        $result = $provider->search(new RecipeSearchCriteria(query: $request->validated('query'), mealType: $request->validated('meal_type'), limit: (int) ($request->validated('limit') ?? 20)));
        $recipes = collect($result->recipes)->map(fn (ExternalRecipeData $recipe) => ['provider' => $recipe->provider, 'externalId' => $recipe->externalId, 'name' => $recipe->name, 'description' => $recipe->description, 'cuisine' => $recipe->cuisine, 'category' => $recipe->category, 'mealTypes' => $recipe->mealTypes, 'imageUrl' => $recipe->imageUrl, 'sourceUrl' => $recipe->sourceUrl, 'attribution' => $recipe->attribution]);

        return response()->json(['data' => $recipes, 'meta' => ['provider' => $provider->name(), 'from_cache' => $result->fromCache]]);
    }

    public function import(ProviderLookupRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $provider = $this->providers->recipe($request->validated('provider', 'themealdb'));
        abort_unless($provider->enabled(), 503, 'The requested provider is unavailable and no local record matched.');
        $key = $request->validated('idempotency_key');
        $duplicate = ! cache()->add('meal-import-idempotency:'.$key, true, now()->addDay());
        if (! $duplicate) {
            ImportRecipeJob::dispatch($provider->name(), (string) $request->validated('external_id'), $request->user()->id);
        }

        return response()->json(['data' => ['queued' => true], 'meta' => ['duplicate' => $duplicate]], 202);
    }

    /** @param array<string, mixed> $values */
    private function manualData(array $values, string $externalId): ExternalRecipeData
    {
        return new ExternalRecipeData(
            'manual',
            $externalId,
            $values['name'],
            $values['description'] ?? null,
            $values['cuisine'] ?? null,
            $values['category'] ?? null,
            $values['meal_types'],
            array_map(fn (array $ingredient): array => [
                'name' => $ingredient['name'],
                'original_text' => trim(($ingredient['quantity'] ?? '').' '.($ingredient['unit'] ?? '').' '.$ingredient['name']),
                'quantity' => $ingredient['quantity'] ?? null,
                'unit' => $ingredient['unit'] ?? null,
            ], $values['ingredients']),
            $values['steps'],
            $values['servings'],
            $values['preparation_minutes'] ?? 0,
            $values['cooking_minutes'] ?? 0,
            $values['equipment'] ?? [],
            $values['allergens'] ?? [],
            $values['dietary_tags'] ?? [],
            $values['nutrition'] ?? null,
            $values['image_url'] ?? null,
            null,
            'Wevie user content',
            'Wevie',
            $values,
        );
    }

    private function guardAvailable(Household $household, Recipe $recipe): void
    {
        abort_unless($recipe->is_active && ($recipe->household_id === null || $recipe->household_id === $household->id), 404);
    }

    private function guardOwned(Household $household, Recipe $recipe): void
    {
        abort_unless($recipe->household_id === $household->id && $recipe->scope === 'household', 404);
    }
}
