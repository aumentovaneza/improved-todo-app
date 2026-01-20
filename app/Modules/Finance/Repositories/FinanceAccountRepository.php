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
            $data['credit_limit'] = $creditLimit;
            $data['available_credit'] = $creditLimit;
            $data['starting_balance'] = 0;
            $data['current_balance'] = 0;
        }

        return FinanceAccount::create($data);
    }

    public function update(FinanceAccount $account, array $data): FinanceAccount
    {
        $originalStarting = (float) $account->starting_balance;
        $originalCreditLimit = (float) ($account->credit_limit ?? 0);
        $account->fill($data);

        if (array_key_exists('starting_balance', $data)) {
            $nextStarting = (float) $data['starting_balance'];
            $delta = $nextStarting - $originalStarting;
            $account->current_balance = (float) $account->current_balance + $delta;
        }

        if ($account->type === 'credit-card' && array_key_exists('credit_limit', $data)) {
            $nextLimit = (float) $data['credit_limit'];
            $delta = $nextLimit - $originalCreditLimit;
            $nextAvailable = (float) ($account->available_credit ?? 0) + $delta;
            $account->credit_limit = $nextLimit;
            $account->available_credit = min(
                $nextLimit,
                max(0, $nextAvailable)
            );
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
