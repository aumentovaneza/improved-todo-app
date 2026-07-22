<?php

namespace App\Modules\Finance\Services;

use App\Models\User;

class FinanceAccessService
{
    public function getTier(User $user): string
    {
        return $user->isPremium() ? 'premium' : 'free';
    }

    public function canAccessAdvancedCharts(User $user): bool
    {
        return $this->getTier($user) === 'premium';
    }

    public function canUseInsights(User $user): bool
    {
        return $this->getTier($user) === 'premium';
    }
}
