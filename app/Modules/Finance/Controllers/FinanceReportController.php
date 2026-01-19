<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Services\FinanceReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceReportController extends Controller
{
    public function __construct(private FinanceReportService $reportService) {}

    public function summary(): JsonResponse
    {
        $data = $this->reportService->buildDashboardData(Auth::id());

        return response()->json($data['summary']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'report_type' => ['required', 'string', 'max:50'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
        ]);

        $report = $this->reportService->generateSnapshot(
            Auth::id(),
            $validated['report_type'],
            Carbon::parse($validated['period_start']),
            Carbon::parse($validated['period_end'])
        );

        return response()->json($report, 201);
    }
}
