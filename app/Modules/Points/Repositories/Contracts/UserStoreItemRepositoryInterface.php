<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Models\UserStoreItem;
use Illuminate\Database\Eloquent\Collection;

interface UserStoreItemRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): UserStoreItem;

    public function existsForUser(int $userId, int $storeItemId): bool;

    /**
     * @return Collection<int, UserStoreItem>
     */
    public function listForUser(int $userId): Collection;

    /**
     * @return array<int, int>
     */
    public function ownedItemIds(int $userId): array;
}
