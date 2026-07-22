<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Services\FinanceInsightService;
use App\Modules\Finance\Services\FinanceReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinanceInsightController extends Controller
{
    public function __construct(
        private FinanceInsightService $insightService,
    ) {}

    /**
     * Synchronously generate the user's AI spending insight for a period.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $this->insightService->userCanUseInsights($user)) {
            return back()->with('error', 'Spending insights are not available on your plan.');
        }

        $validated = $request->validate([
            'range' => ['nullable', 'string', 'in:'.implode(',', FinanceReportService::RANGES)],
        ]);

        $range = $validated['range'] ?? null;

        // One insight per period: if this period's has already been generated,
        // don't regenerate it.
        if ($this->insightService->getCachedForCurrentPeriod($user, $range)) {
            return back()->with('info', 'Your insight for this period has already been generated.');
        }

        $this->insightService->generateForUser($user, $range);

        return back();
    }
}
