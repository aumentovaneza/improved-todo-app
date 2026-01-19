<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceTransactionController extends Controller
{
    public function __construct(private FinanceService $financeService) {}

    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $data = $this->financeService->getDashboardData($userId);

        return response()->json($data['transactions']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_savings_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id'],
            'finance_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id'],
            'type' => ['required', 'in:income,expense,savings'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'description' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'is_recurring' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'occurred_at' => ['required', 'date'],
        ]);

        $transaction = $this->financeService->createTransaction($validated, Auth::id());

        return response()->json($transaction, 201);
    }

    public function update(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_savings_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id'],
            'finance_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id'],
            'type' => ['nullable', 'in:income,expense,savings'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'is_recurring' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'occurred_at' => ['nullable', 'date'],
        ]);

        $updated = $this->financeService->updateTransaction($transaction, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceTransaction $transaction): JsonResponse
    {
        $this->financeService->deleteTransaction($transaction, Auth::id());

        return response()->json(['status' => 'deleted']);
    }
}
