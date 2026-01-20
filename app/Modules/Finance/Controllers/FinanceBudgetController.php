<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FinanceBudgetController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceWalletService $walletService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $budgets = $this->budgetRepository->getForUser($walletUserId);

        return response()->json($budgets);
    }

    public function indexPage(Request $request): Response
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $data = $this->financeService->getDashboardData($walletUserId);

        return Inertia::render('Finance/Budgets', [
            'budgets' => $data['budgets'],
            'categories' => $data['categories'],
            'walletUserId' => $walletUserId,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'period' => ['required', 'in:weekly,monthly,quarterly,yearly'],
            'is_recurring' => ['nullable', 'boolean'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $walletUserId = $request->integer('wallet_user_id');
        if ($walletUserId) {
            $this->walletService->ensureCanAccessWallet(Auth::id(), $walletUserId);
        }
        $budget = $this->financeService->createBudget(
            $validated,
            $walletUserId ?: Auth::id()
        );

        return response()->json($budget, 201);
    }

    public function update(Request $request, FinanceBudget $budget): JsonResponse
    {
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'period' => ['nullable', 'in:weekly,monthly,quarterly,yearly'],
            'is_recurring' => ['nullable', 'boolean'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->financeService->updateBudget($budget, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceBudget $budget): JsonResponse
    {
        $this->financeService->deleteBudget($budget, Auth::id());

        return response()->json(['status' => 'deleted']);
    }
}
