<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceBudgetController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceSavingsGoalRepository $goalRepository,
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
        $dashboardData = $this->financeService->getDashboardData($walletUserId);
        $filters = [
            'search' => $request->string('search')->toString(),
            'status' => $request->string('status')->toString(),
        ];
        $status = $filters['status'] ?: 'all';
        $search = strtolower($filters['search'] ?: '');
        $budgets = $this->financeService->getBudgetsForUser($walletUserId)
            ->filter(function (FinanceBudget $budget) use ($status, $search) {
                $matchesStatus = match ($status) {
                    'active' => $budget->is_active,
                    'closed' => !$budget->is_active,
                    default => true,
                };

                if (!$matchesStatus) {
                    return false;
                }

                if ($search === '') {
                    return true;
                }

                $fields = array_filter([
                    $budget->name,
                    $budget->category?->name,
                    $budget->account?->name,
                ]);
                $haystack = strtolower(implode(' ', $fields));

                return str_contains($haystack, $search);
            });

        return Inertia::render('Finance/Budgets', [
            'budgets' => $budgets->values()->all(),
            'categories' => $dashboardData['categories'],
            'accounts' => $dashboardData['accounts'],
            'savingsGoals' => $this->goalRepository->getForUser($walletUserId)->values()->all(),
            'walletUserId' => $walletUserId,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $walletUserId = $request->integer('wallet_user_id');
        if ($walletUserId) {
            $this->walletService->ensureCanAccessWallet(Auth::id(), $walletUserId);
        }

        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where(
                    'user_id',
                    $walletUserId ?: Auth::id()
                ),
            ],
            'budget_type' => ['nullable', Rule::in(['spending', 'saved'])],
            'name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'period' => ['nullable', 'in:weekly,monthly,quarterly,yearly', 'required_if:is_recurring,1'],
            'is_recurring' => ['nullable', 'boolean'],
            'starts_on' => ['nullable', 'date', 'required_if:is_recurring,1'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $budget = $this->financeService->createBudget(
            $validated,
            $walletUserId ?: Auth::id()
        );

        return response()->json($budget, 201);
    }

    public function update(Request $request, FinanceBudget $budget): JsonResponse
    {
        $walletUserId = $budget->user_id;
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where('user_id', $walletUserId),
            ],
            'budget_type' => ['nullable', Rule::in(['spending', 'saved'])],
            'name' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'period' => ['nullable', 'in:weekly,monthly,quarterly,yearly', 'required_if:is_recurring,1'],
            'is_recurring' => ['nullable', 'boolean'],
            'starts_on' => ['nullable', 'date', 'required_if:is_recurring,1'],
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

    public function destroyWithReallocation(Request $request, FinanceBudget $budget): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['nullable', Rule::in(['none', 'reallocate_budget', 'add_to_savings_goal', 'create_budget'])],
            'target_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id', 'required_if:action,reallocate_budget'],
            'target_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id', 'required_if:action,add_to_savings_goal'],
            'new_budget_name' => ['nullable', 'string', 'max:255', 'required_if:action,create_budget'],
            'new_budget_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'new_budget_account_id' => ['nullable', 'integer', 'exists:finance_accounts,id'],
        ]);

        $remaining = max(0, (float) $budget->amount - (float) $budget->current_spent);
        $action = $validated['action'] ?? 'none';
        if (
            $budget->budget_type === 'saved' &&
            $budget->is_active &&
            $remaining > 0 &&
            $action === 'none'
        ) {
            return response()->json([
                'message' => 'Saved budgets must be reallocated before deleting.',
            ], 422);
        }

        try {
            $deleted = $this->financeService->deleteBudgetWithReallocation(
                $budget,
                $validated,
                Auth::id()
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['status' => $deleted ? 'deleted' : 'failed']);
    }

    public function close(Request $request, FinanceBudget $budget): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['nullable', Rule::in(['none', 'reallocate_budget', 'add_to_savings_goal'])],
            'target_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id', 'required_if:action,reallocate_budget'],
            'target_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id', 'required_if:action,add_to_savings_goal'],
        ]);

        $closed = $this->financeService->closeBudget($budget, $validated, Auth::id());

        return response()->json($closed);
    }
}
