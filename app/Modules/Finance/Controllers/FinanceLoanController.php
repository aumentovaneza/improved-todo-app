<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceLoan;
use App\Modules\Finance\Repositories\FinanceLoanRepository;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceLoanController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceLoanRepository $loanRepository
    ) {}

    public function index(): JsonResponse
    {
        $loans = $this->loanRepository->getForUser(Auth::id());

        return response()->json($loans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'remaining_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $loan = $this->financeService->createLoan($validated, Auth::id());

        return response()->json($loan, 201);
    }

    public function update(Request $request, FinanceLoan $loan): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'remaining_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'target_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->financeService->updateLoan($loan, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceLoan $loan): JsonResponse
    {
        $this->financeService->deleteLoan($loan, Auth::id());

        return response()->json(['status' => 'deleted']);
    }
}
