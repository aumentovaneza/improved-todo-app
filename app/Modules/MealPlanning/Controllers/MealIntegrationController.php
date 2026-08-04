<?php

namespace App\Modules\MealPlanning\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealCalendarEvent;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\PlannedFoodExpense;
use App\Modules\MealPlanning\Models\ShoppingList;
use App\Modules\MealPlanning\Requests\ExpenseRequest;
use App\Modules\MealPlanning\Requests\MealCalendarEventRequest;
use App\Modules\MealPlanning\Requests\MealPrepTaskRequest;
use App\Modules\MealPlanning\Services\HouseholdAccessService;
use App\Modules\MealPlanning\Services\MealCalendarService;
use App\Modules\MealPlanning\Services\MealExpenseService;
use App\Modules\MealPlanning\Services\MealPrepTaskService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MealIntegrationController extends Controller
{
    public function __construct(private HouseholdAccessService $access, private MealCalendarService $calendar, private MealPrepTaskService $tasks, private MealExpenseService $expenses) {}

    public function syncCalendar(Request $request, Household $household, MealPlan $mealPlan)
    {
        $this->access->ensureMember($household, $request->user());
        abort_unless($mealPlan->household_id === $household->id, 404);
        $this->calendar->syncPlan($mealPlan);

        return response()->json(['data' => ['synced' => true]]);
    }

    public function createTask(MealPrepTaskRequest $request, Household $household, MealCalendarEvent $event)
    {
        $this->access->ensureMember($household, $request->user());
        abort_unless($event->household_id === $household->id, 404);
        $validated = $request->validated();
        $member = HouseholdMember::where('household_id', $household->id)->findOrFail($validated['household_member_id']);

        return response()->json(['data' => $this->tasks->create($event, $member, $request->user()->id, $validated)], 201);
    }

    public function moveEvent(MealCalendarEventRequest $request, Household $household, MealCalendarEvent $event)
    {
        $this->access->ensureMember($household, $request->user());
        abort_unless($event->household_id === $household->id, 404);
        $event->update($request->validated());
        if ($event->type === 'meal' && $event->mealPlanItem) {
            $startsAt = Carbon::parse($event->starts_at);
            $event->mealPlanItem->update(['scheduled_date' => $startsAt->toDateString(), 'scheduled_time' => $startsAt->format('H:i:s'), 'manual_overrides' => array_merge($event->mealPlanItem->manual_overrides ?? [], ['moved_from_calendar' => true])]);
        }

        return response()->json(['data' => $event->fresh()]);
    }

    public function storeExpense(ExpenseRequest $request, Household $household)
    {
        $this->access->ensureMember($household, $request->user());
        $existing = PlannedFoodExpense::where('idempotency_key', $request->validated('idempotency_key'))->first();
        if ($existing) {
            return response()->json(['data' => $existing, 'meta' => ['duplicate' => true]]);
        }
        if ($request->filled('diary_entry_id')) {
            abort_unless(MealDiaryEntry::where('household_id', $household->id)->whereKey($request->integer('diary_entry_id'))->exists(), 404);
        }
        if ($request->filled('meal_plan_id')) {
            abort_unless(MealPlan::where('household_id', $household->id)->whereKey($request->integer('meal_plan_id'))->exists(), 404);
        }
        if ($request->filled('shopping_list_id')) {
            abort_unless(ShoppingList::whereKey($request->integer('shopping_list_id'))->whereHas('mealPlan', fn ($query) => $query->where('household_id', $household->id))->exists(), 404);
        }
        $expense = PlannedFoodExpense::create(['household_id' => $household->id, 'created_by_user_id' => $request->user()->id, 'status' => 'planned', ...$request->safe()->only(['meal_plan_id', 'shopping_list_id', 'diary_entry_id', 'amount', 'currency', 'idempotency_key'])]);

        return response()->json(['data' => $expense], 201);
    }

    public function confirmExpense(ExpenseRequest $request, Household $household, PlannedFoodExpense $expense)
    {
        $this->access->ensureMember($household, $request->user());
        abort_unless($expense->household_id === $household->id, 404);
        abort_if($expense->status === 'confirmed', 409, 'This planned expense was already confirmed.');

        return response()->json(['data' => $this->expenses->confirm($expense, $request->user(), $request->validated())]);
    }
}
