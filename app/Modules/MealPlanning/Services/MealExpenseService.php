<?php

namespace App\Modules\MealPlanning\Services;

use App\Models\User;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use App\Modules\MealPlanning\Models\MealDiaryEntry;
use App\Modules\MealPlanning\Models\PlannedFoodExpense;
use Illuminate\Support\Facades\DB;

class MealExpenseService
{
    public function __construct(private FinanceService $finance, private FinanceWalletService $wallets) {}

    public function confirm(PlannedFoodExpense $expense, User $actor, array $data): PlannedFoodExpense
    {
        if ($expense->status === 'confirmed') {
            return $expense;
        }
        $walletUserId = (int) ($data['wallet_user_id'] ?? $actor->id);
        $this->wallets->ensureCanAccessWallet($actor->id, $walletUserId);

        return DB::transaction(function () use ($expense, $actor, $data, $walletUserId) {
            $transaction = $this->finance->createTransaction([
                'client_request_id' => $expense->idempotency_key,
                'finance_category_id' => $data['finance_category_id'] ?? null,
                'finance_account_id' => $data['finance_account_id'] ?? null,
                'type' => 'expense', 'amount' => $expense->amount, 'currency' => $expense->currency,
                'description' => $data['description'] ?? 'Planned groceries',
                'notes' => $data['notes'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'metadata' => ['source' => 'meal_planning', 'planned_food_expense_id' => $expense->id, 'household_id' => $expense->household_id],
                'occurred_at' => $data['occurred_at'] ?? now(),
            ], $walletUserId, $actor->id);
            $expense->update(['wallet_user_id' => $walletUserId, 'finance_transaction_id' => $transaction->id, 'status' => 'confirmed', 'confirmed_at' => now()]);
            if ($expense->diary_entry_id) {
                MealDiaryEntry::whereKey($expense->diary_entry_id)->update(['finance_transaction_id' => $transaction->id]);
            }

            return $expense->fresh();
        });
    }
}
