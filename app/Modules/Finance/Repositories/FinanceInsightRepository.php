<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceInsight;
use Carbon\CarbonInterface;

class FinanceInsightRepository
{
    public function findForUserAndPeriod(
        int $userId,
        CarbonInterface $periodStart,
        CarbonInterface $periodEnd
    ): ?FinanceInsight {
        return FinanceInsight::where('user_id', $userId)
            ->whereDate('period_start', $periodStart->toDateString())
            ->whereDate('period_end', $periodEnd->toDateString())
            ->first();
    }

    public function upsertForUserAndPeriod(
        int $userId,
        CarbonInterface $periodStart,
        CarbonInterface $periodEnd,
        string $range,
        array $attributes
    ): FinanceInsight {
        // Match on the calendar period via whereDate so a stored time component
        // never causes a false miss (portable across MySQL/SQLite/Postgres).
        // Falls through to a create when none exists.
        $insight = $this->findForUserAndPeriod($userId, $periodStart, $periodEnd);

        if ($insight) {
            $insight->update($attributes);

            return $insight;
        }

        return FinanceInsight::create(array_merge($attributes, [
            'user_id' => $userId,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'range' => $range,
        ]));
    }
}
