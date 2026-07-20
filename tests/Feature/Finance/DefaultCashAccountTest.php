<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;

test('creating a user auto-creates a single default cash on hand account', function () {
    $user = User::factory()->create();

    $defaults = FinanceAccount::query()
        ->where('user_id', $user->id)
        ->where('is_default', true)
        ->get();

    expect($defaults)->toHaveCount(1);

    $account = $defaults->first();
    expect($account->name)->toBe('Cash on hand');
    expect($account->type)->toBe('cash');
    expect($account->is_default)->toBeTrue();
});

test('the default cash on hand account cannot be deleted', function () {
    $user = User::factory()->create();

    $account = FinanceAccount::query()
        ->where('user_id', $user->id)
        ->where('is_default', true)
        ->firstOrFail();

    $response = $this
        ->actingAs($user)
        ->deleteJson(route('weviewallet.api.accounts.destroy', $account));

    $response->assertStatus(422);

    expect(FinanceAccount::query()->whereKey($account->id)->exists())->toBeTrue();
});

test('a non-default account can still be deleted', function () {
    $user = User::factory()->create();

    $account = FinanceAccount::create([
        'user_id' => $user->id,
        'name' => 'Regular Bank',
        'type' => 'bank',
        'currency' => 'PHP',
        'starting_balance' => 0,
        'current_balance' => 0,
        'is_active' => true,
        'is_default' => false,
    ]);

    $response = $this
        ->actingAs($user)
        ->deleteJson(route('weviewallet.api.accounts.destroy', $account));

    $response->assertOk();

    expect(FinanceAccount::query()->whereKey($account->id)->exists())->toBeFalse();
});
