<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceAccount;
use Illuminate\Database\Eloquent\Collection;

class FinanceAccountRepository
{
    public function getForUser(int $userId): Collection
    {
        return FinanceAccount::where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();
    }

    public function findForUser(int $userId, int $accountId): FinanceAccount
    {
        return FinanceAccount::where('user_id', $userId)->findOrFail($accountId);
    }

    public function findOptionalForUser(int $userId, int $accountId): ?FinanceAccount
    {
        return FinanceAccount::where('user_id', $userId)->find($accountId);
    }

    public function create(array $data): FinanceAccount
    {
        if (($data['type'] ?? null) === 'credit-card') {
            $creditLimit = (float) ($data['credit_limit'] ?? 0);
            $usedCredit = (float) ($data['used_credit'] ?? 0);
            $data['credit_limit'] = $creditLimit;
            $data['used_credit'] = min($creditLimit, max(0, $usedCredit));
            $data['available_credit'] = max(0, $creditLimit - $data['used_credit']);
            $data['starting_balance'] = 0;
            $data['current_balance'] = 0;
        }

        return FinanceAccount::create($data);
    }

    public function update(FinanceAccount $account, array $data): FinanceAccount
    {
        $originalStarting = (float) $account->starting_balance;
        $originalCreditLimit = (float) ($account->credit_limit ?? 0);
        $originalUsedCredit = (float) ($account->used_credit ?? 0);
        $account->fill($data);

        if (array_key_exists('starting_balance', $data) && $account->type !== 'credit-card') {
            $nextStarting = (float) $data['starting_balance'];
            $delta = $nextStarting - $originalStarting;
            $account->current_balance = (float) $account->current_balance + $delta;
        }

        if ($account->type === 'credit-card') {
            if (array_key_exists('credit_limit', $data)) {
                $account->credit_limit = (float) $data['credit_limit'];
            }

            if (array_key_exists('used_credit', $data)) {
                $account->used_credit = (float) $data['used_credit'];
            }

            if (array_key_exists('credit_limit', $data) || array_key_exists('used_credit', $data)) {
                $limit = (float) ($account->credit_limit ?? $originalCreditLimit);
                $nextUsed = (float) ($account->used_credit ?? $originalUsedCredit);
                $nextUsed = min($limit, max(0, $nextUsed));
                $account->used_credit = $nextUsed;
                $account->available_credit = max(0, $limit - $nextUsed);
            }
        }

        $account->save();

        return $account->refresh();
    }

    public function adjustBalance(FinanceAccount $account, float $delta): FinanceAccount
    {
        if ($account->type === 'credit-card') {
            $limit = (float) ($account->credit_limit ?? 0);
            $nextAvailable = (float) ($account->available_credit ?? 0) + $delta;
            $account->available_credit = min($limit, max(0, $nextAvailable));
            $nextUsed = (float) ($account->used_credit ?? 0) - $delta;
            $account->used_credit = min($limit, max(0, $nextUsed));
        } else {
            $account->current_balance = (float) $account->current_balance + $delta;
        }
        $account->save();

        return $account->refresh();
    }

    public function delete(FinanceAccount $account): bool
    {
        return (bool) $account->delete();
    }
}
