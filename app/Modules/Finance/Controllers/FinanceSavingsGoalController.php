<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Repositories\FinanceAccountRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceSavingsGoalController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceSavingsGoalRepository $goalRepository,
        private FinanceAccountRepository $accountRepository,
        private FinanceWalletService $walletService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $goals = $this->goalRepository->getForUser($walletUserId);

        return response()->json($goals);
    }

    public function indexPage(Request $request): Response
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $filters = [
            'search' => $request->string('search')->toString(),
            'status' => $request->string('status')->toString(),
        ];
        $status = $filters['status'] ?: 'all';
        $search = strtolower($filters['search'] ?: '');
        $goals = $this->goalRepository->getForUser($walletUserId)
            ->filter(function (FinanceSavingsGoal $goal) use ($status, $search) {
                $target = (float) $goal->target_amount;
                $current = (float) $goal->current_amount;
                $isCompleted = $target > 0 && $current >= $target;
                $isConverted = !empty($goal->converted_finance_budget_id);
                $matchesStatus = match ($status) {
                    'active' => $goal->is_active,
                    'completed' => $isCompleted,
                    'converted' => $isConverted,
                    'closed' => !$goal->is_active,
                    default => true,
                };

                if (!$matchesStatus) {
                    return false;
                }

                if ($search === '') {
                    return true;
                }

                $fields = array_filter([
                    $goal->name,
                    $goal->notes,
                    $goal->account?->name,
                ]);
                $haystack = strtolower(implode(' ', $fields));

                return str_contains($haystack, $search);
            });
        $accounts = $this->accountRepository->getForUser($walletUserId);

        return Inertia::render('Finance/SavingsGoals', [
            'savingsGoals' => $goals->values()->all(),
            'accounts' => $accounts->values()->all(),
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
            'name' => ['required', 'string', 'max:255'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where(
                    'user_id',
                    $walletUserId ?: Auth::id()
                ),
            ],
            'target_amount' => ['required', 'numeric', 'min:0'],
            'current_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $goal = $this->financeService->createSavingsGoal(
            $validated,
            $walletUserId ?: Auth::id()
        );

        return response()->json($goal, 201);
    }

    public function update(Request $request, FinanceSavingsGoal $savingsGoal): JsonResponse
    {
        $walletUserId = $savingsGoal->user_id;
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where('user_id', $walletUserId),
            ],
            'target_amount' => ['nullable', 'numeric', 'min:0'],
            'current_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->financeService->updateSavingsGoal($savingsGoal, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceSavingsGoal $savingsGoal): JsonResponse
    {
        $this->financeService->deleteSavingsGoal($savingsGoal, Auth::id());

        return response()->json(['status' => 'deleted']);
    }

    public function convert(FinanceSavingsGoal $savingsGoal): JsonResponse
    {
        $budget = $this->financeService->convertSavingsGoalToBudget($savingsGoal, Auth::id());

        return response()->json([
            'budget' => $budget,
            'savings_goal' => $savingsGoal->refresh(),
        ]);
    }
}
