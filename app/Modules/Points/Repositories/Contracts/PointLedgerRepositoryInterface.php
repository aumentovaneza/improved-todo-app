<?php

namespace App\Modules\Points\Repositories\Contracts;

use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface PointLedgerRepositoryInterface
{
    /**
     * Paginate a user's ledger entries, newest first.
     *
     * @return LengthAwarePaginator<int, PointLedgerEntry>
     */
    public function paginateForUser(int $userId, int $perPage = 20): LengthAwarePaginator;

    /**
     * Sum + group this user's positive earn amounts since $since, by source,
     * ordered by total desc, excluding sources with a non-positive total.
     *
     * @return array<int, array{source: string, total: int}>
     */
    public function weeklyEarnBreakdown(int $userId, CarbonInterface $since): array;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): PointLedgerEntry;

    /**
     * Whether an un-reversed award is outstanding for a source + sourceable,
     * i.e. earn entries outnumber reversal (adjust) entries. Drives the
     * idempotent award/reverse guard by completion *cycle* rather than by
     * amount, so a balance-clamped reversal still closes the cycle and lets a
     * recurring task earn again.
     */
    public function awardCycleOpen(int $userId, PointSource $source, Model $sourceable): bool;

    public function existsByClientRequestId(int $userId, string $clientRequestId): bool;

    public function findByClientRequestId(int $userId, string $clientRequestId): ?PointLedgerEntry;
}
