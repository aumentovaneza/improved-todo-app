<?php

namespace App\Services\Ai;

use App\Models\User;

/**
 * Single seam for gating AI features. Every AI feature routes its entitlement
 * check through canUse() so pro-gating is the default: a feature is locked to
 * premium users unless an explicit per-feature open-beta override opens it up
 * for public testing.
 */
class AiEntitlementService
{
    /**
     * Whether the user may use the given AI feature.
     *
     * Premium users always may. Everyone else is locked out unless the feature
     * has an open-beta override in config/ai.php (config('ai.open_beta.<feature>')).
     * Absence of an override means premium-only — the pro-gated default.
     */
    public function canUse(User $user, string $feature): bool
    {
        if ($this->isPremium($user)) {
            return true;
        }

        return (bool) config("ai.open_beta.{$feature}", false);
    }

    /**
     * The single source of truth for "premium". Future subscription/plan logic
     * lands here; today premium maps to the admin role (mirrors the tier check
     * in FinanceAccessService).
     */
    public function isPremium(User $user): bool
    {
        return $user->isPremium();
    }
}
