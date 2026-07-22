<?php

use App\Models\User;
use App\Services\Ai\AiEntitlementService;

beforeEach(function () {
    $this->service = $this->app->make(AiEntitlementService::class);
});

it('always allows premium (admin) users regardless of the open-beta flag', function () {
    $premium = User::factory()->create(['role' => 'admin']);

    config()->set('ai.open_beta.some_feature', false);
    expect($this->service->canUse($premium, 'some_feature'))->toBeTrue();
    expect($this->service->isPremium($premium))->toBeTrue();
});

it('allows a free user only when the feature has a truthy open-beta override', function () {
    $free = User::factory()->create(['role' => 'member']);

    config()->set('ai.open_beta.some_feature', true);
    expect($this->service->canUse($free, 'some_feature'))->toBeTrue();

    config()->set('ai.open_beta.some_feature', false);
    expect($this->service->canUse($free, 'some_feature'))->toBeFalse();
});

it('locks a free user out of any feature with no open-beta override (pro-gated default)', function () {
    $free = User::factory()->create(['role' => 'member']);

    expect($this->service->canUse($free, 'brand_new_feature'))->toBeFalse();
    expect($this->service->isPremium($free))->toBeFalse();
});
