<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\IngredientAlias;
use App\Modules\MealPlanning\Models\MealProviderRequest;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Requests\ResolveDuplicateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MealPlanningAdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/MealPlanning/Index', [
            'stats' => ['recipes' => Recipe::count(), 'recipes_needing_review' => Recipe::where('needs_review', true)->count(), 'suggested_aliases' => IngredientAlias::where('match_status', 'suggested')->count()],
            'duplicates' => DB::table('recipe_duplicate_candidates')->where('status', 'pending')->latest()->limit(100)->get(),
            'aliases' => IngredientAlias::with('ingredient')->where('match_status', 'suggested')->limit(100)->get(),
            'providerRequests' => MealProviderRequest::latest()->limit(100)->get(),
        ]);
    }

    public function resolveDuplicate(ResolveDuplicateRequest $request, int $candidate)
    {
        $data = $request->validated();
        DB::table('recipe_duplicate_candidates')->where('id', $candidate)->update(['status' => $data['status'], 'updated_at' => now()]);

        return back();
    }

    public function confirmAlias(Request $request, IngredientAlias $alias)
    {
        $alias->update(['match_status' => 'confirmed']);

        return back();
    }

    public function resetProvider(Request $request, string $provider)
    {
        Cache::forget('meal-provider-circuit:'.$provider);
        Cache::forget('meal-provider-failures:'.$provider);

        return back();
    }
}
