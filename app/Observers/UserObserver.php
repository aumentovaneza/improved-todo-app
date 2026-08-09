<?php

namespace App\Observers;

use App\Models\EventCalendar;
use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Models\StoreItem;
use App\Modules\Points\Models\UserAvatar;
use App\Modules\Points\Models\UserStoreItem;

class UserObserver
{
    /**
     * Handle the User "created" event.
     *
     * Every user gets a default "Cash on hand" account that cannot be deleted.
     */
    public function created(User $user): void
    {
        EventCalendar::firstOrCreate(
            ['user_id' => $user->id, 'is_default' => true],
            ['name' => 'Personal', 'color' => '#4ACF91', 'position' => 0]
        );

        $this->seedPointsProfile($user);

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

    /**
     * Seed the Points profile: a wallet, an avatar row, and (when the catalog
     * has one) the free default base avatar, granted and equipped. The wallet
     * and avatar row are always created; the default grant is null-safe so the
     * feature bootstraps even before the store catalog is seeded.
     */
    private function seedPointsProfile(User $user): void
    {
        PointWallet::firstOrCreate(['user_id' => $user->id]);
        $avatar = UserAvatar::firstOrCreate(['user_id' => $user->id]);

        $defaultBase = StoreItem::query()
            ->where('is_default', true)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if (! $defaultBase) {
            return;
        }

        UserStoreItem::firstOrCreate(
            ['user_id' => $user->id, 'store_item_id' => $defaultBase->id],
            ['acquired_via' => 'default', 'acquired_at' => now()]
        );

        if ($avatar->base_item_id === null) {
            $avatar->base_item_id = $defaultBase->id;
            $avatar->save();
        }
    }
}
