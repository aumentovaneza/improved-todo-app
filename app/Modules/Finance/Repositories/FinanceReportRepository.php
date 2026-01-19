<?php

namespace App\Modules\Finance\Repositories;

use App\Modules\Finance\Models\FinanceReport;

class FinanceReportRepository
{
    public function create(array $data): FinanceReport
    {
        return FinanceReport::create($data);
    }

    public function getLatestForUser(int $userId, string $reportType): ?FinanceReport
    {
        return FinanceReport::where('user_id', $userId)
            ->where('report_type', $reportType)
            ->latest('generated_at')
            ->first();
    }
}
