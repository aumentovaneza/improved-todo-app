<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceSavingsGoal;
use Illuminate\Database\Eloquent\Collection;

class FinanceSavingsGoalRepository
{
    public function getForUser(int $userId): Collection
    {
        return FinanceSavingsGoal::with('account')
            ->where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('target_date')
            ->get();
    }

    public function findForUser(int $userId, int $goalId): FinanceSavingsGoal
    {
        return FinanceSavingsGoal::where('user_id', $userId)->findOrFail($goalId);
    }

    public function findOptionalForUser(int $userId, int $goalId): ?FinanceSavingsGoal
    {
        return FinanceSavingsGoal::where('user_id', $userId)->find($goalId);
    }

    public function create(array $data): FinanceSavingsGoal
    {
        return FinanceSavingsGoal::create($data);
    }

    public function update(FinanceSavingsGoal $goal, array $data): FinanceSavingsGoal
    {
        $goal->update($data);

        return $goal->refresh();
    }

    public function adjustCurrentAmount(FinanceSavingsGoal $goal, float $delta): FinanceSavingsGoal
    {
        $goal->current_amount = max(0, (float) $goal->current_amount + $delta);
        $goal->save();

        return $goal->refresh();
    }

    public function delete(FinanceSavingsGoal $goal): bool
    {
        return (bool) $goal->delete();
    }
}
