<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FinanceSavingsGoalController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceSavingsGoalRepository $goalRepository,
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
        $goals = $this->goalRepository->getForUser($walletUserId);

        return Inertia::render('Finance/SavingsGoals', [
            'savingsGoals' => $goals->values()->all(),
            'walletUserId' => $walletUserId,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'target_amount' => ['required', 'numeric', 'min:0'],
            'current_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $walletUserId = $request->integer('wallet_user_id');
        if ($walletUserId) {
            $this->walletService->ensureCanAccessWallet(Auth::id(), $walletUserId);
        }
        $goal = $this->financeService->createSavingsGoal(
            $validated,
            $walletUserId ?: Auth::id()
        );

        return response()->json($goal, 201);
    }

    public function update(Request $request, FinanceSavingsGoal $savingsGoal): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
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
}
