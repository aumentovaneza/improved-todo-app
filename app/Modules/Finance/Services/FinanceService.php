<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceLoan;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Repositories\FinanceAccountRepository;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Repositories\FinanceCategoryRepository;
use App\Modules\Finance\Repositories\FinanceLoanRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Repositories\FinanceTransactionRepository;
use App\Services\TagService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use App\Modules\Finance\Services\FinanceWalletService;

class FinanceService
{
    public function __construct(
        private FinanceTransactionRepository $transactionRepository,
        private FinanceCategoryRepository $categoryRepository,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceSavingsGoalRepository $savingsGoalRepository,
        private FinanceLoanRepository $loanRepository,
        private FinanceAccountRepository $accountRepository,
        private FinanceReportService $reportService,
        private TagService $tagService,
        private FinanceWalletService $walletService
    ) {}

    public function getDashboardData(int $userId): array
    {
        $transactions = $this->transactionRepository->getForUser($userId, 20);
        $categories = $this->categoryRepository->getForUser($userId);
        $savingsGoals = $this->savingsGoalRepository->getForUser($userId);
        $loans = $this->loanRepository->getForUser($userId)->loadCount('transactions');
        $accounts = $this->accountRepository->getForUser($userId);
        $loans->each(function ($loan) {
            $this->recalculateLoanRemaining($loan);
        });
        $reportData = $this->reportService->buildDashboardData($userId);
        $totalLoans = $loans->sum(function ($loan) {
            $remaining = (float) $loan->remaining_amount;
            $total = (float) $loan->total_amount;
            if ($remaining === 0.0 && $total > 0 && ($loan->transactions_count ?? 0) === 0) {
                return $total;
            }
            return $remaining;
        });
        $budgets = $this->getBudgetsForUser($userId, true);

        $availableCredit = $accounts
            ->where('type', 'credit-card')
            ->sum(function ($account) {
                return (float) ($account->available_credit ?? 0);
            });

        return [
            'transactions' => $transactions->values()->all(),
            'categories' => $categories->values()->all(),
            'summary' => array_merge($reportData['summary'], [
                'loans' => $totalLoans,
                'available_credit' => $availableCredit,
            ]),
            'charts' => $reportData['charts'],
            'budgets' => $budgets->values()->all(),
            'savings_goals' => $savingsGoals->values()->all(),
            'loans' => $loans->values()->all(),
            'accounts' => $accounts->values()->all(),
        ];
    }

    public function createTransaction(array $data, int $userId, int $actorUserId): FinanceTransaction
    {
        $data['user_id'] = $userId;
        $data['created_by_user_id'] = $actorUserId;
        if (($data['type'] ?? null) === 'transfer') {
            $data['finance_category_id'] = null;
            $data['finance_loan_id'] = null;
            $data['finance_savings_goal_id'] = null;
            $data['finance_budget_id'] = null;
            $data['finance_credit_card_account_id'] = null;
        }
        if (($data['type'] ?? null) === 'loan' && empty($data['finance_loan_id'])) {
            $loan = $this->createLoan([
                'name' => $data['description'] ?? 'Loan',
                'total_amount' => $data['amount'] ?? 0,
                'remaining_amount' => $data['amount'] ?? 0,
                'currency' => $data['currency'] ?? 'PHP',
                'notes' => $data['notes'] ?? null,
                'is_active' => true,
            ], $userId);
            $data['finance_loan_id'] = $loan->id;
        }
        $transaction = $this->transactionRepository->create($data);
        $this->syncTransactionTags($transaction, $data['tags'] ?? null);

        $this->applyTransactionImpact($transaction, 1);
        $this->triggerBudgetNotifications($userId);

        return $transaction->load([
            'category',
            'loan',
            'tags',
            'createdBy',
            'account',
            'transferAccount',
            'creditCardAccount',
        ]);
    }

    public function updateTransaction(FinanceTransaction $transaction, array $data, int $userId): FinanceTransaction
    {
        $this->ensureOwnership($transaction->user_id, $userId);

        $this->applyTransactionImpact($transaction, -1);
        $type = $data['type'] ?? $transaction->type;
        if ($type === 'transfer') {
            $data['finance_category_id'] = null;
            $data['finance_loan_id'] = null;
            $data['finance_savings_goal_id'] = null;
            $data['finance_budget_id'] = null;
            $data['finance_credit_card_account_id'] = null;
        }
        $updated = $this->transactionRepository->update($transaction, $data);
        $this->syncTransactionTags($updated, $data['tags'] ?? null);
        $this->syncLoanFromTransaction($updated);
        $this->applyTransactionImpact($updated, 1);
        $this->triggerBudgetNotifications($userId);

        return $updated->load([
            'category',
            'loan',
            'tags',
            'account',
            'transferAccount',
            'creditCardAccount',
        ]);
    }

    public function deleteTransaction(FinanceTransaction $transaction, int $userId): bool
    {
        $this->ensureOwnership($transaction->user_id, $userId);

        $this->applyTransactionImpact($transaction, -1);
        return $this->transactionRepository->delete($transaction);
    }

    public function createCategory(array $data, int $userId): FinanceCategory
    {
        $data['user_id'] = $userId;

        return $this->categoryRepository->create($data);
    }

    public function updateCategory(FinanceCategory $category, array $data, int $userId): FinanceCategory
    {
        $this->ensureOwnership($category->user_id, $userId);

        return $this->categoryRepository->update($category, $data);
    }

    public function deleteCategory(FinanceCategory $category, int $userId): bool
    {
        $this->ensureOwnership($category->user_id, $userId);

        return $this->categoryRepository->delete($category);
    }

    public function createBudget(array $data, int $userId): FinanceBudget
    {
        $data['user_id'] = $userId;
        $data['budget_type'] = $data['budget_type'] ?? 'spending';
        $budget = $this->budgetRepository->create($data);
        $this->attachMatchingTransactionsToBudget($budget);
        $this->refreshBudgetSpending(collect([$budget]), $userId);

        return $budget->refresh();
    }

    public function updateBudget(FinanceBudget $budget, array $data, int $userId): FinanceBudget
    {
        $this->ensureOwnership($budget->user_id, $userId);

        return $this->budgetRepository->update($budget, $data);
    }

    public function deleteBudget(FinanceBudget $budget, int $userId): bool
    {
        $this->ensureOwnership($budget->user_id, $userId);

        return $this->budgetRepository->delete($budget);
    }

    public function deleteBudgetWithReallocation(
        FinanceBudget $budget,
        array $data,
        int $userId
    ): bool {
        $this->ensureOwnership($budget->user_id, $userId);

        $remaining = max(0, (float) $budget->amount - (float) $budget->current_spent);
        $action = $data['action'] ?? 'none';

        if (
            $budget->budget_type === 'saved' &&
            $budget->is_active &&
            $remaining > 0 &&
            $action === 'none'
        ) {
            throw new \InvalidArgumentException(
                'Reallocation is required to delete a saved budget with remaining funds.'
            );
        }

        if ($remaining > 0 && $action === 'reallocate_budget') {
            $targetBudget = $this->budgetRepository->findForUser(
                $budget->user_id,
                (int) $data['target_budget_id']
            );
            $targetBudget->amount = (float) $targetBudget->amount + $remaining;
            $targetBudget->save();
        }

        if ($remaining > 0 && $action === 'add_to_savings_goal') {
            $goal = $this->savingsGoalRepository->findForUser(
                $budget->user_id,
                (int) $data['target_goal_id']
            );
            $this->savingsGoalRepository->adjustCurrentAmount($goal, $remaining);
            if (!$goal->is_active) {
                $goal->is_active = true;
                $goal->save();
            }
            $this->handleSavingsGoalCompletion($goal->refresh());
        }

        if ($remaining > 0 && $action === 'create_budget') {
            $this->budgetRepository->create([
                'user_id' => $budget->user_id,
                'finance_category_id' => $data['new_budget_category_id'] ?? null,
                'finance_account_id' => $data['new_budget_account_id'] ?? null,
                'budget_type' => 'spending',
                'name' => $data['new_budget_name'] ?? 'New budget',
                'amount' => $remaining,
                'current_spent' => 0,
                'currency' => $budget->currency ?? 'PHP',
                'period' => null,
                'is_recurring' => false,
                'starts_on' => null,
                'ends_on' => null,
                'is_active' => true,
            ]);
        }

        return $this->budgetRepository->delete($budget);
    }

    public function getBudgetsForUser(int $userId, bool $onlyActive = false)
    {
        $budgets = $onlyActive
            ? $this->budgetRepository->getActiveForUser($userId)
            : $this->budgetRepository->getForUser($userId);

        return $this->refreshBudgetSpending($budgets, $userId);
    }

    public function createSavingsGoal(array $data, int $userId): FinanceSavingsGoal
    {
        $data['user_id'] = $userId;
        $data['current_amount'] = $data['current_amount'] ?? 0;

        $goal = $this->savingsGoalRepository->create($data);
        $this->handleSavingsGoalCompletion($goal);

        return $goal->refresh();
    }

    public function createAccount(array $data, int $userId, int $actorUserId): FinanceAccount
    {
        $data['user_id'] = $userId;
        $startingBalance = (float) ($data['starting_balance'] ?? 0);
        $isCreditCard = ($data['type'] ?? null) === 'credit-card';
        $data['current_balance'] = (!$isCreditCard && $startingBalance > 0)
            ? 0
            : $startingBalance;

        $account = $this->accountRepository->create($data);

        if (!$isCreditCard && $startingBalance > 0) {
            $this->createTransaction([
                'finance_category_id' => null,
                'finance_account_id' => $account->id,
                'type' => 'income',
                'amount' => $startingBalance,
                'currency' => $account->currency ?? ($data['currency'] ?? 'PHP'),
                'description' => 'Opening balance',
                'notes' => null,
                'payment_method' => null,
                'metadata' => ['source' => 'opening_balance'],
                'occurred_at' => now(),
            ], $userId, $actorUserId);
        }

        return $account->refresh();
    }

    public function updateAccount(FinanceAccount $account, array $data, int $userId): FinanceAccount
    {
        $this->ensureOwnership($account->user_id, $userId);

        return $this->accountRepository->update($account, $data);
    }

    public function deleteAccount(FinanceAccount $account, int $userId): bool
    {
        $this->ensureOwnership($account->user_id, $userId);

        return $this->accountRepository->delete($account);
    }

    public function updateSavingsGoal(FinanceSavingsGoal $goal, array $data, int $userId): FinanceSavingsGoal
    {
        $this->ensureOwnership($goal->user_id, $userId);

        $updated = $this->savingsGoalRepository->update($goal, $data);
        $this->handleSavingsGoalCompletion($updated);

        return $updated->refresh();
    }

    public function deleteSavingsGoal(FinanceSavingsGoal $goal, int $userId): bool
    {
        $this->ensureOwnership($goal->user_id, $userId);

        return $this->savingsGoalRepository->delete($goal);
    }

    public function convertSavingsGoalToBudget(FinanceSavingsGoal $goal, int $userId): FinanceBudget
    {
        $this->ensureOwnership($goal->user_id, $userId);

        if ($goal->converted_finance_budget_id) {
            return $this->budgetRepository->findForUser(
                $goal->user_id,
                $goal->converted_finance_budget_id
            );
        }

        $budgetAmount = (float) $goal->current_amount > 0
            ? (float) $goal->current_amount
            : (float) $goal->target_amount;

        $budget = $this->budgetRepository->create([
            'user_id' => $goal->user_id,
            'finance_category_id' => null,
            'finance_account_id' => $goal->finance_account_id,
            'budget_type' => 'saved',
            'name' => $goal->name,
            'amount' => $budgetAmount,
            'current_spent' => 0,
            'currency' => $goal->currency ?? 'PHP',
            'period' => null,
            'is_recurring' => false,
            'starts_on' => null,
            'ends_on' => null,
            'is_active' => true,
        ]);

        $goal->converted_finance_budget_id = $budget->id;
        $goal->is_active = false;
        $goal->save();

        return $budget->refresh();
    }

    public function closeBudget(FinanceBudget $budget, array $data, int $userId): FinanceBudget
    {
        $this->ensureOwnership($budget->user_id, $userId);

        $remaining = max(0, (float) $budget->amount - (float) $budget->current_spent);
        $action = $data['action'] ?? 'none';

        if ($remaining > 0 && $action === 'reallocate_budget') {
            $targetBudget = $this->budgetRepository->findForUser(
                $budget->user_id,
                (int) $data['target_budget_id']
            );
            $targetBudget->amount = (float) $targetBudget->amount + $remaining;
            $targetBudget->save();
        }

        if ($remaining > 0 && $action === 'add_to_savings_goal') {
            $goal = $this->savingsGoalRepository->findForUser(
                $budget->user_id,
                (int) $data['target_goal_id']
            );
            $this->savingsGoalRepository->adjustCurrentAmount($goal, $remaining);
            $this->handleSavingsGoalCompletion($goal->refresh());
        }

        $budget->is_active = false;
        $budget->save();

        return $budget->refresh();
    }

    public function createLoan(array $data, int $userId): FinanceLoan
    {
        $data['user_id'] = $userId;
        if (!isset($data['remaining_amount']) || $data['remaining_amount'] === null || $data['remaining_amount'] === '') {
            $data['remaining_amount'] = $data['total_amount'] ?? 0;
        }

        return $this->loanRepository->create($data);
    }

    public function updateLoan(FinanceLoan $loan, array $data, int $userId): FinanceLoan
    {
        $this->ensureOwnership($loan->user_id, $userId);

        if (
            array_key_exists('remaining_amount', $data) &&
            ($data['remaining_amount'] === null || $data['remaining_amount'] === '')
        ) {
            $data['remaining_amount'] = $data['total_amount'] ?? $loan->total_amount ?? 0;
        }

        return $this->loanRepository->update($loan, $data);
    }

    public function deleteLoan(FinanceLoan $loan, int $userId): bool
    {
        $this->ensureOwnership($loan->user_id, $userId);

        return $this->loanRepository->delete($loan);
    }

    private function applyTransactionImpact(FinanceTransaction $transaction, int $direction): void
    {
        if ($transaction->type === 'transfer') {
            $this->adjustTransferBalances($transaction, $direction);
            return;
        }

        if ($transaction->type === 'savings' && $transaction->finance_savings_goal_id) {
            $goal = $this->savingsGoalRepository->findOptionalForUser(
                $transaction->user_id,
                $transaction->finance_savings_goal_id
            );

            if ($goal) {
                $updatedGoal = $this->savingsGoalRepository->adjustCurrentAmount(
                    $goal,
                    $direction * (float) $transaction->amount
                );
                $this->handleSavingsGoalCompletion($updatedGoal);
            }
        }

        if ($transaction->type === 'expense' && $transaction->finance_loan_id) {
            $this->adjustLoanBalance($transaction, $direction);
        }

        if ($transaction->type === 'expense' && !$transaction->finance_loan_id) {
            $this->adjustBudgetsForExpense($transaction, $direction);
        }

        if ($transaction->finance_account_id) {
            $this->adjustAccountBalance($transaction, $direction);
        }

        if ($transaction->finance_credit_card_account_id) {
            $this->adjustCreditCardPayment($transaction, $direction);
        }
    }

    private function adjustTransferBalances(FinanceTransaction $transaction, int $direction): void
    {
        if (!$transaction->finance_account_id) {
            return;
        }

        if (
            $transaction->finance_transfer_account_id &&
            $transaction->finance_account_id === $transaction->finance_transfer_account_id
        ) {
            return;
        }

        $fee = 0.0;
        if (is_array($transaction->metadata ?? null)) {
            $fee = (float) ($transaction->metadata['transfer_fee'] ?? 0);
        }
        $amount = ((float) $transaction->amount + $fee) * $direction;

        $source = $this->accountRepository->findOptionalForUser(
            $transaction->user_id,
            $transaction->finance_account_id
        );
        $destination = null;
        if ($transaction->finance_transfer_account_id) {
            $destination = $this->accountRepository->findOptionalForUser(
                $transaction->user_id,
                $transaction->finance_transfer_account_id
            );
        }

        if ($source) {
            $this->accountRepository->adjustBalance($source, $amount * -1);
        }

        if ($destination) {
            $this->accountRepository->adjustBalance($destination, $amount);
        }
    }

    private function adjustAccountBalance(FinanceTransaction $transaction, int $direction): void
    {
        $account = $this->accountRepository->findOptionalForUser(
            $transaction->user_id,
            $transaction->finance_account_id
        );

        if (!$account) {
            return;
        }

        $amount = (float) $transaction->amount * $direction;
        $delta = match ($transaction->type) {
            'expense' => $amount * -1,
            default => $amount,
        };

        $this->accountRepository->adjustBalance($account, $delta);
    }

    private function adjustCreditCardPayment(FinanceTransaction $transaction, int $direction): void
    {
        $account = $this->accountRepository->findOptionalForUser(
            $transaction->user_id,
            $transaction->finance_credit_card_account_id
        );

        if (!$account) {
            return;
        }

        $amount = (float) $transaction->amount * $direction;
        $this->accountRepository->adjustBalance($account, $amount);
    }

    private function syncLoanFromTransaction(FinanceTransaction $transaction): void
    {
        if ($transaction->type !== 'loan' || !$transaction->finance_loan_id) {
            return;
        }

        $loan = $this->loanRepository->findOptionalForUser(
            $transaction->user_id,
            $transaction->finance_loan_id
        );

        if (!$loan) {
            return;
        }

        $loan->total_amount = (float) $transaction->amount;
        $loan->currency = $transaction->currency ?: $loan->currency;
        if (!$loan->name && $transaction->description) {
            $loan->name = $transaction->description;
        }
        $loan->save();

        $this->recalculateLoanRemaining($loan);
    }

    private function adjustBudgetsForExpense(FinanceTransaction $transaction, int $direction): void
    {
        $occurredAt = $transaction->occurred_at
            ? Carbon::parse($transaction->occurred_at)
            : now();

        if ($transaction->finance_budget_id) {
            $budget = $this->budgetRepository->findForUser(
                $transaction->user_id,
                $transaction->finance_budget_id
            );

            $updatedBudget = $this->budgetRepository->adjustSpent(
                $budget,
                $direction * (float) $transaction->amount
            );
            $this->closeBudgetIfFulfilled($updatedBudget);

            return;
        }

        $budgets = $this->budgetRepository->getActiveForUser($transaction->user_id);

        foreach ($budgets as $budget) {
            if (!$this->transactionMatchesBudget($transaction, $budget, $occurredAt)) {
                continue;
            }

            $updatedBudget = $this->budgetRepository->adjustSpent(
                $budget,
                $direction * (float) $transaction->amount
            );
            $this->closeBudgetIfFulfilled($updatedBudget);
        }
    }

    private function transactionMatchesBudget(
        FinanceTransaction $transaction,
        FinanceBudget $budget,
        Carbon $occurredAt
    ): bool {
        if ($budget->finance_category_id && $transaction->finance_category_id !== $budget->finance_category_id) {
            return false;
        }

        if ($budget->finance_account_id && $transaction->finance_account_id !== $budget->finance_account_id) {
            return false;
        }

        if ($budget->starts_on && $occurredAt->lt($budget->starts_on)) {
            return false;
        }

        if ($budget->ends_on && $occurredAt->gt($budget->ends_on)) {
            return false;
        }

        return true;
    }

    private function adjustLoanBalance(FinanceTransaction $transaction, int $direction): void
    {
        $loan = $this->loanRepository->findOptionalForUser(
            $transaction->user_id,
            $transaction->finance_loan_id
        );

        if (!$loan) {
            return;
        }

        $this->recalculateLoanRemaining($loan);
    }

    private function refreshBudgetSpending($budgets, int $userId)
    {
        foreach ($budgets as $budget) {
            $query = FinanceTransaction::query()
                ->where('user_id', $userId)
                ->where('type', 'expense')
                ->whereNull('finance_loan_id');

            if ($budget->finance_category_id) {
                $query->where('finance_category_id', $budget->finance_category_id);
            }

            if ($budget->finance_account_id) {
                $query->where('finance_account_id', $budget->finance_account_id);
            }

            if ($budget->starts_on) {
                $query->where('occurred_at', '>=', $budget->starts_on->startOfDay());
            }

            if ($budget->ends_on) {
                $query->where('occurred_at', '<=', $budget->ends_on->endOfDay());
            }

            $explicitQuery = (clone $query)->where('finance_budget_id', $budget->id);
            $explicitTotal = (float) $explicitQuery->sum('amount');

            if ($explicitTotal > 0) {
                $budget->current_spent = $explicitTotal;
                $this->closeBudgetIfFulfilled($budget);
                continue;
            }

            $budget->current_spent = (float) $query
                ->whereNull('finance_budget_id')
                ->sum('amount');
            $this->closeBudgetIfFulfilled($budget);
        }

        return $budgets;
    }

    private function recalculateLoanRemaining(FinanceLoan $loan): void
    {
        $paid = FinanceTransaction::query()
            ->where('user_id', $loan->user_id)
            ->where('type', 'expense')
            ->where('finance_loan_id', $loan->id)
            ->sum('amount');

        if ((float) $paid <= 0) {
            return;
        }

        $loan->remaining_amount = max(0, (float) $loan->total_amount - (float) $paid);
        $loan->save();
    }

    private function ensureOwnership(?int $ownerId, int $userId): void
    {
        if (!$ownerId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to modify this finance data.');
        }

        $this->walletService->ensureCanAccessWallet($userId, $ownerId);
    }

    private function triggerBudgetNotifications(int $userId): void
    {
        // Hook point for future reminders (email, in-app, push).
        Log::info('Finance budget notification hook triggered.', [
            'user_id' => $userId,
            'type' => 'finance_budget_check',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    private function syncTransactionTags(FinanceTransaction $transaction, ?array $tags): void
    {
        if ($tags === null) {
            return;
        }

        $tagIds = !empty($tags) ? $this->tagService->processTagsData($tags) : [];
        $transaction->tags()->sync($tagIds);
    }

    private function handleSavingsGoalCompletion(FinanceSavingsGoal $goal): void
    {
        if ($goal->converted_finance_budget_id) {
            return;
        }

        $target = (float) $goal->target_amount;
        $current = (float) $goal->current_amount;

        if ($target > 0 && $current >= $target) {
            $this->convertSavingsGoalToBudget($goal, $goal->user_id);
        }
    }

    private function closeBudgetIfFulfilled(FinanceBudget $budget): void
    {
        if (!$budget->is_active) {
            return;
        }

        if ($budget->is_recurring) {
            return;
        }

        if ((float) $budget->current_spent >= (float) $budget->amount) {
            $budget->is_active = false;
            $budget->save();
        }
    }

    private function attachMatchingTransactionsToBudget(FinanceBudget $budget): void
    {
        if (!$budget->finance_category_id) {
            return;
        }

        $query = FinanceTransaction::query()
            ->where('user_id', $budget->user_id)
            ->where('type', 'expense')
            ->whereNull('finance_loan_id')
            ->whereNull('finance_budget_id')
            ->where('finance_category_id', $budget->finance_category_id);

        if ($budget->finance_account_id) {
            $query->where('finance_account_id', $budget->finance_account_id);
        }

        if ($budget->starts_on) {
            $query->where('occurred_at', '>=', $budget->starts_on->startOfDay());
        }

        if ($budget->ends_on) {
            $query->where('occurred_at', '<=', $budget->ends_on->endOfDay());
        }

        $query->update(['finance_budget_id' => $budget->id]);
    }
}
