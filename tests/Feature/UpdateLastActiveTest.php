<?php

use App\Models\User;

test('an authenticated request stamps last_active_at when it is null', function () {
    $this->freezeTime();

    $user = User::factory()->create(['last_active_at' => null]);

    $this->actingAs($user)->get('/dashboard')->assertOk();

    expect($user->fresh()->last_active_at)->not->toBeNull()
        ->and($user->fresh()->last_active_at->timestamp)->toBe(now()->timestamp);
});

test('a second request within the throttle window does not rewrite last_active_at', function () {
    $this->freezeTime();

    $user = User::factory()->create();
    $recent = now()->subSeconds(30);
    $user->forceFill(['last_active_at' => $recent])->saveQuietly();

    $this->actingAs($user)->get('/dashboard')->assertOk();

    expect($user->fresh()->last_active_at->timestamp)->toBe($recent->timestamp);
});

test('a request refreshes last_active_at once it is older than the throttle window', function () {
    $this->freezeTime();

    $user = User::factory()->create();
    $stale = now()->subMinutes(5);
    $user->forceFill(['last_active_at' => $stale])->saveQuietly();

    $this->actingAs($user)->get('/dashboard')->assertOk();

    expect($user->fresh()->last_active_at->timestamp)->toBe(now()->timestamp);
});

test('the write does not touch updated_at or fire model events', function () {
    $this->freezeTime();

    $user = User::factory()->create(['last_active_at' => null]);
    $originalUpdatedAt = $user->fresh()->updated_at;

    // Move clock forward so a naive updated_at bump would be detectable.
    $this->travel(2)->minutes();

    $this->actingAs($user)->get('/dashboard')->assertOk();

    $fresh = $user->fresh();
    expect($fresh->last_active_at)->not->toBeNull()
        ->and($fresh->updated_at->timestamp)->toBe($originalUpdatedAt->timestamp);
});

test('an unauthenticated request never stamps last_active_at', function () {
    $user = User::factory()->create(['last_active_at' => null]);

    $this->get('/')->assertOk();

    expect($user->fresh()->last_active_at)->toBeNull();
});
