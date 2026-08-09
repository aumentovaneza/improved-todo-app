<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Points\Repositories\Contracts\StoreItemRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserAvatarRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserStoreItemRepositoryInterface;
use App\Modules\Points\Services\PointsWalletService;
use Illuminate\Console\Command;

class PointsBackfillCommand extends Command
{
    protected $signature = 'points:backfill';

    protected $description = 'Ensure every user has a point wallet, avatar row, and the default base avatar.';

    public function handle(
        PointsWalletService $walletService,
        UserAvatarRepositoryInterface $avatars,
        UserStoreItemRepositoryInterface $inventory,
        StoreItemRepositoryInterface $storeItems,
    ): int {
        $defaultBase = $storeItems->defaultBase();
        $count = 0;

        User::query()->chunkById(200, function ($users) use ($walletService, $avatars, $inventory, $defaultBase, &$count) {
            foreach ($users as $user) {
                $walletService->ensureWallet($user->id);
                $avatar = $avatars->ensureForUser($user->id);

                if ($defaultBase) {
                    if (! $inventory->existsForUser($user->id, $defaultBase->id)) {
                        $inventory->create([
                            'user_id' => $user->id,
                            'store_item_id' => $defaultBase->id,
                            'acquired_via' => 'default',
                            'acquired_at' => now(),
                        ]);
                    }

                    if ($avatar->base_item_id === null) {
                        $avatar->base_item_id = $defaultBase->id;
                        $avatar->save();
                    }
                }

                $count++;
            }
        });

        $this->info("Points backfill complete for {$count} user(s).");

        return self::SUCCESS;
    }
}
