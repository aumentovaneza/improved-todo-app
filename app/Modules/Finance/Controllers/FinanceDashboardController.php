<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Services\FinanceAccessService;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FinanceDashboardController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceAccessService $accessService
    ) {}

    public function index(): Response
    {
        $user = Auth::user();
        $userId = Auth::id();

        $data = $this->financeService->getDashboardData($userId);

        return Inertia::render('Finance/Dashboard', [
            'transactions' => $data['transactions'],
            'categories' => $data['categories'],
            'summary' => $data['summary'],
            'charts' => $data['charts'],
            'budgets' => $data['budgets'],
            'savingsGoals' => $data['savings_goals'],
            'tier' => $this->accessService->getTier($user),
            'canAccessAdvancedCharts' => $this->accessService->canAccessAdvancedCharts($user),
        ]);
    }

}
