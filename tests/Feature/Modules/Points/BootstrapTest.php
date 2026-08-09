<?php

use App\Models\User;
use App\Modules\Points\Enums\StoreItemSlot;
use App\Modules\Points\Enums\StoreItemType;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Models\StoreItem;
use App\Modules\Points\Models\UserAvatar;
use App\Modules\Points\Models\UserStoreItem;

function seedDefaultBase(): StoreItem
{
    return StoreItem::create([
        'key' => 'avatar_base_default',
        'name' => 'Starter',
        'type' => StoreItemType::AvatarBase->value,
        'slot' => StoreItemSlot::Base->value,
        'cost' => 0,
        'asset' => 'bases/default',
        'is_active' => true,
        'is_default' => true,
    ]);
}

it('seeds a wallet, avatar, and default base for a new user via the observer', function () {
    $default = seedDefaultBase();

    $user = User::factory()->create();

    expect(PointWallet::where('user_id', $user->id)->exists())->toBeTrue();

    $avatar = UserAvatar::where('user_id', $user->id)->first();
    expect($avatar)->not->toBeNull();
    expect($avatar->base_item_id)->toBe($default->id);

    $this->assertDatabaseHas('user_store_items', [
        'user_id' => $user->id,
        'store_item_id' => $default->id,
        'acquired_via' => 'default',
    ]);
});

it('still creates a wallet and avatar when the catalog is empty', function () {
    $user = User::factory()->create();

    expect(PointWallet::where('user_id', $user->id)->exists())->toBeTrue();
    expect(UserAvatar::where('user_id', $user->id)->exists())->toBeTrue();
});

it('backfill is idempotent', function () {
    // User created before the catalog exists — no default granted yet.
    $user = User::factory()->create();
    $default = seedDefaultBase();

    $this->artisan('points:backfill')->assertSuccessful();
    $this->artisan('points:backfill')->assertSuccessful();

    expect(UserStoreItem::where('user_id', $user->id)->where('store_item_id', $default->id)->count())->toBe(1);
    expect(UserAvatar::where('user_id', $user->id)->value('base_item_id'))->toBe($default->id);
});
