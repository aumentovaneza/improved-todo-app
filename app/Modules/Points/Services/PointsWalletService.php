<?php

namespace App\Modules\Points\Services;

use App\Modules\Points\Enums\PointLedgerType;
use App\Modules\Points\Enums\PointSource;
use App\Modules\Points\Exceptions\InsufficientBalanceException;
use App\Modules\Points\Models\PointLedgerEntry;
use App\Modules\Points\Models\PointWallet;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\PointWalletRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The single atomic authority over a user's point balance + ledger.
 *
 * Every mutation runs inside DB::transaction with a pessimistic lock on the
 * wallet row so concurrent earns/spends can never race the running balance.
 * The balance floors at 0 and each mutation appends an immutable, signed
 * ledger entry carrying the post-mutation balance_after.
 */
class PointsWalletService
{
    public function __construct(
        private PointWalletRepositoryInterface $wallets,
        private PointLedgerRepositoryInterface $ledger,
    ) {}

    public function ensureWallet(int $userId): PointWallet
    {
        return $this->wallets->ensureForUser($userId);
    }

    /**
     * Add points. Positive $amount only. Idempotent when $clientRequestId
     * matches an existing entry.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function credit(
        int $userId,
        int $amount,
        PointSource $source,
        ?Model $sourceable = null,
        ?string $clientRequestId = null,
        array $metadata = [],
        PointLedgerType $type = PointLedgerType::Earn,
    ): PointLedgerEntry {
        $amount = max(0, $amount);

        return DB::transaction(function () use ($userId, $amount, $source, $sourceable, $clientRequestId, $metadata, $type) {
            $wallet = $this->wallets->lockForUser($userId);

            if ($existing = $this->existingEntry($userId, $clientRequestId)) {
                return $existing;
            }

            $newBalance = $wallet->balance + $amount;
            $wallet->balance = $newBalance;
            $wallet->lifetime_earned = $wallet->lifetime_earned + $amount;
            $wallet->save();

            return $this->writeEntry($userId, $amount, $newBalance, $type, $source, $sourceable, $clientRequestId, $metadata);
        });
    }

    /**
     * Spend points. Positive $amount only. Throws when the balance cannot
     * cover the spend. Idempotent when $clientRequestId matches.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function debit(
        int $userId,
        int $amount,
        PointSource $source,
        ?Model $sourceable = null,
        ?string $clientRequestId = null,
        array $metadata = [],
        PointLedgerType $type = PointLedgerType::Spend,
    ): PointLedgerEntry {
        $amount = max(0, $amount);

        return DB::transaction(function () use ($userId, $amount, $source, $sourceable, $clientRequestId, $metadata, $type) {
            $wallet = $this->wallets->lockForUser($userId);

            if ($existing = $this->existingEntry($userId, $clientRequestId)) {
                return $existing;
            }

            if ($wallet->balance < $amount) {
                throw InsufficientBalanceException::forPurchase($wallet->balance, $amount);
            }

            $newBalance = $wallet->balance - $amount;
            $wallet->balance = $newBalance;
            $wallet->lifetime_spent = $wallet->lifetime_spent + $amount;
            $wallet->save();

            return $this->writeEntry($userId, -$amount, $newBalance, $type, $source, $sourceable, $clientRequestId, $metadata);
        });
    }

    /**
     * Reduce the balance by up to $decreaseBy without ever going negative
     * (never claws back already-spent points). Used to reverse an earlier
     * award. Records a clamped, signed `adjust` entry and logs any clamp.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function adjust(
        int $userId,
        int $decreaseBy,
        PointSource $source,
        ?Model $sourceable = null,
        ?string $clientRequestId = null,
        array $metadata = [],
    ): PointLedgerEntry {
        $decreaseBy = max(0, $decreaseBy);

        return DB::transaction(function () use ($userId, $decreaseBy, $source, $sourceable, $clientRequestId, $metadata) {
            $wallet = $this->wallets->lockForUser($userId);

            if ($existing = $this->existingEntry($userId, $clientRequestId)) {
                return $existing;
            }

            $actual = min($decreaseBy, $wallet->balance);

            if ($actual < $decreaseBy) {
                Log::info('Points reversal clamped to floor balance at 0.', [
                    'user_id' => $userId,
                    'source' => $source->value,
                    'requested' => $decreaseBy,
                    'applied' => $actual,
                    'balance' => $wallet->balance,
                ]);
            }

            $newBalance = $wallet->balance - $actual;
            $wallet->balance = $newBalance;
            $wallet->save();

            return $this->writeEntry($userId, -$actual, $newBalance, PointLedgerType::Adjust, $source, $sourceable, $clientRequestId, $metadata);
        });
    }

    private function existingEntry(int $userId, ?string $clientRequestId): ?PointLedgerEntry
    {
        if ($clientRequestId === null) {
            return null;
        }

        return $this->ledger->findByClientRequestId($userId, $clientRequestId);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function writeEntry(
        int $userId,
        int $signedAmount,
        int $balanceAfter,
        PointLedgerType $type,
        PointSource $source,
        ?Model $sourceable,
        ?string $clientRequestId,
        array $metadata,
    ): PointLedgerEntry {
        return $this->ledger->create([
            'user_id' => $userId,
            'type' => $type->value,
            'source' => $source->value,
            'amount' => $signedAmount,
            'balance_after' => $balanceAfter,
            'sourceable_type' => $sourceable?->getMorphClass(),
            'sourceable_id' => $sourceable?->getKey(),
            'client_request_id' => $clientRequestId,
            'metadata' => $metadata !== [] ? $metadata : null,
        ]);
    }
}
