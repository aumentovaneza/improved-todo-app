<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Repositories\Contracts\PointWalletRepositoryInterface;

class PointWalletRepository implements PointWalletRepositoryInterface
{
    public function findForUser(int $userId): ?PointWallet
    {
        return PointWallet::query()->where('user_id', $userId)->first();
    }

    public function ensureForUser(int $userId): PointWallet
    {
        return PointWallet::query()->firstOrCreate(['user_id' => $userId]);
    }

    public function lockForUser(int $userId): PointWallet
    {
        $wallet = PointWallet::query()
            ->where('user_id', $userId)
            ->lockForUpdate()
            ->first();

        if ($wallet) {
            return $wallet;
        }

        // No wallet yet — create it, then re-select under a lock so the caller
        // holds the row lock for the remainder of the transaction.
        PointWallet::query()->firstOrCreate(['user_id' => $userId]);

        return PointWallet::query()
            ->where('user_id', $userId)
            ->lockForUpdate()
            ->firstOrFail();
    }
}
