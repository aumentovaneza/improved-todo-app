<?php

use App\Models\Task;
use App\Models\User;
use App\Modules\MealPlanning\Data\RecipeSearchCriteria;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use App\Modules\MealPlanning\Models\MealCalendarEvent;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\MealPlan;
use App\Modules\MealPlanning\Models\PantryItem;
use App\Modules\MealPlanning\Models\Recipe;
use App\Modules\MealPlanning\Providers\OpenFoodFactsProductProvider;
use App\Modules\MealPlanning\Providers\TheMealDbRecipeProvider;
use App\Modules\MealPlanning\Services\MealCalendarService;
use App\Modules\MealPlanning\Services\MealPlanGenerator;
use App\Modules\MealPlanning\Services\NutritionTargetCalculator;
use App\Modules\MealPlanning\Services\PantryAllocationService;
use Carbon\Carbon;
use Database\Seeders\MealPlanningSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

function mealHousehold(User $owner): Household
{
    $household = Household::create(['owner_user_id' => $owner->id, 'country_code' => 'PH', 'name' => 'Test Home', 'timezone' => 'Asia/Manila', 'currency' => 'PHP']);
    $household->members()->create(['user_id' => $owner->id, 'name' => $owner->name, 'role' => 'owner', 'classification' => 'adult']);

    return $household;
}

test('owners create households and members cannot administer dependents', function () {
    $owner = User::factory()->create();
    $response = $this->actingAs($owner)->postJson(route('meal-planning.api.households.store'), ['name' => 'Santos Home', 'country_code' => 'PH', 'timezone' => 'Asia/Manila', 'currency' => 'PHP']);
    $response->assertCreated()->assertJsonPath('data.members.0.role', 'owner');
    $household = Household::findOrFail($response->json('data.id'));
    $memberUser = User::factory()->create();
    $household->members()->create(['user_id' => $memberUser->id, 'name' => $memberUser->name, 'role' => 'member', 'classification' => 'adult']);

    $this->actingAs($memberUser)->postJson(route('meal-planning.api.members.store', $household), ['name' => 'Child', 'classification' => 'child'])->assertForbidden();
    $this->actingAs($owner)->postJson(route('meal-planning.api.members.store', $household), ['name' => 'Child', 'classification' => 'child'])->assertCreated();
});

test('manual recipe updates create immutable versions and only household recipes can be deleted', function () {
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $payload = [
        'name' => 'Family Vegetable Soup',
        'meal_types' => ['dinner'],
        'servings' => 4,
        'ingredients' => [['name' => 'Carrot', 'quantity' => 300, 'unit' => 'g']],
        'steps' => ['Simmer the carrots until tender.'],
    ];

    $created = $this->actingAs($owner)->postJson(route('meal-planning.api.recipes.store', $household), $payload)->assertCreated();
    $recipe = Recipe::findOrFail($created->json('data.id'));
    $this->putJson(route('meal-planning.api.recipes.update', [$household, $recipe]), [...$payload, 'name' => 'Family Carrot Soup'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Family Carrot Soup');

    expect($recipe->versions()->count())->toBe(2);
    $this->deleteJson(route('meal-planning.api.recipes.destroy', [$household, $recipe]))->assertNoContent();
    expect(Recipe::find($recipe->id))->toBeNull()
        ->and(Recipe::withTrashed()->findOrFail($recipe->id)->trashed())->toBeTrue();
});

test('calendar exposes household meal events without duplicating linked preparation tasks', function () {
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $event = MealCalendarEvent::create([
        'household_id' => $household->id,
        'type' => 'preparation',
        'title' => 'Prepare family dinner',
        'starts_at' => '2026-08-10 09:00:00',
        'ends_at' => '2026-08-10 10:00:00',
        'status' => 'planned',
    ]);
    Task::create([
        'user_id' => $owner->id,
        'title' => 'Prepare family dinner',
        'due_date' => '2026-08-10',
        'status' => 'pending',
        'source_type' => 'meal_calendar_event',
        'source_id' => $event->id,
        'meal_household_id' => $household->id,
    ]);

    $this->actingAs($owner)
        ->get(route('calendar.index', [
            'date' => '2026-08-10',
            'start' => '2026-08-10',
            'end' => '2026-08-10',
            'sources' => 'tasks,meals',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Calendar/Index')
            ->has('calendarItems', 1)
            ->where('calendarItems.0.sourceType', 'meal')
            ->where('calendarItems.0.eventId', $event->id));
});

test('private profile data is encrypted while lookup fields remain queryable', function () {
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $member = $household->members()->create(['name' => 'Dependent', 'role' => 'member', 'classification' => 'child', 'birth_date' => '2018-03-01', 'allergies' => ['peanut-secret'], 'dietary_restrictions' => ['vegetarian'], 'professional_source' => 'Private clinician note']);

    $raw = DB::table('household_members')->find($member->id);
    expect($raw->allergies)->not->toContain('peanut-secret')
        ->and($raw->professional_source)->not->toContain('Private clinician note')
        ->and(DB::table('household_members')->where('classification', 'child')->whereDate('birth_date', '2018-03-01')->exists())->toBeTrue()
        ->and($member->fresh()->allergies)->toBe(['peanut-secret']);
});

test('2023 EER targets apply adult adjustment caps and protect child maintenance', function () {
    Carbon::setTestNow('2026-08-05 12:00:00');
    $calculator = app(NutritionTargetCalculator::class);
    $adult = new HouseholdMember(['classification' => 'adult', 'birth_date' => '1990-01-01', 'sex_at_birth' => 'female', 'height_cm' => 165, 'weight_kg' => 70, 'activity_level' => 'active', 'nutrition_goal' => 'gradual_loss', 'calorie_counting_enabled' => true]);
    $maintenance = clone $adult;
    $maintenance->nutrition_goal = 'maintenance';
    $loss = $calculator->calculate($adult);
    $base = $calculator->calculate($maintenance);
    expect($loss['version'])->toBe('nasem-eer-2023-v1')
        ->and($base['targets']['calories'] - $loss['targets']['calories'])->toBeLessThanOrEqual(500)
        ->and($loss['targets']['carbohydrates'])->toBeGreaterThan(0);

    $child = new HouseholdMember(['classification' => 'child', 'birth_date' => '2018-01-01', 'sex_at_birth' => 'male', 'height_cm' => 125, 'weight_kg' => 25, 'activity_level' => 'active', 'nutrition_goal' => 'gradual_loss', 'calorie_counting_enabled' => true]);
    $result = $calculator->calculate($child);
    expect($result['warnings'])->toContain('Child targets remain maintenance-oriented unless a professional target is supplied.');
});

test('missing EER inputs warn instead of inventing targets and professional targets override', function () {
    $calculator = app(NutritionTargetCalculator::class);
    $missing = $calculator->calculate(new HouseholdMember(['classification' => 'adult']));
    expect($missing['source'])->toBe('unavailable')->and($missing['warnings'])->not->toBeEmpty()->and($missing['targets'])->not->toHaveKey('calories');
    $professional = $calculator->calculate(new HouseholdMember(['classification' => 'adult', 'target_source' => 'professional', 'nutrition_targets' => ['calories' => 1800, 'protein' => 95]]));
    expect($professional['source'])->toBe('professional')->and($professional['targets']['calories'])->toEqual(1800)->and($professional['targets']['protein'])->toBe(95);
});

test('curated local recipes generate deterministically when external providers are disabled', function () {
    $this->seed(MealPlanningSeeder::class);
    config(['services.meal_planning.themealdb.key' => '', 'services.meal_planning.spoonacular.key' => null, 'services.meal_planning.usda.key' => null, 'services.meal_planning.edamam.app_id' => null]);
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $member = $household->members()->first();
    $member->update(['target_source' => 'manual', 'nutrition_targets' => ['calories' => 2000]]);
    $plan = MealPlan::create(['household_id' => $household->id, 'created_by_user_id' => $owner->id, 'start_date' => '2026-08-10', 'number_of_days' => 2, 'status' => 'draft', 'priority_profile' => 'balanced', 'generation_seed' => 'fixed-seed', 'settings' => ['meal_slots' => ['dinner']]]);

    $first = app(MealPlanGenerator::class)->generate($plan);
    $selected = $first->items->pluck('recipe_version_id')->all();
    $second = app(MealPlanGenerator::class)->generate($plan->fresh());
    expect($selected)->toBe($second->items->pluck('recipe_version_id')->all())
        ->and($second->items)->toHaveCount(2)
        ->and($second->shoppingLists()->latest()->first()->unknown_price_count)->toBeGreaterThan(0)
        ->and(Recipe::where('scope', 'system')->count())->toBe(15);
});

test('pantry reservations use earliest expiry and preparation deducts once', function () {
    $this->seed(MealPlanningSeeder::class);
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $member = $household->members()->first();
    $member->update(['target_source' => 'manual', 'nutrition_targets' => ['calories' => 2000]]);
    $chicken = DB::table('ingredients')->where('slug', 'chicken')->first();
    $early = PantryItem::create(['household_id' => $household->id, 'ingredient_id' => $chicken->id, 'quantity' => 1000, 'unit' => 'g', 'expires_on' => '2026-08-11']);
    PantryItem::create(['household_id' => $household->id, 'ingredient_id' => $chicken->id, 'quantity' => 1000, 'unit' => 'g', 'expires_on' => '2026-08-20']);
    $recipe = Recipe::where('name', 'Chicken Adobo')->firstOrFail();
    $plan = MealPlan::create(['household_id' => $household->id, 'created_by_user_id' => $owner->id, 'start_date' => '2026-08-10', 'number_of_days' => 1, 'status' => 'ready', 'priority_profile' => 'balanced']);
    $item = $plan->items()->create(['recipe_version_id' => $recipe->latestVersion->id, 'scheduled_date' => '2026-08-10', 'meal_slot' => 'dinner']);
    $item->portions()->create(['household_member_id' => $member->id, 'serving_multiplier' => 1]);
    $pantry = app(PantryAllocationService::class);
    $pantry->reserve($item);
    expect($item->reservations()->first()->pantry_item_id)->toBe($early->id);
    $pantry->confirmPrepared($item, $owner->id, 'prepare-once');
    $after = $early->fresh()->quantity;
    $pantry->confirmPrepared($item, $owner->id, 'prepare-once');
    expect($early->fresh()->quantity)->toEqual($after)->and(DB::table('pantry_movements')->where('meal_plan_item_id', $item->id)->count())->toBe(1);
});

test('diary entries preserve immutable item snapshots and enforce member isolation', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $household = mealHousehold($owner);
    $ownerMember = $household->members()->first();
    $household->members()->create(['user_id' => $other->id, 'name' => $other->name, 'role' => 'member', 'classification' => 'adult']);
    $payload = ['household_member_id' => $ownerMember->id, 'consumed_at' => '2026-08-05 12:00:00', 'meal_slot' => 'lunch', 'status' => 'modified', 'items' => [['type' => 'manual', 'name' => 'Rice bowl', 'serving_multiplier' => 1, 'nutrition_snapshot' => ['calories' => 450, 'protein' => 20], 'nutrition_source' => 'manual', 'nutrition_confidence' => 'low', 'calculation_version' => 'manual-v1']]];
    $this->actingAs($other)->postJson(route('meal-planning.api.diary.store', $household), $payload)->assertForbidden();
    $response = $this->actingAs($owner)->postJson(route('meal-planning.api.diary.store', $household), $payload)->assertCreated();
    $entry = MealDiaryEntry::findOrFail($response->json('data.id'));
    expect($entry->items->first()->nutrition_snapshot)->toBe(['calories' => 450, 'protein' => 20])->and($entry->actual_nutrition_snapshot['calories'])->toEqual(450);
    $this->deleteJson(route('meal-planning.api.diary.destroy', [$household, $entry]))->assertOk();
    $this->postJson(route('meal-planning.api.diary.restore', [$household, $entry->id]))->assertOk();
    expect($entry->fresh()->deleted_at)->toBeNull();
});

test('diary index only exposes the requesting member unless they administer', function () {
    $owner = User::factory()->create();
    $memberUser = User::factory()->create();
    $household = mealHousehold($owner);
    $ownerMember = $household->members()->first();
    $member = $household->members()->create(['user_id' => $memberUser->id, 'name' => $memberUser->name, 'role' => 'member', 'classification' => 'adult']);
    $base = ['consumed_at' => '2026-08-05 12:00:00', 'meal_slot' => 'lunch', 'status' => 'modified', 'items' => [['type' => 'manual', 'name' => 'Rice bowl', 'serving_multiplier' => 1, 'nutrition_snapshot' => ['calories' => 450], 'nutrition_source' => 'manual', 'nutrition_confidence' => 'low', 'calculation_version' => 'manual-v1']]];
    $this->actingAs($owner)->postJson(route('meal-planning.api.diary.store', $household), [...$base, 'household_member_id' => $ownerMember->id])->assertCreated();
    $this->actingAs($memberUser)->postJson(route('meal-planning.api.diary.store', $household), [...$base, 'household_member_id' => $member->id])->assertCreated();

    // Non-admin omitting member_id sees only their own entries, never the owner's.
    $mine = $this->actingAs($memberUser)->getJson(route('meal-planning.api.diary.index', $household))->assertOk()->json('data');
    expect(collect($mine)->pluck('member.id')->unique()->all())->toBe([$member->id]);

    // Non-admin cannot reach another member's diary by supplying member_id.
    $this->actingAs($memberUser)->getJson(route('meal-planning.api.diary.index', [$household, 'member_id' => $ownerMember->id]))->assertForbidden();

    // Administrators still see the whole household.
    $all = $this->actingAs($owner)->getJson(route('meal-planning.api.diary.index', $household))->assertOk()->json('data');
    expect(collect($all)->pluck('member.id')->unique()->sort()->values()->all())->toBe(collect([$ownerMember->id, $member->id])->sort()->values()->all());
});

test('naive diary consumed_at is interpreted in the household timezone', function () {
    $owner = User::factory()->create();
    $household = mealHousehold($owner); // Asia/Manila (UTC+08:00)
    $member = $household->members()->first();
    $payload = ['household_member_id' => $member->id, 'consumed_at' => '2026-08-05T12:00', 'meal_slot' => 'lunch', 'status' => 'modified', 'items' => [['type' => 'manual', 'name' => 'Rice bowl', 'serving_multiplier' => 1, 'nutrition_snapshot' => ['calories' => 450], 'nutrition_source' => 'manual', 'nutrition_confidence' => 'low', 'calculation_version' => 'manual-v1']]];
    $response = $this->actingAs($owner)->postJson(route('meal-planning.api.diary.store', $household), $payload)->assertCreated();
    $entry = MealDiaryEntry::findOrFail($response->json('data.id'));
    // Noon in Manila is stored as 04:00 UTC, keeping it inside the household's day boundaries.
    expect($entry->consumed_at->utc()->toDateTimeString())->toBe('2026-08-05 04:00:00');
});

test('skipped diary entries are excluded from consumed nutrition totals', function () {
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $member = $household->members()->first();
    $payload = ['household_member_id' => $member->id, 'consumed_at' => '2026-08-05T12:00', 'meal_slot' => 'lunch', 'status' => 'modified', 'items' => [['type' => 'manual', 'name' => 'Rice bowl', 'serving_multiplier' => 1, 'nutrition_snapshot' => ['calories' => 450, 'protein' => 20], 'nutrition_source' => 'manual', 'nutrition_confidence' => 'low', 'calculation_version' => 'manual-v1']]];
    $response = $this->actingAs($owner)->postJson(route('meal-planning.api.diary.store', $household), $payload)->assertCreated();
    $entry = MealDiaryEntry::findOrFail($response->json('data.id'));

    // Skip the meal without replacing items (items are left intact by design).
    $this->actingAs($owner)->patchJson(route('meal-planning.api.diary.update', [$household, $entry]), ['status' => 'skipped'])->assertOk();

    $summary = $this->actingAs($owner)->getJson(route('meal-planning.api.diary.summary', [$household, $member, 'date' => '2026-08-05']))->assertOk()->json('data');
    expect($summary['totals']['calories'])->toEqual(0)
        ->and($summary['totals']['protein'])->toEqual(0)
        ->and($summary['meals_skipped'])->toBe(1)
        ->and($summary['meals_logged'])->toBe(0);
});

test('marking a planned meal eaten twice reuses the diary entry', function () {
    $this->seed(MealPlanningSeeder::class);
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $member = $household->members()->first();
    $recipe = Recipe::where('name', 'Chicken Adobo')->firstOrFail();
    $plan = MealPlan::create(['household_id' => $household->id, 'created_by_user_id' => $owner->id, 'start_date' => '2026-08-10', 'number_of_days' => 1, 'status' => 'ready', 'priority_profile' => 'balanced']);
    $item = $plan->items()->create(['recipe_version_id' => $recipe->latestVersion->id, 'scheduled_date' => '2026-08-10', 'meal_slot' => 'dinner']);
    $item->portions()->create(['household_member_id' => $member->id, 'serving_multiplier' => 1, 'nutrition_snapshot' => ['calories' => 600]]);

    $route = route('meal-planning.api.diary.mark-planned', [$household, $item]);
    $this->actingAs($owner)->postJson($route, ['household_member_id' => $member->id])->assertCreated();
    $this->actingAs($owner)->postJson($route, ['household_member_id' => $member->id])->assertCreated();

    expect(MealDiaryEntry::where('meal_plan_item_id', $item->id)->where('household_member_id', $member->id)->count())->toBe(1);
});

test('syncing a plan preserves calendar event identities and clears orphans', function () {
    $this->seed(MealPlanningSeeder::class);
    $owner = User::factory()->create();
    $household = mealHousehold($owner);
    $recipe = Recipe::where('name', 'Chicken Adobo')->firstOrFail();
    $plan = MealPlan::create(['household_id' => $household->id, 'created_by_user_id' => $owner->id, 'start_date' => '2026-08-10', 'number_of_days' => 2, 'status' => 'ready', 'priority_profile' => 'balanced']);
    $first = $plan->items()->create(['recipe_version_id' => $recipe->latestVersion->id, 'scheduled_date' => '2026-08-10', 'meal_slot' => 'dinner']);
    $second = $plan->items()->create(['recipe_version_id' => $recipe->latestVersion->id, 'scheduled_date' => '2026-08-11', 'meal_slot' => 'dinner']);

    $calendar = app(MealCalendarService::class);
    $calendar->syncPlan($plan);
    $mealEvent = MealCalendarEvent::where('meal_plan_item_id', $first->id)->where('type', 'meal')->firstOrFail();
    $originalId = $mealEvent->id;

    // A prep task pins itself to the event id; the linkage must survive a re-sync.
    Task::create(['user_id' => $owner->id, 'title' => 'Prep dinner', 'due_date' => '2026-08-10', 'status' => 'pending', 'source_type' => 'meal_calendar_event', 'source_id' => $mealEvent->id, 'meal_household_id' => $household->id]);

    $second->delete();
    $calendar->syncPlan($plan->fresh());

    expect(MealCalendarEvent::where('meal_plan_item_id', $first->id)->where('type', 'meal')->count())->toBe(1)
        ->and(MealCalendarEvent::where('meal_plan_item_id', $first->id)->where('type', 'meal')->value('id'))->toBe($originalId)
        ->and(MealCalendarEvent::where('meal_plan_item_id', $second->id)->exists())->toBeFalse();
});

test('provider adapters normalize and cache external data without exposing raw payloads', function () {
    config(['services.meal_planning.themealdb.key' => 'test-key', 'services.meal_planning.themealdb.base_url' => 'https://themealdb.test/api']);
    Http::fake(['themealdb.test/*' => Http::response(['meals' => [['idMeal' => '42', 'strMeal' => 'Test Stew', 'strArea' => 'Filipino', 'strCategory' => 'Chicken', 'strIngredient1' => 'Chicken', 'strMeasure1' => '500 g', 'strInstructions' => "Cook gently.\nServe hot.", 'strMealThumb' => 'https://images.test/stew.jpg']]])]);
    $provider = app(TheMealDbRecipeProvider::class);
    $first = $provider->search(new RecipeSearchCriteria('stew'));
    $second = $provider->search(new RecipeSearchCriteria('stew'));
    expect($first->recipes[0]->name)->toBe('Test Stew')->and($first->recipes[0]->ingredients[0]['name'])->toBe('Chicken')->and($second->fromCache)->toBeTrue();
    Http::assertSentCount(1);

    config(['services.meal_planning.open_food_facts.base_url' => 'https://off.test/api/v3', 'services.meal_planning.open_food_facts.user_agent' => 'Wevie Tests/1.0']);
    Cache::flush();
    Http::fake(['off.test/*' => Http::response(['product' => ['product_name' => 'Cereal', 'brands' => 'Local', 'nutriments' => ['energy-kcal_100g' => 380], 'image_front_url' => 'https://images.test/cereal.jpg']])]);
    $food = app(OpenFoodFactsProductProvider::class)->findByBarcode('123456789012');
    expect($food->barcode)->toBe('0123456789012')->and($food->confidence)->toBe('low');
    Http::assertSent(fn ($request) => $request->hasHeader('User-Agent', 'Wevie Tests/1.0'));
});
