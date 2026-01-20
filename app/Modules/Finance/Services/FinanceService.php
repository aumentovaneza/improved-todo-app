<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceLoan;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
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
        $budgets = $this->refreshBudgetSpending(
            $this->budgetRepository->getActiveForUser($userId),
            $userId
        );

        return [
            'transactions' => $transactions->values()->all(),
            'categories' => $categories->values()->all(),
            'summary' => array_merge($reportData['summary'], [
                'loans' => $totalLoans,
            ]),
            'charts' => $reportData['charts'],
            'budgets' => $budgets->values()->all(),
            'savings_goals' => $savingsGoals->values()->all(),
            'loans' => $loans->values()->all(),
        ];
    }

    public function createTransaction(array $data, int $userId, int $actorUserId): FinanceTransaction
    {
        $data['user_id'] = $userId;
        $data['created_by_user_id'] = $actorUserId;
        $transaction = $this->transactionRepository->create($data);
        $this->syncTransactionTags($transaction, $data['tags'] ?? null);

        $this->applyTransactionImpact($transaction, 1);
        $this->triggerBudgetNotifications($userId);

        return $transaction->load(['category', 'loan', 'tags', 'createdBy']);
    }

    public function updateTransaction(FinanceTransaction $transaction, array $data, int $userId): FinanceTransaction
    {
        $this->ensureOwnership($transaction->user_id, $userId);

        $this->applyTransactionImpact($transaction, -1);
        $updated = $this->transactionRepository->update($transaction, $data);
        $this->syncTransactionTags($updated, $data['tags'] ?? null);
        $this->applyTransactionImpact($updated, 1);
        $this->triggerBudgetNotifications($userId);

        return $updated->load(['category', 'loan', 'tags']);
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

        return $this->budgetRepository->create($data);
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

    public function createSavingsGoal(array $data, int $userId): FinanceSavingsGoal
    {
        $data['user_id'] = $userId;
        $data['current_amount'] = $data['current_amount'] ?? 0;

        return $this->savingsGoalRepository->create($data);
    }

    public function updateSavingsGoal(FinanceSavingsGoal $goal, array $data, int $userId): FinanceSavingsGoal
    {
        $this->ensureOwnership($goal->user_id, $userId);

        return $this->savingsGoalRepository->update($goal, $data);
    }

    public function deleteSavingsGoal(FinanceSavingsGoal $goal, int $userId): bool
    {
        $this->ensureOwnership($goal->user_id, $userId);

        return $this->savingsGoalRepository->delete($goal);
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

        return $this->loanRepository->update($loan, $data);
    }

    public function deleteLoan(FinanceLoan $loan, int $userId): bool
    {
        $this->ensureOwnership($loan->user_id, $userId);

        return $this->loanRepository->delete($loan);
    }

    private function applyTransactionImpact(FinanceTransaction $transaction, int $direction): void
    {
        if ($transaction->type === 'savings' && $transaction->finance_savings_goal_id) {
            $goal = $this->savingsGoalRepository->findOptionalForUser(
                $transaction->user_id,
                $transaction->finance_savings_goal_id
            );

            if ($goal) {
                $this->savingsGoalRepository->adjustCurrentAmount(
                    $goal,
                    $direction * (float) $transaction->amount
                );
            }
        }

        if ($transaction->type === 'expense' && $transaction->finance_loan_id) {
            $this->adjustLoanBalance($transaction, $direction);
        }

        if ($transaction->type === 'expense' && !$transaction->finance_loan_id) {
            $this->adjustBudgetsForExpense($transaction, $direction);
        }
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

            $this->budgetRepository->adjustSpent(
                $budget,
                $direction * (float) $transaction->amount
            );

            return;
        }

        $budgets = $this->budgetRepository->getActiveForUser($transaction->user_id);

        foreach ($budgets as $budget) {
            if (!$this->transactionMatchesBudget($transaction, $budget, $occurredAt)) {
                continue;
            }

            $this->budgetRepository->adjustSpent(
                $budget,
                $direction * (float) $transaction->amount
            );
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
                continue;
            }

            $budget->current_spent = (float) $query
                ->whereNull('finance_budget_id')
                ->sum('amount');
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
}
