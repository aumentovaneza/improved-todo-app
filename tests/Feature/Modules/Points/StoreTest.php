<?php

use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Enums\StoreItemSlot;
use App\Modules\Points\Enums\StoreItemType;
use App\Modules\Points\Exceptions\InsufficientBalanceException;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Models\StoreItem;
use App\Modules\Points\Models\UserAvatar;
use App\Modules\Points\Models\UserStoreItem;
use App\Modules\Points\Services\PointsWalletService;
use App\Modules\Points\Services\StoreService;

function makeBaseItem(array $overrides = []): StoreItem
{
    return StoreItem::create(array_merge([
        'key' => 'base_'.uniqid(),
        'name' => 'Fox',
        'description' => 'A fox',
        'type' => StoreItemType::AvatarBase->value,
        'slot' => StoreItemSlot::Base->value,
        'cost' => 50,
        'asset' => 'bases/fox',
        'preview_asset' => 'bases/preview/fox',
        'is_active' => true,
        'is_default' => false,
    ], $overrides));
}

function fundWallet(User $user, int $amount): void
{
    app(PointsWalletService::class)->credit($user->id, $amount, PointSource::AdminAdjust);
}

it('debits the balance, records inventory, and writes a spend entry on purchase', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50]);
    fundWallet($user, 100);

    app(StoreService::class)->purchase($user, $item, 'crid-1');

    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(50);
    $this->assertDatabaseHas('user_store_items', [
        'user_id' => $user->id,
        'store_item_id' => $item->id,
        'acquired_via' => 'purchase',
    ]);
    $this->assertDatabaseHas('point_ledger_entries', [
        'user_id' => $user->id,
        'source' => PointSource::StorePurchase->value,
        'amount' => -50,
    ]);
});

it('auto-equips a base avatar when the user has none', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50]);
    fundWallet($user, 100);

    app(StoreService::class)->purchase($user, $item, 'crid-1');

    expect(UserAvatar::where('user_id', $user->id)->value('base_item_id'))->toBe($item->id);
});

it('rejects a purchase when the balance is insufficient and does not debit', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50]);
    fundWallet($user, 20);

    expect(fn () => app(StoreService::class)->purchase($user, $item, 'crid-1'))
        ->toThrow(InsufficientBalanceException::class);

    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(20);
    expect(UserStoreItem::where('user_id', $user->id)->count())->toBe(0);
});

it('does not double-charge on a repeated purchase', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50]);
    fundWallet($user, 100);

    app(StoreService::class)->purchase($user, $item, 'crid-1');
    app(StoreService::class)->purchase($user, $item, 'crid-1');

    expect(PointWallet::where('user_id', $user->id)->value('balance'))->toBe(50);
    expect(UserStoreItem::where('user_id', $user->id)->where('store_item_id', $item->id)->count())->toBe(1);
});

it('equips an owned item', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 0]);
    fundWallet($user, 10);
    app(StoreService::class)->purchase($user, $item, 'crid-1');

    $second = makeBaseItem(['cost' => 0, 'key' => 'base_second']);
    fundWallet($user, 10);
    app(StoreService::class)->purchase($user, $second, 'crid-2');

    app(StoreService::class)->equip($user, $second);

    expect(UserAvatar::where('user_id', $user->id)->value('base_item_id'))->toBe($second->id);
});

it('forbids equipping an unowned item via the endpoint', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50]);

    $this->actingAs($user)
        ->post(route('store.equip'), ['store_item_id' => $item->id])
        ->assertForbidden();
});

it('renders the store catalog with owned and equipped flags', function () {
    $user = User::factory()->create();
    $item = makeBaseItem(['cost' => 50, 'name' => 'Fox']);
    fundWallet($user, 100);
    app(StoreService::class)->purchase($user, $item, 'crid-1');

    $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());
    $response = $this->actingAs($user)
        ->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $version])
        ->get(route('store.index'));

    $response->assertOk();
    $page = $response->json();

    expect($page['component'])->toBe('Store/Index');
    expect($page['props']['balance'])->toBe(50);

    $items = collect($page['props']['items']);
    $fox = $items->firstWhere('id', $item->id);
    expect($fox['owned'])->toBeTrue();
    expect($fox['equipped'])->toBeTrue();
    expect($fox)->toHaveKeys(['id', 'key', 'name', 'description', 'type', 'slot', 'cost', 'preview_url', 'owned', 'equipped']);
});
