<?php

use App\Models\PushToken;
use App\Models\User;
use App\Services\DeviceTokenService;

/**
 * Phase 3 native push: the device-token registry backs APNs delivery. Tokens
 * are provider-agnostic and unique per (user, token); registration upserts.
 */
it('registers a new device token', function () {
    $user = User::factory()->create();

    $token = app(DeviceTokenService::class)->register($user, [
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'device-token-abc',
        'meta' => ['model' => 'iPhone'],
    ]);

    expect($token->exists)->toBeTrue();
    expect(PushToken::count())->toBe(1);
    expect($token->user_id)->toBe($user->id);
    expect($token->meta)->toBe(['model' => 'iPhone']);
    expect($token->last_used_at)->not->toBeNull();
});

it('upserts the same token instead of duplicating it and refreshes last_used_at', function () {
    $user = User::factory()->create();
    $service = app(DeviceTokenService::class);

    $first = $service->register($user, [
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'device-token-abc',
    ]);

    // Backdate so we can prove last_used_at moves forward on re-register.
    $first->forceFill(['last_used_at' => now()->subDay()])->save();
    $staleUsedAt = $first->fresh()->last_used_at;

    $second = $service->register($user, [
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'device-token-abc',
        'meta' => ['refreshed' => true],
    ]);

    expect(PushToken::count())->toBe(1);
    expect($second->id)->toBe($first->id);
    expect($second->meta)->toBe(['refreshed' => true]);
    expect($second->last_used_at->greaterThan($staleUsedAt))->toBeTrue();
});

it('deletes a device token for the user', function () {
    $user = User::factory()->create();
    $service = app(DeviceTokenService::class);

    $service->register($user, [
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'device-token-abc',
    ]);

    $service->delete($user, 'device-token-abc');

    expect(PushToken::count())->toBe(0);
});

it('stores a device token via the POST endpoint', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('device-tokens.store'), [
            'platform' => 'ios',
            'provider' => 'apns',
            'token' => 'device-token-xyz',
        ])
        ->assertCreated()
        ->assertJson(['ok' => true]);

    expect($user->pushTokens()->where('token', 'device-token-xyz')->exists())->toBeTrue();
});

it('unregisters a device token via the DELETE endpoint', function () {
    $user = User::factory()->create();
    PushToken::factory()->for($user)->create(['token' => 'device-token-xyz']);

    $this->actingAs($user)
        ->deleteJson(route('device-tokens.destroy'), ['token' => 'device-token-xyz'])
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect($user->pushTokens()->count())->toBe(0);
});

it('rejects an invalid platform', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('device-tokens.store'), [
            'platform' => 'windows',
            'provider' => 'apns',
            'token' => 'device-token-xyz',
        ])
        ->assertJsonValidationErrors('platform');
});

it('rejects an invalid provider', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('device-tokens.store'), [
            'platform' => 'ios',
            'provider' => 'carrier-pigeon',
            'token' => 'device-token-xyz',
        ])
        ->assertJsonValidationErrors('provider');
});

it('rejects a missing token', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('device-tokens.store'), [
            'platform' => 'ios',
            'provider' => 'apns',
        ])
        ->assertJsonValidationErrors('token');
});

it('requires authentication to register a device token', function () {
    $this->postJson(route('device-tokens.store'), [
        'platform' => 'ios',
        'provider' => 'apns',
        'token' => 'device-token-xyz',
    ])->assertUnauthorized();
});
