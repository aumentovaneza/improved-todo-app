<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceBudgetController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceBudgetRepository $budgetRepository
    ) {}

    public function index(): JsonResponse
    {
        $budgets = $this->budgetRepository->getForUser(Auth::id());

        return response()->json($budgets);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'period' => ['required', 'in:weekly,monthly,quarterly,yearly'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $budget = $this->financeService->createBudget($validated, Auth::id());

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
