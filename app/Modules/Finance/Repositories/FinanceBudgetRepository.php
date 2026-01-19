<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceBudget;
use Illuminate\Database\Eloquent\Collection;

class FinanceBudgetRepository
{
    public function getForUser(int $userId): Collection
    {
        return FinanceBudget::with('category')
            ->where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('starts_on')
            ->get();
    }

    public function getActiveForUser(int $userId): Collection
    {
        return FinanceBudget::with('category')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();
    }

    public function findForUser(int $userId, int $budgetId): FinanceBudget
    {
        return FinanceBudget::where('user_id', $userId)->findOrFail($budgetId);
    }

    public function create(array $data): FinanceBudget
    {
        return FinanceBudget::create($data);
    }

    public function update(FinanceBudget $budget, array $data): FinanceBudget
    {
        $budget->update($data);

        return $budget->refresh();
    }

    public function adjustSpent(FinanceBudget $budget, float $delta): FinanceBudget
    {
        $budget->current_spent = max(0, (float) $budget->current_spent + $delta);
        $budget->save();

        return $budget->refresh();
    }

    public function delete(FinanceBudget $budget): bool
    {
        return (bool) $budget->delete();
    }
}
