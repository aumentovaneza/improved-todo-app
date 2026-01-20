<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FinanceLoan;
use App\Modules\Finance\Repositories\FinanceLoanRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FinanceLoanController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceLoanRepository $loanRepository,
        private FinanceWalletService $walletService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $loans = $this->loanRepository->getForUser($walletUserId);

        return response()->json($loans);
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
        $loans = $this->loanRepository->getForUser($walletUserId)
            ->filter(function (FinanceLoan $loan) use ($status, $search) {
                $matchesStatus = match ($status) {
                    'active' => $loan->is_active,
                    'closed' => !$loan->is_active,
                    default => true,
                };

                if (!$matchesStatus) {
                    return false;
                }

                if ($search === '') {
                    return true;
                }

                $fields = array_filter([
                    $loan->name,
                    $loan->notes,
                ]);
                $haystack = strtolower(implode(' ', $fields));

                return str_contains($haystack, $search);
            });

        return Inertia::render('Finance/Loans', [
            'loans' => $loans->values()->all(),
            'walletUserId' => $walletUserId,
            'filters' => $filters,
        ]);
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

        $walletUserId = $request->integer('wallet_user_id');
        if ($walletUserId) {
            $this->walletService->ensureCanAccessWallet(Auth::id(), $walletUserId);
        }
        $loan = $this->financeService->createLoan(
            $validated,
            $walletUserId ?: Auth::id()
        );

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
