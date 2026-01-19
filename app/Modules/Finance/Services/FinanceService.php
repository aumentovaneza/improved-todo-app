<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Repositories\FinanceCategoryRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Repositories\FinanceTransactionRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class FinanceService
{
    public function __construct(
        private FinanceTransactionRepository $transactionRepository,
        private FinanceCategoryRepository $categoryRepository,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceSavingsGoalRepository $savingsGoalRepository,
        private FinanceReportService $reportService
    ) {}

    public function getDashboardData(int $userId): array
    {
        $transactions = $this->transactionRepository->getForUser($userId, 20);
        $categories = $this->categoryRepository->getForUser($userId);
        $savingsGoals = $this->savingsGoalRepository->getForUser($userId);
        $reportData = $this->reportService->buildDashboardData($userId);

        return [
            'transactions' => $transactions->values()->all(),
            'categories' => $categories->values()->all(),
            'summary' => $reportData['summary'],
            'charts' => $reportData['charts'],
            'budgets' => $reportData['budgets'],
            'savings_goals' => $savingsGoals->values()->all(),
        ];
    }

    public function createTransaction(array $data, int $userId): FinanceTransaction
    {
        $data['user_id'] = $userId;
        $transaction = $this->transactionRepository->create($data);

        $this->applyTransactionImpact($transaction, 1);
        $this->triggerBudgetNotifications($userId);

        return $transaction->load('category');
    }

    public function updateTransaction(FinanceTransaction $transaction, array $data, int $userId): FinanceTransaction
    {
        $this->ensureOwnership($transaction->user_id, $userId);

        $this->applyTransactionImpact($transaction, -1);
        $updated = $this->transactionRepository->update($transaction, $data);
        $this->applyTransactionImpact($updated, 1);
        $this->triggerBudgetNotifications($userId);

        return $updated->load('category');
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

        if ($transaction->type === 'expense') {
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

    private function ensureOwnership(?int $ownerId, int $userId): void
    {
        if ($ownerId !== $userId) {
            throw new UnauthorizedHttpException('', 'You do not have permission to modify this finance data.');
        }
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
}
