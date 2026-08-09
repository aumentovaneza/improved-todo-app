<?php

namespace App\Modules\Points\Services;

use App\Models\User;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Enums\StoreItemType;
use App\Modules\Points\Models\StoreItem;
use App\Modules\Points\Models\UserStoreItem;
use App\Modules\Points\Repositories\Contracts\StoreItemRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserAvatarRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserStoreItemRepositoryInterface;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class StoreService
{
    public function __construct(
        private StoreItemRepositoryInterface $storeItems,
        private UserStoreItemRepositoryInterface $inventory,
        private UserAvatarRepositoryInterface $avatars,
        private PointsWalletService $walletService,
    ) {}

    /**
     * The full active catalog, decorated with per-user owned/equipped flags.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listCatalogFor(User $user): array
    {
        $items = $this->storeItems->allActive();
        $ownedIds = $this->inventory->ownedItemIds($user->id);
        $avatar = $this->avatars->getForUser($user->id);
        $baseItemId = $avatar?->base_item_id;
        $equippedMap = $avatar?->equipped ?? [];

        return $items->map(function (StoreItem $item) use ($ownedIds, $baseItemId, $equippedMap): array {
            $slot = $item->slot?->value;
            $isBase = $item->type === StoreItemType::AvatarBase;

            $equipped = $isBase
                ? ($baseItemId !== null && (int) $baseItemId === (int) $item->id)
                : ($slot !== null && (int) ($equippedMap[$slot] ?? 0) === (int) $item->id);

            return [
                'id' => (int) $item->id,
                'key' => $item->key,
                'name' => $item->name,
                'description' => $item->description,
                'type' => $item->type->value,
                'slot' => $slot,
                'cost' => (int) $item->cost,
                'preview_url' => $this->assetUrl($item->preview_asset ?? $item->asset),
                'owned' => in_array((int) $item->id, $ownedIds, true),
                'equipped' => $equipped,
            ];
        })->all();
    }

    /**
     * Purchase an item: atomic debit + inventory row + optional auto-equip.
     * Idempotent per $clientRequestId (the debit short-circuits on retry) and
     * a no-op when the user already owns the item.
     */
    public function purchase(User $user, StoreItem $storeItem, string $clientRequestId): ?UserStoreItem
    {
        return DB::transaction(function () use ($user, $storeItem, $clientRequestId) {
            if (! $storeItem->is_active) {
                throw new RuntimeException('This item is not available.');
            }

            if ($this->inventory->existsForUser($user->id, $storeItem->id)) {
                return null;
            }

            $entry = $this->walletService->debit(
                $user->id,
                (int) $storeItem->cost,
                PointSource::StorePurchase,
                $storeItem,
                $clientRequestId,
            );

            // Guard against a client_request_id reused across different items:
            // debit() is idempotent per request id and would otherwise return
            // the *first* item's spend entry, granting this item for free.
            $matchesItem = (int) $entry->sourceable_id === (int) $storeItem->id
                && $entry->sourceable_type === $storeItem->getMorphClass();

            if (! $matchesItem) {
                throw new RuntimeException('This request has already been used for a different purchase.');
            }

            $inventory = $this->inventory->create([
                'user_id' => $user->id,
                'store_item_id' => $storeItem->id,
                'acquired_via' => 'purchase',
                'point_ledger_entry_id' => $entry->id,
                'acquired_at' => now(),
            ]);

            // Auto-equip a base avatar when the user has none yet.
            if ($storeItem->type === StoreItemType::AvatarBase) {
                $avatar = $this->avatars->ensureForUser($user->id);

                if ($avatar->base_item_id === null) {
                    $avatar->base_item_id = $storeItem->id;
                    $avatar->save();
                }
            }

            return $inventory;
        });
    }

    /**
     * Equip an owned item. Aborts 403 when the user does not own it.
     */
    public function equip(User $user, StoreItem $storeItem): void
    {
        if (! $this->inventory->existsForUser($user->id, $storeItem->id)) {
            abort(403, 'You do not own this item.');
        }

        $avatar = $this->avatars->ensureForUser($user->id);

        if ($storeItem->type === StoreItemType::AvatarBase) {
            $avatar->base_item_id = $storeItem->id;
            $avatar->save();

            return;
        }

        // Accessory slots (Phase 2 layering) — record in the equipped map.
        $slot = $storeItem->slot?->value;

        if ($slot !== null) {
            $equipped = $avatar->equipped ?? [];
            $equipped[$slot] = (int) $storeItem->id;
            $avatar->equipped = $equipped;
            $avatar->save();
        }
    }

    private function assetUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return asset('images/avatars/'.$path);
    }
}
