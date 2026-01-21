<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Services\FinanceService;
use App\Modules\Finance\Services\FinanceWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FinanceTransactionController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private FinanceWalletService $walletService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $walletUserId = $this->walletService->resolveWalletUserId(
            $user,
            $request->integer('wallet_user_id') ?: null
        );
        $data = $this->financeService->getDashboardData($walletUserId);

        return response()->json($data['transactions']);
    }

    public function indexPage(Request $request): Response
    {
        $user = Auth::user();
        $walletUserId = $this->walletService->resolveWalletUserId(
            $user,
            $request->integer('wallet_user_id') ?: null
        );
        $filters = [
            'search' => $request->string('search')->toString(),
            'type' => $request->string('type')->toString(),
            'start_date' => $request->string('start_date')->toString(),
            'end_date' => $request->string('end_date')->toString(),
            'sort' => $request->string('sort')->toString(),
            'tags' => array_values(array_filter((array) $request->input('tags', []))),
            'wallet_user_id' => $walletUserId,
        ];

        $baseQuery = $this->buildFilteredQuery($walletUserId, $filters);

        $sort = $filters['sort'] ?: 'date_desc';
        $dateOrder = $sort === 'date_asc' ? 'asc' : 'desc';
        $perPageDates = max(1, (int) $request->integer('per_page_dates', 3));
        $dateQuery = (clone $baseQuery)
            ->selectRaw('DATE(occurred_at) as date')
            ->groupBy('date')
            ->orderBy('date', $dateOrder);
        $allDateKeys = $dateQuery->pluck('date');
        $dateKeys = $allDateKeys->take($perPageDates);
        $hasMore = $allDateKeys->count() > $perPageDates;

        $transactions = collect();
        if ($dateKeys->isNotEmpty()) {
            $transactionsQuery = $this->applySort(
                (clone $baseQuery)->whereIn(DB::raw('DATE(occurred_at)'), $dateKeys),
                $sort
            );
            $transactions = $transactionsQuery->get();
        }
        $totalAmount = (clone $baseQuery)->sum('amount');
        $tags = Tag::orderBy('name')->get(['id', 'name', 'color']);

        return Inertia::render('Finance/Transactions', [
            'transactions' => $transactions,
            'totalAmount' => $totalAmount,
            'page' => 1,
            'hasMore' => $hasMore,
            'perPageDates' => $perPageDates,
            'tags' => $tags,
            'filters' => $filters,
            'walletUserId' => $walletUserId,
        ]);
    }

    public function grouped(Request $request): JsonResponse
    {
        $user = Auth::user();
        $walletUserId = $this->walletService->resolveWalletUserId(
            $user,
            $request->integer('wallet_user_id') ?: null
        );
        $filters = [
            'search' => $request->string('search')->toString(),
            'type' => $request->string('type')->toString(),
            'start_date' => $request->string('start_date')->toString(),
            'end_date' => $request->string('end_date')->toString(),
            'sort' => $request->string('sort')->toString(),
            'tags' => array_values(array_filter((array) $request->input('tags', []))),
            'wallet_user_id' => $walletUserId,
        ];

        $page = max(1, (int) $request->integer('page', 1));
        $perPageDates = max(1, (int) $request->integer('per_page_dates', 3));
        $sort = $filters['sort'] ?: 'date_desc';
        $dateOrder = $sort === 'date_asc' ? 'asc' : 'desc';

        $baseQuery = $this->buildFilteredQuery($walletUserId, $filters);
        $dateQuery = (clone $baseQuery)
            ->selectRaw('DATE(occurred_at) as date')
            ->groupBy('date')
            ->orderBy('date', $dateOrder);
        $totalDates = $dateQuery->get()->count();
        $dateKeys = $dateQuery
            ->skip(($page - 1) * $perPageDates)
            ->take($perPageDates)
            ->pluck('date');

        $transactions = collect();
        if ($dateKeys->isNotEmpty()) {
            $transactionsQuery = $this->applySort(
                (clone $baseQuery)->whereIn(DB::raw('DATE(occurred_at)'), $dateKeys),
                $sort
            );
            $transactions = $transactionsQuery->get();
        }

        return response()->json([
            'transactions' => $transactions,
            'page' => $page,
            'has_more' => ($page * $perPageDates) < $totalDates,
        ]);
    }

    private function buildFilteredQuery(int $walletUserId, array $filters)
    {
        $query = FinanceTransaction::query()
            ->with([
                'category',
                'loan',
                'tags',
                'createdBy',
                'account',
                'transferAccount',
                'creditCardAccount',
            ])
            ->where('user_id', $walletUserId);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('occurred_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('occurred_at', '<=', $filters['end_date']);
        }

        if (!empty($filters['tags'])) {
            $tagIds = array_map('intval', $filters['tags']);
            $query->whereHas('tags', function ($tagQuery) use ($tagIds) {
                $tagQuery->whereIn('tags.id', $tagIds);
            });
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($searchQuery) use ($search) {
                $searchQuery->where('description', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tags', function ($tagQuery) use ($search) {
                        $tagQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query;
    }

    private function applySort($query, string $sort)
    {
        return match ($sort) {
            'date_asc' => $query->orderBy('occurred_at'),
            'amount_asc' => $query->orderBy('amount'),
            'amount_desc' => $query->orderByDesc('amount'),
            default => $query->orderByDesc('occurred_at'),
        };
    }

    public function related(Request $request): JsonResponse
    {
        $walletUserId = $this->walletService->resolveWalletUserId(
            Auth::user(),
            $request->integer('wallet_user_id') ?: null
        );
        $validated = $request->validate([
            'finance_loan_id' => ['nullable', 'integer', 'exists:finance_loans,id'],
            'finance_savings_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id'],
            'finance_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id'],
        ]);

        $query = FinanceTransaction::query()
            ->with(['category', 'account', 'transferAccount'])
            ->where('user_id', $walletUserId);

        $hasFilter = false;
        if (!empty($validated['finance_loan_id'])) {
            $query->where('finance_loan_id', $validated['finance_loan_id']);
            $hasFilter = true;
        }

        if (!empty($validated['finance_savings_goal_id'])) {
            $query->where('finance_savings_goal_id', $validated['finance_savings_goal_id']);
            $hasFilter = true;
        }

        if (!empty($validated['finance_budget_id'])) {
            $query->where('finance_budget_id', $validated['finance_budget_id']);
            $hasFilter = true;
        }

        $transactions = $hasFilter
            ? $query->orderByDesc('occurred_at')->get()
            : collect();

        return response()->json($transactions);
    }

    public function store(Request $request): JsonResponse
    {
        $walletUserId = $request->integer('wallet_user_id');
        if ($walletUserId) {
            $this->walletService->ensureCanAccessWallet(Auth::id(), $walletUserId);
        }

        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_loan_id' => ['nullable', 'integer', 'exists:finance_loans,id'],
            'finance_savings_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id'],
            'finance_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where(
                    'user_id',
                    $walletUserId ?: Auth::id()
                ),
            ],
            'finance_transfer_account_id' => [
                'nullable',
                'integer',
                'different:finance_account_id',
                Rule::exists('finance_accounts', 'id')->where(
                    'user_id',
                    $walletUserId ?: Auth::id()
                ),
            ],
            'finance_credit_card_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')
                    ->where('user_id', $walletUserId ?: Auth::id())
                    ->where('type', 'credit-card'),
            ],
            'type' => ['required', 'in:income,expense,savings,loan,transfer'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'description' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurring_frequency' => ['nullable', 'in:daily,weekly,bi-weekly,monthly,yearly', 'required_if:is_recurring,1'],
            'metadata' => ['nullable', 'array'],
            'metadata.transfer_fee' => ['nullable', 'numeric', 'min:0'],
            'transfer_destination' => ['nullable', 'in:internal,external'],
            'external_account_name' => ['nullable', 'string', 'max:255'],
            'occurred_at' => ['required', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*.id' => ['nullable', 'exists:tags,id'],
            'tags.*.name' => ['nullable', 'string', 'max:255'],
            'tags.*.color' => ['nullable', 'string', 'regex:/^#[0-9A-F]{6}$/i'],
            'tags.*.description' => ['nullable', 'string'],
            'tags.*.is_new' => ['nullable', 'boolean'],
        ]);

        if (($validated['type'] ?? null) === 'transfer') {
            $transferDestination = $validated['transfer_destination']
                ?? ($validated['finance_transfer_account_id'] ? 'internal' : 'external');
            $request->validate([
                'finance_account_id' => [
                    'required',
                    'integer',
                    Rule::exists('finance_accounts', 'id')->where(
                        'user_id',
                        $walletUserId ?: Auth::id()
                    ),
                ],
                'finance_transfer_account_id' => $transferDestination === 'internal'
                    ? [
                        'required',
                        'integer',
                        'different:finance_account_id',
                        Rule::exists('finance_accounts', 'id')->where(
                            'user_id',
                            $walletUserId ?: Auth::id()
                        ),
                    ]
                    : ['nullable'],
                'external_account_name' => $transferDestination === 'external'
                    ? ['required', 'string', 'max:255']
                    : ['nullable'],
            ]);

            $validated['metadata'] = array_merge($validated['metadata'] ?? [], [
                'transfer_destination' => $transferDestination,
                'external_account_name' => $transferDestination === 'external'
                    ? ($validated['external_account_name'] ?? null)
                    : null,
            ]);

            if ($transferDestination === 'external') {
                $validated['finance_transfer_account_id'] = null;
            }
        }

        $validated = $this->normalizeRecurringData($validated);
        $transaction = $this->financeService->createTransaction(
            $validated,
            $walletUserId ?: Auth::id(),
            Auth::id()
        );

        return response()->json($transaction, 201);
    }

    public function update(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        $walletUserId = $transaction->user_id;
        $validated = $request->validate([
            'finance_category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'finance_loan_id' => ['nullable', 'integer', 'exists:finance_loans,id'],
            'finance_savings_goal_id' => ['nullable', 'integer', 'exists:finance_savings_goals,id'],
            'finance_budget_id' => ['nullable', 'integer', 'exists:finance_budgets,id'],
            'finance_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')->where('user_id', $walletUserId),
            ],
            'finance_transfer_account_id' => [
                'nullable',
                'integer',
                'different:finance_account_id',
                Rule::exists('finance_accounts', 'id')->where('user_id', $walletUserId),
            ],
            'finance_credit_card_account_id' => [
                'nullable',
                'integer',
                Rule::exists('finance_accounts', 'id')
                    ->where('user_id', $walletUserId)
                    ->where('type', 'credit-card'),
            ],
            'type' => ['nullable', 'in:income,expense,savings,loan,transfer'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'is_recurring' => ['nullable', 'boolean'],
            'recurring_frequency' => ['nullable', 'in:daily,weekly,bi-weekly,monthly,yearly', 'required_if:is_recurring,1'],
            'metadata' => ['nullable', 'array'],
            'metadata.transfer_fee' => ['nullable', 'numeric', 'min:0'],
            'transfer_destination' => ['nullable', 'in:internal,external'],
            'external_account_name' => ['nullable', 'string', 'max:255'],
            'occurred_at' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*.id' => ['nullable', 'exists:tags,id'],
            'tags.*.name' => ['nullable', 'string', 'max:255'],
            'tags.*.color' => ['nullable', 'string', 'regex:/^#[0-9A-F]{6}$/i'],
            'tags.*.description' => ['nullable', 'string'],
            'tags.*.is_new' => ['nullable', 'boolean'],
        ]);

        $validated = $this->normalizeRecurringData($validated);
        if (($validated['type'] ?? $transaction->type) === 'transfer') {
            $transferDestination = $validated['transfer_destination']
                ?? ($validated['finance_transfer_account_id'] ?? $transaction->finance_transfer_account_id
                    ? 'internal'
                    : 'external');

            if ($transferDestination === 'external' && empty($validated['external_account_name'])) {
                $validated['external_account_name'] =
                    $transaction->metadata['external_account_name'] ?? null;
            }

            $validated['metadata'] = array_merge($validated['metadata'] ?? ($transaction->metadata ?? []), [
                'transfer_destination' => $transferDestination,
                'external_account_name' => $transferDestination === 'external'
                    ? ($validated['external_account_name'] ?? null)
                    : null,
            ]);

            if ($transferDestination === 'external') {
                $validated['finance_transfer_account_id'] = null;
            }
        }
        $type = $validated['type'] ?? $transaction->type;
        if ($type === 'transfer') {
            $transferDestination = $validated['transfer_destination']
                ?? ($validated['finance_transfer_account_id'] ?? $transaction->finance_transfer_account_id
                    ? 'internal'
                    : 'external');
            $sourceId = $validated['finance_account_id'] ?? $transaction->finance_account_id;
            $targetId = $validated['finance_transfer_account_id'] ?? $transaction->finance_transfer_account_id;
            if (!$sourceId) {
                abort(422, 'Transfers require a source account.');
            }
            if ($transferDestination !== 'external' && (!$targetId || $sourceId === $targetId)) {
                abort(422, 'Transfers require two different accounts.');
            }
            if ($transferDestination === 'external' && empty($validated['external_account_name'])) {
                abort(422, 'Transfers to external accounts require a recipient name.');
            }
        }
        $updated = $this->financeService->updateTransaction($transaction, $validated, Auth::id());

        return response()->json($updated);
    }

    public function destroy(FinanceTransaction $transaction): JsonResponse
    {
        $this->financeService->deleteTransaction($transaction, Auth::id());

        return response()->json(['status' => 'deleted']);
    }

    private function normalizeRecurringData(array $data): array
    {
        if (
            !array_key_exists('is_recurring', $data) &&
            !array_key_exists('recurring_frequency', $data)
        ) {
            return $data;
        }

        $frequency = $data['recurring_frequency'] ?? null;
        $hasFrequency = is_string($frequency) && $frequency !== '';

        if ($hasFrequency) {
            $data['is_recurring'] = true;
        }

        if (($data['is_recurring'] ?? false) === false) {
            $data['is_recurring'] = false;
            $data['recurring_frequency'] = null;
        }

        return $data;
    }
}
