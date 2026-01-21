<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Enums\FinanceAccountInstitution;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Repositories\FinanceAccountRepository;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceAccountController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceAccountRepository $accountRepository,
        private FinanceWalletService $walletService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $accounts = $this->accountRepository->getForUser($walletUserId);

        return response()->json($accounts);
    }

    public function indexPage(Request $request): Response
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $accounts = $this->accountRepository->getForUser($walletUserId);

        return Inertia::render('Finance/Accounts', [
            'accounts' => $accounts->values()->all(),
            'accountSuggestions' => FinanceAccountInstitution::suggestionsByType(),
            'walletUserId' => $walletUserId,
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
            'label' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'type' => ['required', Rule::in(['bank', 'e-wallet', 'credit-card'])],
            'currency' => ['nullable', 'string', 'max:8'],
            'starting_balance' => ['nullable', 'numeric', 'min:0'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'used_credit' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $account = $this->financeService->createAccount(
            $validated,
            $walletUserId ?: Auth::id(),
            Auth::id()
        );

        return response()->json($account, 201);
    }

    public function update(Request $request, FinanceAccount $account): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'label' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'type' => ['nullable', Rule::in(['bank', 'e-wallet', 'credit-card'])],
            'currency' => ['nullable', 'string', 'max:8'],
            'starting_balance' => ['nullable', 'numeric', 'min:0'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'used_credit' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $updated = $this->financeService->updateAccount($account, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceAccount $account): JsonResponse
    {
        $this->financeService->deleteAccount($account, Auth::id());

        return response()->json(['status' => 'deleted']);
    }
}
