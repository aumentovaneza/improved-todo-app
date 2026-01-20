<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceLoan;
use Illuminate\Database\Eloquent\Collection;

class FinanceLoanRepository
{
    public function getForUser(int $userId): Collection
    {
        return FinanceLoan::where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('target_date')
            ->get();
    }

    public function findForUser(int $userId, int $loanId): FinanceLoan
    {
        return FinanceLoan::where('user_id', $userId)->findOrFail($loanId);
    }

    public function findOptionalForUser(int $userId, int $loanId): ?FinanceLoan
    {
        return FinanceLoan::where('user_id', $userId)->find($loanId);
    }

    public function create(array $data): FinanceLoan
    {
        return FinanceLoan::create($data);
    }

    public function update(FinanceLoan $loan, array $data): FinanceLoan
    {
        $loan->update($data);

        return $loan->refresh();
    }

    public function delete(FinanceLoan $loan): bool
    {
        return (bool) $loan->delete();
    }
}
