<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Models\PointWallet;

interface PointWalletRepositoryInterface
{
    public function findForUser(int $userId): ?PointWallet;

    public function ensureForUser(int $userId): PointWallet;

    /**
     * Fetch the wallet row with a pessimistic lock (SELECT ... FOR UPDATE).
     * Must be called inside a transaction. Creates the row first if missing.
     */
    public function lockForUser(int $userId): PointWallet;
}
