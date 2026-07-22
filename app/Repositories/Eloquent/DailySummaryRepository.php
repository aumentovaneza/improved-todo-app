<?php

namespace App\Repositories\Eloquent;

use App\Models\DailySummary;
use App\Repositories\Contracts\DailySummaryRepositoryInterface;
use Carbon\CarbonInterface;

class DailySummaryRepository implements DailySummaryRepositoryInterface
{
    public function findForUserOnDate(int $userId, CarbonInterface $date): ?DailySummary
    {
        return DailySummary::where('user_id', $userId)
            ->whereDate('summary_date', $date->toDateString())
            ->first();
    }

    public function upsertForUserOnDate(int $userId, CarbonInterface $date, array $attributes): DailySummary
    {
        // Match on the calendar day via whereDate so the time component of the
        // stored `date` column never causes a false miss (portable across
        // MySQL/SQLite/Postgres). Falls through to a create when none exists.
        $summary = $this->findForUserOnDate($userId, $date);

        if ($summary) {
            $summary->update($attributes);

            return $summary;
        }

        return DailySummary::create(array_merge($attributes, [
            'user_id' => $userId,
            'summary_date' => $date->toDateString(),
        ]));
    }
}
