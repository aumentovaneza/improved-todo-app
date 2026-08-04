<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia;

function makeFilterAccount(User $user, array $overrides = []): FinanceAccount
{
    return FinanceAccount::create(array_merge([
        'user_id' => $user->id,
        'name' => 'Filter Bank',
        'type' => 'bank',
        'currency' => 'PHP',
        'starting_balance' => 0,
        'current_balance' => 0,
        'is_active' => true,
        'is_default' => false,
    ], $overrides));
}

function makeFilterTransaction(User $user, array $attributes): FinanceTransaction
{
    return FinanceTransaction::create(array_merge([
        'user_id' => $user->id,
        'type' => 'expense',
        'amount' => 10,
        'currency' => 'PHP',
        'occurred_at' => '2026-07-10 09:00:00',
    ], $attributes));
}

it('filters transactions to a single account across all account roles', function () {
    $user = User::factory()->create();
    $account = makeFilterAccount($user, ['name' => 'Target']);
    $other = makeFilterAccount($user, ['name' => 'Other']);

    // Source account.
    makeFilterTransaction($user, [
        'finance_account_id' => $account->id,
        'description' => 'AsSource',
    ]);
    // Transfer destination account.
    makeFilterTransaction($user, [
        'type' => 'transfer',
        'finance_account_id' => $other->id,
        'finance_transfer_account_id' => $account->id,
        'description' => 'AsTransferDestination',
    ]);
    // Credit-card account.
    makeFilterTransaction($user, [
        'finance_account_id' => $other->id,
        'finance_credit_card_account_id' => $account->id,
        'description' => 'AsCreditCard',
    ]);
    // Unrelated transaction on another account.
    makeFilterTransaction($user, [
        'finance_account_id' => $other->id,
        'description' => 'Unrelated',
    ]);

    $this->actingAs($user)
        ->get(route('weviewallet.transactions.index', [
            'finance_account_id' => $account->id,
        ]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Finance/Transactions')
            ->where('filters.finance_account_id', $account->id)
            ->has('transactions', 3)
            ->where('transactions', fn ($transactions) => collect($transactions)
                ->pluck('description')
                ->sort()
                ->values()
                ->all() === ['AsCreditCard', 'AsSource', 'AsTransferDestination'])
        );
});

it('returns all transactions when no account filter is provided', function () {
    $user = User::factory()->create();
    $account = makeFilterAccount($user);

    makeFilterTransaction($user, [
        'finance_account_id' => $account->id,
        'description' => 'One',
    ]);
    makeFilterTransaction($user, [
        'finance_account_id' => $account->id,
        'description' => 'Two',
    ]);

    $this->actingAs($user)
        ->get(route('weviewallet.transactions.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Finance/Transactions')
            ->where('filters.finance_account_id', null)
            ->has('transactions', 2)
        );
});

it('limits an account transaction view to the supplied current month dates', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-05 12:00:00'));

    $user = User::factory()->create();
    $account = makeFilterAccount($user, ['name' => 'Current Month Target']);
    $other = makeFilterAccount($user, ['name' => 'Payment Source']);

    makeFilterTransaction($user, [
        'finance_account_id' => $account->id,
        'description' => 'PreviousMonth',
        'occurred_at' => '2026-07-31 12:00:00',
    ]);
    makeFilterTransaction($user, [
        'finance_account_id' => $account->id,
        'description' => 'CurrentSource',
        'occurred_at' => '2026-08-01 00:00:00',
    ]);
    makeFilterTransaction($user, [
        'finance_account_id' => $other->id,
        'finance_credit_card_account_id' => $account->id,
        'description' => 'CurrentCreditPayment',
        'occurred_at' => '2026-08-31 23:59:59',
    ]);
    makeFilterTransaction($user, [
        'finance_transfer_account_id' => $account->id,
        'description' => 'NextMonth',
        'occurred_at' => '2026-09-01 00:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('weviewallet.transactions.index', [
            'finance_account_id' => $account->id,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
        ]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Finance/Transactions')
            ->where('filters.start_date', '2026-08-01')
            ->where('filters.end_date', '2026-08-31')
            ->has('transactions', 2)
            ->where('transactions', fn ($transactions) => collect($transactions)
                ->pluck('description')
                ->sort()
                ->values()
                ->all() === ['CurrentCreditPayment', 'CurrentSource'])
        );

    Carbon::setTestNow();
});

it('provides current month boundaries to the accounts page', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-05 12:00:00'));
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('weviewallet.accounts.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Finance/Accounts')
            ->where('currentMonth.start', '2026-08-01')
            ->where('currentMonth.end', '2026-08-31')
        );

    Carbon::setTestNow();
});
