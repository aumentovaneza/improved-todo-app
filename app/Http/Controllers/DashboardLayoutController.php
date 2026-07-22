<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateDashboardLayoutRequest;
use App\Services\DailySummaryService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardLayoutController extends Controller
{
    public function __construct(
        private UserService $userService,
        private DailySummaryService $dailySummaryService,
    ) {}

    /**
     * Persist the authenticated user's dashboard widget layout.
     */
    public function update(UpdateDashboardLayoutRequest $request): RedirectResponse
    {
        $this->userService->updateUserPreferences($request->user(), [
            'dashboard_widgets' => $request->validated('widgets'),
        ]);

        return back();
    }

    /**
     * Synchronously regenerate the user's AI daily summary on demand.
     */
    public function refreshSummary(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $this->dailySummaryService->userCanUseSummary($user)) {
            return back()->with('error', 'The daily summary is not available on your plan.');
        }

        $this->dailySummaryService->generateForUser($user);

        return back();
    }
}
