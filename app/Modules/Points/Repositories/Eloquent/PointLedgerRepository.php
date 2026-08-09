<?php

namespace App\Modules\Points\Repositories\Eloquent;

use App\Modules\Points\Enums\PointLedgerType;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use Illuminate\Database\Eloquent\Model;

class PointLedgerRepository implements PointLedgerRepositoryInterface
{
    public function create(array $data): PointLedgerEntry
    {
        return PointLedgerEntry::create($data);
    }

    public function awardCycleOpen(int $userId, PointSource $source, Model $sourceable): bool
    {
        $base = PointLedgerEntry::query()
            ->where('user_id', $userId)
            ->where('source', $source->value)
            ->where('sourceable_type', $sourceable->getMorphClass())
            ->where('sourceable_id', $sourceable->getKey());

        $earns = (clone $base)->where('type', PointLedgerType::Earn->value)->count();
        $reversals = (clone $base)->where('type', PointLedgerType::Adjust->value)->count();

        return $earns > $reversals;
    }

    public function existsByClientRequestId(int $userId, string $clientRequestId): bool
    {
        return PointLedgerEntry::query()
            ->where('user_id', $userId)
            ->where('client_request_id', $clientRequestId)
            ->exists();
    }

    public function findByClientRequestId(int $userId, string $clientRequestId): ?PointLedgerEntry
    {
        return PointLedgerEntry::query()
            ->where('user_id', $userId)
            ->where('client_request_id', $clientRequestId)
            ->first();
    }
}
