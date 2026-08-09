<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use Illuminate\Database\Eloquent\Model;

interface PointLedgerRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PointLedgerEntry;

    /**
     * Net amount (SUM of signed amounts) awarded for a given source + sourceable.
     * Drives the idempotent net-award guard.
     */
    public function netAwardedFor(int $userId, PointSource $source, Model $sourceable): int;

    public function existsByClientRequestId(int $userId, string $clientRequestId): bool;

    public function findByClientRequestId(int $userId, string $clientRequestId): ?PointLedgerEntry;
}
