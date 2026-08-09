<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Models\StoreItem;
use App\Modules\Points\Repositories\Contracts\StoreItemRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class StoreItemRepository implements StoreItemRepositoryInterface
{
    public function allActive(): Collection
    {
        return StoreItem::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('cost')
            ->orderBy('id')
            ->get();
    }

    public function findById(int $id): ?StoreItem
    {
        return StoreItem::query()->find($id);
    }

    public function findByKey(string $key): ?StoreItem
    {
        return StoreItem::query()->where('key', $key)->first();
    }

    public function defaultBase(): ?StoreItem
    {
        return StoreItem::query()
            ->where('is_default', true)
            ->where('is_active', true)
            ->orderBy('id')
            ->first();
    }
}
