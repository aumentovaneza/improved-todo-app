<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Requests\RegionalPriceRequest;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegionalPriceController extends Controller
{
    public function __construct(private HouseholdAccessService $access) {}

    public function index(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());

        return response()->json(['data' => DB::table('regional_ingredient_prices')->where('household_id', $household->id)->orderByDesc('effective_on')->get()]);
    }

    public function store(RegionalPriceRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $id = DB::table('regional_ingredient_prices')->insertGetId(['household_id' => $household->id, 'ingredient_id' => $request->integer('ingredient_id'), 'country_code' => $household->country_code, 'region_id' => $household->region_id, 'quantity' => $request->float('quantity'), 'unit' => $request->validated('unit'), 'price' => $request->float('price'), 'currency' => $household->currency, 'confidence' => 'high', 'source' => 'household', 'effective_on' => $request->validated('effective_on'), 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['data' => DB::table('regional_ingredient_prices')->find($id)], 201);
    }

    public function destroy(Request $request, Household $household, int $price)
    {
        $this->access->ensureAdministrator($household, $request->user());
        DB::table('regional_ingredient_prices')->where('household_id', $household->id)->where('id', $price)->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
