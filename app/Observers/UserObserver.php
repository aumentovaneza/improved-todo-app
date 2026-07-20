<?php

namespace App\Observers;

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;

class UserObserver
{
    /**
     * Handle the User "created" event.
     *
     * Every user gets a default "Cash on hand" account that cannot be deleted.
     */
    public function created(User $user): void
    {
        $hasDefault = FinanceAccount::query()
            ->where('user_id', $user->id)
            ->where('is_default', true)
            ->exists();

        if ($hasDefault) {
            return;
        }

        FinanceAccount::create([
            'user_id' => $user->id,
            'name' => 'Cash on hand',
            'label' => 'Cash on hand',
            'type' => 'cash',
            'currency' => 'PHP',
            'starting_balance' => 0,
            'current_balance' => 0,
            'is_active' => true,
            'is_default' => true,
        ]);
    }
}
