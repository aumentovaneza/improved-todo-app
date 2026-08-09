<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Models\UserStoreItem;
use App\Modules\Points\Repositories\Contracts\UserStoreItemRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class UserStoreItemRepository implements UserStoreItemRepositoryInterface
{
    public function create(array $data): UserStoreItem
    {
        return UserStoreItem::create($data);
    }

    public function existsForUser(int $userId, int $storeItemId): bool
    {
        return UserStoreItem::query()
            ->where('user_id', $userId)
            ->where('store_item_id', $storeItemId)
            ->exists();
    }

    public function listForUser(int $userId): Collection
    {
        return UserStoreItem::query()
            ->where('user_id', $userId)
            ->get();
    }

    public function ownedItemIds(int $userId): array
    {
        return UserStoreItem::query()
            ->where('user_id', $userId)
            ->pluck('store_item_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}
