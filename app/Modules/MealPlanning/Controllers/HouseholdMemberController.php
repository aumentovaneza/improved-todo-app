<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Requests\HouseholdMemberRequest;
use App\Modules\MealPlanning\Resources\HouseholdMemberResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\NutritionTargetCalculator;
use Illuminate\Http\Request;

class HouseholdMemberController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private NutritionTargetCalculator $targets) {}

    public function store(HouseholdMemberRequest $request, Household $household)
    {
        $this->access->ensureAdministrator($household, $request->user());
        $member = $household->members()->create($request->validated());

        return HouseholdMemberResource::make($member)->response()->setStatusCode(201);
    }

    public function update(HouseholdMemberRequest $request, Household $household, HouseholdMember $member)
    {
        $this->guard($household, $member);
        $this->access->ensureAdministrator($household, $request->user());
        $member->update($request->validated());

        return HouseholdMemberResource::make($member->fresh());
    }

    public function destroy(Request $request, Household $household, HouseholdMember $member)
    {
        $this->guard($household, $member);
        $this->access->ensureAdministrator($household, $request->user());
        abort_if($member->role === 'owner', 409, 'The household owner cannot be removed.');
        $member->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function targets(Request $request, Household $household, HouseholdMember $member)
    {
        $this->guard($household, $member);
        $this->access->ensureMember($household, $request->user());

        return response()->json(['data' => $this->targets->calculate($member)]);
    }

    private function guard(Household $household, HouseholdMember $member): void
    {
        abort_unless($member->household_id === $household->id, 404);
    }
}
