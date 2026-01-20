<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Repositories\FinanceReportRepository;
use App\Modules\Finance\Repositories\FinanceTransactionRepository;
use Carbon\Carbon;

class FinanceReportService
{
    public function __construct(
        private FinanceTransactionRepository $transactionRepository,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceReportRepository $reportRepository
    ) {}

    public function buildDashboardData(int $userId): array
    {
        $periodStart = now()->startOfMonth();
        $periodEnd = now()->endOfMonth();

        $totals = $this->transactionRepository->getTotalsForUser($userId, $periodStart, $periodEnd);
        $budgets = $this->budgetRepository->getActiveForUser($userId);

        $budgetTotal = $budgets->sum('amount');
        $budgetUtilization = $budgetTotal > 0
            ? round(($totals['expense'] / $budgetTotal) * 100, 1)
            : 0;

        $categoryBreakdown = $this->buildCategoryBreakdown(
            $userId,
            $periodStart->copy(),
            $periodEnd->copy()
        );

        return [
            'summary' => [
                'period' => [
                    'start' => $periodStart->toDateString(),
                    'end' => $periodEnd->toDateString(),
                ],
                'income' => $totals['income'],
                'expenses' => $totals['expense'],
                'savings' => $totals['savings'],
                'unallocated' => $totals['income'] + $totals['loan'] - $totals['savings'] - $totals['expense'],
                'borrowed' => $totals['loan'],
                'net' => $totals['income'] + $totals['loan'] - $totals['expense'],
                'budget_utilization' => $budgetUtilization,
            ],
            'charts' => [
                'income_vs_expense' => $this->buildMonthlyIncomeExpense($userId),
                'trend' => $this->buildDailyTrend($userId),
                'category_breakdown' => $categoryBreakdown,
            ],
            'budgets' => $budgets->values()->all(),
        ];
    }

    public function generateSnapshot(int $userId, string $reportType, Carbon $periodStart, Carbon $periodEnd): array
    {
        $totals = $this->transactionRepository->getTotalsForUser($userId, $periodStart, $periodEnd);
        $payload = [
            'totals' => $totals,
            'category_breakdown' => $this->buildCategoryBreakdown($userId, $periodStart, $periodEnd),
        ];

        $report = $this->reportRepository->create([
            'user_id' => $userId,
            'report_type' => $reportType,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'payload' => $payload,
            'generated_at' => now(),
        ]);

        return $report->toArray();
    }

    private function buildMonthlyIncomeExpense(int $userId): array
    {
        $monthlyTotals = $this->transactionRepository->getMonthlyTotals($userId, 6);
        $grouped = [];

        foreach ($monthlyTotals as $row) {
            $period = $row->period;
            $grouped[$period] ??= ['period' => $period, 'income' => 0, 'expense' => 0];
            $grouped[$period][$row->type] = (float) $row->total;
        }

        return array_values($grouped);
    }

    private function buildDailyTrend(int $userId): array
    {
        $dailyTotals = $this->transactionRepository->getDailyTotals($userId, 14);
        $grouped = [];

        foreach ($dailyTotals as $row) {
            $period = $row->period;
            $grouped[$period] ??= ['period' => $period, 'income' => 0, 'expense' => 0, 'savings' => 0];
            $grouped[$period][$row->type] = (float) $row->total;
        }

        return array_values($grouped);
    }

    private function buildCategoryBreakdown(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        $categoryTotals = $this->transactionRepository->getCategoryTotalsForTypes(
            $userId,
            $startDate,
            $endDate,
            ['expense', 'savings']
        );

        return $categoryTotals->map(function ($row) {
            $categoryName = $row->category?->name ?? 'Uncategorized';
            $label = $row->type === 'savings'
                ? "{$categoryName} (Savings)"
                : $categoryName;

            return [
                'name' => $categoryName,
                'label' => $label,
                'total' => (float) $row->total,
                'color' => $row->type === 'savings'
                    ? '#8B5CF6'
                    : ($row->category?->color ?? '#94A3B8'),
                'type' => $row->type,
            ];
        })->values()->all();
    }
}
