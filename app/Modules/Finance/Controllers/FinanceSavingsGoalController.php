<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceSavingsGoalController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceSavingsGoalRepository $goalRepository
    ) {}

    public function index(): JsonResponse
    {
        $goals = $this->goalRepository->getForUser(Auth::id());

        return response()->json($goals);
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

        $goal = $this->financeService->createSavingsGoal($validated, Auth::id());

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
