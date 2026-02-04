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

    private function validateCreditCardBounds(FinanceAccount $account): void
    {
        if ($account->type !== 'credit-card') {
            return;
        }

        $limit = (float) ($account->credit_limit ?? 0);
        $used = (float) ($account->used_credit ?? 0);
        $available = (float) ($account->available_credit ?? 0);

        // Ensure used credit doesn't exceed limit
        $used = min($limit, max(0, $used));

        // If used credit is 0, available should be full limit
        if ($used === 0) {
            $available = $limit;
        } else {
            // Otherwise ensure available doesn't exceed limit - used
            $available = min($limit - $used, max(0, $available));
        }

        $account->used_credit = $used;
        $account->available_credit = $available;
    }

    public function create(array $data): FinanceAccount
    {
        if (($data['type'] ?? null) === 'credit-card') {
            $creditLimit = (float) ($data['credit_limit'] ?? 0);
            $usedCredit = (float) ($data['used_credit'] ?? 0);
            $data['credit_limit'] = $creditLimit;
            $data['used_credit'] = min($creditLimit, max(0, $usedCredit));
            $data['available_credit'] = $creditLimit - $data['used_credit'];
            $data['starting_balance'] = 0;
            $data['current_balance'] = 0;
        }

        $account = FinanceAccount::create($data);
        $this->validateCreditCardBounds($account);
        $account->save();

        return $account->refresh();
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
                
                // Ensure used credit doesn't go negative
                $nextUsed = max(0, $nextUsed);
                
                // If credit is fully paid (used_credit = 0), revert to full limit
                if ($nextUsed === 0) {
                    $account->used_credit = 0;
                    $account->available_credit = $limit;
                } else {
                    // Otherwise ensure values stay within bounds
                    $account->used_credit = min($limit, $nextUsed);
                    $account->available_credit = $limit - $account->used_credit;
                }
            }
        }

        $this->validateCreditCardBounds($account);
        $account->save();

        return $account->refresh();
    }

    public function adjustBalance(FinanceAccount $account, float $delta): FinanceAccount
    {
        if ($account->type === 'credit-card') {
            $limit = (float) ($account->credit_limit ?? 0);
            $nextAvailable = (float) ($account->available_credit ?? 0) + $delta;
            $nextUsed = (float) ($account->used_credit ?? 0) - $delta;
            
            // Ensure used credit doesn't go negative
            $nextUsed = max(0, $nextUsed);
            
            // If credit is fully paid (used_credit = 0), revert to full limit
            if ($nextUsed === 0) {
                $nextAvailable = $limit;
                $nextUsed = 0;
            } else {
                // Otherwise ensure values stay within bounds
                $nextUsed = min($limit, $nextUsed);
                $nextAvailable = $limit - $nextUsed;
            }
            
            $account->available_credit = $nextAvailable;
            $account->used_credit = $nextUsed;
        } else {
            $account->current_balance = (float) $account->current_balance + $delta;
        }
        $this->validateCreditCardBounds($account);
        $account->save();

        return $account->refresh();
    }

    public function delete(FinanceAccount $account): bool
    {
        return (bool) $account->delete();
    }
}
