<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Finance\Services\FinanceAccessService;
use App\Modules\Finance\Services\FinanceInsightService;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FinanceDashboardController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceAccessService $accessService,
        private FinanceWalletService $walletService,
        private FinanceInsightService $insightService
    ) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $walletUserId = $this->walletService->resolveWalletUserId(
            $user,
            $request->integer('wallet_user_id') ?: null
        );

        $walletOwner = User::query()
            ->select(['id', 'name', 'email'])
            ->find($walletUserId);

        $range = $request->string('range')->toString() ?: null;

        $data = $this->financeService->getDashboardData(
            $walletUserId,
            $range
        );

        // Spending insights are personal to the signed-in user's own wallet.
        $isWalletOwner = $walletUserId === $user->id;
        $financeInsight = $isWalletOwner
            ? $this->insightService->getCachedForCurrentPeriod($user, $range)
            : null;

        return Inertia::render('Finance/Dashboard', [
            'transactions' => $data['transactions'],
            'categories' => $data['categories'],
            'summary' => $data['summary'],
            'charts' => $data['charts'],
            'budgets' => $data['budgets'],
            'savingsGoals' => $data['savings_goals'],
            'loans' => $data['loans'],
            'accounts' => $data['accounts'],
            'wallets' => $this->walletService->getAccessibleWallets($user),
            'activeWallet' => $walletOwner,
            'walletUserId' => $walletUserId,
            'collaborators' => $user->walletCollaborators()
                ->get(['users.id', 'users.name', 'users.email', 'finance_wallet_collaborators.role']),
            'isWalletOwner' => $isWalletOwner,
            'tier' => $this->accessService->getTier($user),
            'canAccessAdvancedCharts' => $this->accessService->canAccessAdvancedCharts($user),
            'financeInsight' => $financeInsight,
            'canUseFinanceInsights' => $isWalletOwner && $this->insightService->userCanUseInsights($user),
            'insightRange' => $data['summary']['range'] ?? 'this_month',
        ]);
    }
}
