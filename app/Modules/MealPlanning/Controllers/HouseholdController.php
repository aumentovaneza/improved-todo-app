<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Requests\HouseholdRequest;
use App\Modules\MealPlanning\Resources\HouseholdResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HouseholdController extends Controller
{
    public function __construct(private HouseholdAccessService $access) {}

    public function index(Request $request)
    {
        return HouseholdResource::collection(Household::with('members')->whereHas('members', fn ($q) => $q->where('user_id', $request->user()->id))->get());
    }

    public function store(HouseholdRequest $request)
    {
        $household = DB::transaction(function () use ($request) {
            $household = Household::create(['owner_user_id' => $request->user()->id, 'country_code' => 'PH', 'timezone' => $request->user()->timezone ?? 'Asia/Manila', 'currency' => 'PHP', ...$request->validated()]);
            $household->members()->create(['user_id' => $request->user()->id, 'name' => $request->user()->name, 'role' => 'owner', 'classification' => 'adult']);

            return $household;
        });

        return HouseholdResource::make($household->load('members'))->response()->setStatusCode(201);
    }

    public function show(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());

        return HouseholdResource::make($household->load('members'));
    }

    public function update(HouseholdRequest $request, Household $household)
    {
        $this->access->ensureAdministrator($household, $request->user());
        $household->update($request->validated());

        return HouseholdResource::make($household->fresh('members'));
    }

    public function destroy(Request $request, Household $household)
    {
        $this->access->ensureAdministrator($household, $request->user());
        $household->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
