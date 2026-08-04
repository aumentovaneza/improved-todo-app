<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\MealPlanItem;
use App\Modules\MealPlanning\Requests\DiaryEntryRequest;
use App\Modules\MealPlanning\Requests\MarkMealAsPlannedRequest;
use App\Modules\MealPlanning\Requests\NutritionSummaryRequest;
use App\Modules\MealPlanning\Resources\MealDiaryEntryResource;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\MealDiaryService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MealDiaryController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private MealDiaryService $diary) {}

    public function index(Request $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $query = MealDiaryEntry::with(['member', 'items'])->where('household_id', $household->id);
        if ($request->filled('member_id')) {
            $query->where('household_member_id', $request->integer('member_id'));
        } if ($request->filled('date')) {
            $query->whereDate('consumed_at', $request->date('date'));
        }

        return MealDiaryEntryResource::collection($query->orderByDesc('consumed_at')->paginate(50));
    }

    public function store(DiaryEntryRequest $request, Household $household)
    {
        $member = HouseholdMember::where('household_id', $household->id)->findOrFail($request->integer('household_member_id'));
        $this->access->ensureDiaryAccess($member, $request->user());
        if ($request->filled('meal_plan_item_id')) {
            abort_unless(MealPlanItem::whereKey($request->integer('meal_plan_item_id'))->whereHas('mealPlan', fn ($query) => $query->where('household_id', $household->id))->exists(), 404);
        }

        return MealDiaryEntryResource::make($this->diary->create(['household_id' => $household->id, ...$request->validated()], $request->user()->id))->response()->setStatusCode(201);
    }

    public function update(DiaryEntryRequest $request, Household $household, MealDiaryEntry $entry)
    {
        $this->guard($household, $entry);
        $this->access->ensureDiaryAccess($entry->member, $request->user());
        if ($request->filled('household_member_id')) {
            $member = HouseholdMember::where('household_id', $household->id)->findOrFail($request->integer('household_member_id'));
            $this->access->ensureDiaryAccess($member, $request->user());
        }
        if ($request->filled('meal_plan_item_id')) {
            abort_unless(MealPlanItem::whereKey($request->integer('meal_plan_item_id'))->whereHas('mealPlan', fn ($query) => $query->where('household_id', $household->id))->exists(), 404);
        }

        return MealDiaryEntryResource::make($this->diary->update($entry, $request->validated(), $request->user()->id));
    }

    public function destroy(Request $request, Household $household, MealDiaryEntry $entry)
    {
        $this->guard($household, $entry);
        $this->access->ensureDiaryAccess($entry->member, $request->user());
        $entry->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function restore(Request $request, Household $household, int $entry)
    {
        $model = MealDiaryEntry::withTrashed()->where('household_id', $household->id)->findOrFail($entry);
        $this->access->ensureDiaryAccess($model->member, $request->user());
        $model->restore();

        return MealDiaryEntryResource::make($model->fresh(['member', 'items']));
    }

    public function markAsPlanned(MarkMealAsPlannedRequest $request, Household $household, MealPlanItem $item)
    {
        $this->access->ensureMember($household, $request->user());
        abort_unless($item->mealPlan->household_id === $household->id, 404);
        $validated = $request->validated();
        $member = HouseholdMember::where('household_id', $household->id)->findOrFail($validated['household_member_id']);
        $this->access->ensureDiaryAccess($member, $request->user());

        return MealDiaryEntryResource::make($this->diary->markAsPlanned($item, $member, $request->user()->id, isset($validated['consumed_at']) ? Carbon::parse($validated['consumed_at']) : null))->response()->setStatusCode(201);
    }

    public function summary(NutritionSummaryRequest $request, Household $household, HouseholdMember $member)
    {
        abort_unless($member->household_id === $household->id, 404);
        $this->access->ensureDiaryAccess($member, $request->user());
        $validated = $request->validated();
        $start = Carbon::parse($validated['date'], $household->timezone)->startOfDay();
        $end = ($validated['range'] ?? 'day') === 'week' ? $start->copy()->endOfWeek() : $start->copy()->endOfDay();

        return response()->json(['data' => $this->diary->summary($member, $start->utc(), $end->utc())]);
    }

    private function guard(Household $h, MealDiaryEntry $e): void
    {
        abort_unless($e->household_id === $h->id, 404);
    }
}
