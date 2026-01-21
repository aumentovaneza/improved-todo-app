<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceTransaction;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FinanceTransactionRepository
{
    public function getForUser(int $userId, int $limit = 100): Collection
    {
        return FinanceTransaction::with([
            'category',
            'loan',
            'tags',
            'createdBy',
            'account',
            'transferAccount',
            'creditCardAccount',
        ])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function create(array $data): FinanceTransaction
    {
        return FinanceTransaction::create($data);
    }

    public function update(FinanceTransaction $transaction, array $data): FinanceTransaction
    {
        $transaction->update($data);

        return $transaction->refresh();
    }

    public function delete(FinanceTransaction $transaction): bool
    {
        return (bool) $transaction->delete();
    }

    public function getTotalsForUser(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        $totals = FinanceTransaction::where('user_id', $userId)
            ->whereBetween('occurred_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->pluck('total', 'type')
            ->all();

        $externalTransfers = (float) FinanceTransaction::where('user_id', $userId)
            ->where('type', 'transfer')
            ->where('metadata->transfer_destination', 'external')
            ->whereBetween('occurred_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->sum('amount');

        return [
            'income' => (float) ($totals['income'] ?? 0),
            'expense' => (float) ($totals['expense'] ?? 0) + $externalTransfers,
            'savings' => (float) ($totals['savings'] ?? 0),
            'loan' => (float) ($totals['loan'] ?? 0),
        ];
    }

    public function getMonthlyTotals(int $userId, int $monthsBack = 6): Collection
    {
        $start = now()->subMonths($monthsBack - 1)->startOfMonth();

        $monthlyTotals = FinanceTransaction::where('user_id', $userId)
            ->where('occurred_at', '>=', $start)
            ->select(
                DB::raw("DATE_FORMAT(occurred_at, '%Y-%m') as period"),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('period', 'type')
            ->orderBy('period')
            ->get();

        $externalTransfers = FinanceTransaction::where('user_id', $userId)
            ->where('type', 'transfer')
            ->where('metadata->transfer_destination', 'external')
            ->where('occurred_at', '>=', $start)
            ->select(
                DB::raw("DATE_FORMAT(occurred_at, '%Y-%m') as period"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn($row) => (object) [
                'period' => $row->period,
                'type' => 'expense',
                'total' => $row->total,
            ]);

        return $monthlyTotals->concat($externalTransfers);
    }

    public function getDailyTotals(int $userId, int $daysBack = 14): Collection
    {
        $start = now()->subDays($daysBack - 1)->startOfDay();

        $dailyTotals = FinanceTransaction::where('user_id', $userId)
            ->where('occurred_at', '>=', $start)
            ->select(
                DB::raw('DATE(occurred_at) as period'),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('period', 'type')
            ->orderBy('period')
            ->get();

        $externalTransfers = FinanceTransaction::where('user_id', $userId)
            ->where('type', 'transfer')
            ->where('metadata->transfer_destination', 'external')
            ->where('occurred_at', '>=', $start)
            ->select(
                DB::raw('DATE(occurred_at) as period'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn($row) => (object) [
                'period' => $row->period,
                'type' => 'expense',
                'total' => $row->total,
            ]);

        return $dailyTotals->concat($externalTransfers);
    }

    public function getCategoryTotals(int $userId, Carbon $startDate, Carbon $endDate): Collection
    {
        return FinanceTransaction::query()
            ->with('category')
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('occurred_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->select('finance_category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('finance_category_id')
            ->orderByDesc('total')
            ->get();
    }

    public function getCategoryTotalsForTypes(
        int $userId,
        Carbon $startDate,
        Carbon $endDate,
        array $types
    ): Collection {
        return FinanceTransaction::query()
            ->with('category')
            ->where('user_id', $userId)
            ->whereIn('type', $types)
            ->whereBetween('occurred_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->select('finance_category_id', 'type', DB::raw('SUM(amount) as total'))
            ->groupBy('finance_category_id', 'type')
            ->orderByDesc('total')
            ->get();
    }
}
