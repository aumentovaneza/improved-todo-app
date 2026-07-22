<?php

namespace App\Repositories\Contracts;

use App\Models\DailySummary;
use Carbon\CarbonInterface;

interface DailySummaryRepositoryInterface
{
    /**
     * Find a stored summary for a user on a given date.
     */
    public function findForUserOnDate(int $userId, CarbonInterface $date): ?DailySummary;

    /**
     * Create or update the summary for a user on a given date.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function upsertForUserOnDate(int $userId, CarbonInterface $date, array $attributes): DailySummary;
}
