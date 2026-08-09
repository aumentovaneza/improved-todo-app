<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Models\StoreItem;
use Illuminate\Database\Eloquent\Collection;

interface StoreItemRepositoryInterface
{
    /**
     * @return Collection<int, StoreItem>
     */
    public function allActive(): Collection;

    public function findById(int $id): ?StoreItem;

    public function findByKey(string $key): ?StoreItem;

    public function defaultBase(): ?StoreItem;
}
