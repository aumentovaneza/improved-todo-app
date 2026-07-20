<?php

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Services\CategoryService;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

/**
 * These cover the app-level (PHP) search/sort/uniqueness that replaced SQL
 * predicates on now-encrypted columns (title, description, name, notes, ...).
 */
function makeTask(int $userId, ?int $categoryId, array $attributes = []): Task
{
    return Task::create(array_merge([
        'user_id' => $userId,
        'category_id' => $categoryId,
        'title' => 'Untitled',
        'description' => null,
        'priority' => 'medium',
        'status' => 'pending',
        'position' => 1,
    ], $attributes));
}

it('matches encrypted task titles by case-insensitive substring and keeps paginator shape', function () {
    $user = User::factory()->create();
    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Errands',
        'color' => '#4ACF91',
        'is_active' => true,
    ]);

    makeTask($user->id, $category->id, ['title' => 'Buy Milk']);
    makeTask($user->id, $category->id, ['title' => 'buy Bread']);
    makeTask($user->id, $category->id, ['title' => 'Walk the dog']);

    $result = app(TaskService::class)->getCategorizedTasksForUser($user->id, ['search' => 'buy']);

    $bucket = collect($result)->firstWhere('category.id', $category->id);
    expect($bucket)->not->toBeNull();

    /** @var LengthAwarePaginator $paginator */
    $paginator = $bucket['tasks'];
    expect($paginator)->toBeInstanceOf(LengthAwarePaginator::class);
    expect($paginator->total())->toBe(2);

    $titles = collect($paginator->items())->map->title->sort()->values()->all();
    expect($titles)->toBe(['Buy Milk', 'buy Bread']);
});

it('matches encrypted task descriptions', function () {
    $user = User::factory()->create();
    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Work',
        'color' => '#4ACF91',
        'is_active' => true,
    ]);

    makeTask($user->id, $category->id, ['title' => 'Report', 'description' => 'Quarterly BUDGET review']);
    makeTask($user->id, $category->id, ['title' => 'Standup', 'description' => 'Daily sync']);

    $result = app(TaskService::class)->getCategorizedTasksForUser($user->id, ['search' => 'budget']);
    $bucket = collect($result)->firstWhere('category.id', $category->id);

    expect($bucket['tasks']->total())->toBe(1);
    expect($bucket['tasks']->items()[0]->title)->toBe('Report');
});

it('searches and orders categories by decrypted name', function () {
    $user = User::factory()->create();
    foreach (['Zeta', 'alpha', 'Beta'] as $name) {
        Category::create([
            'user_id' => $user->id,
            'name' => $name,
            'color' => '#4ACF91',
            'is_active' => true,
        ]);
    }

    $service = app(CategoryService::class);

    // Ordering: case-insensitive ascending against the decrypted name.
    $all = $service->getPaginatedCategoriesForUser($user->id, []);
    expect($all)->toBeInstanceOf(LengthAwarePaginator::class);
    expect(collect($all->items())->map->name->all())->toBe(['alpha', 'Beta', 'Zeta']);

    // Search: substring against decrypted name (matches Beta + Zeta).
    $filtered = $service->getPaginatedCategoriesForUser($user->id, ['search' => 'et']);
    expect(collect($filtered->items())->map->name->all())->toBe(['Beta', 'Zeta']);
});

it('enforces per-user category name uniqueness against decrypted values', function () {
    $user = User::factory()->create();
    $this->actingAs($user); // category activity logging reads Auth::id()
    $service = app(CategoryService::class);

    $service->createCategory(['name' => 'Work', 'color' => '#4ACF91'], $user->id);

    // Case-insensitive duplicate should be rejected.
    expect(fn () => $service->createCategory(['name' => 'work', 'color' => '#4ACF91'], $user->id))
        ->toThrow(InvalidArgumentException::class);

    // A different name is fine.
    $other = $service->createCategory(['name' => 'Personal', 'color' => '#4ACF91'], $user->id);
    expect($other->name)->toBe('Personal');

    // Same name for a different user is allowed.
    $otherUser = User::factory()->create();
    $ok = $service->createCategory(['name' => 'Work', 'color' => '#4ACF91'], $otherUser->id);
    expect($ok->name)->toBe('Work');
});

it('filters finance transactions by decrypted description/notes/payment_method', function () {
    $user = User::factory()->create();

    $base = [
        'user_id' => $user->id,
        'created_by_user_id' => $user->id,
        'type' => 'expense',
        'amount' => 10,
        'currency' => 'USD',
        'occurred_at' => '2026-07-01 10:00:00',
    ];

    FinanceTransaction::create($base + ['description' => 'Grocery run', 'occurred_at' => '2026-07-01 10:00:00']);
    FinanceTransaction::create($base + ['description' => 'Taxi', 'notes' => 'Airport GROCERY pickup', 'occurred_at' => '2026-07-02 10:00:00']);
    FinanceTransaction::create($base + ['description' => 'Coffee', 'payment_method' => 'grocery-card', 'occurred_at' => '2026-07-03 10:00:00']);
    FinanceTransaction::create($base + ['description' => 'Salary note', 'occurred_at' => '2026-07-04 10:00:00']);

    $this->withoutVite();

    $response = $this->actingAs($user)->get(route('weviewallet.transactions.index', [
        'search' => 'grocery',
        'per_page_dates' => 10,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Finance/Transactions')
        ->where('transactions', fn ($transactions) => collect($transactions)->count() === 3)
    );
});
