<?php

namespace App\Modules\Finance\Services;

use App\Models\User;

class FinanceAccessService
{
    public function getTier(User $user): string
    {
        if ($user->role === 'admin') {
            return 'premium';
        }

        return 'free';
    }

    public function canAccessAdvancedCharts(User $user): bool
    {
        return $this->getTier($user) === 'premium';
    }
}
