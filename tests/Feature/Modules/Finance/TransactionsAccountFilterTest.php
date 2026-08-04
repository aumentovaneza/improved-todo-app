<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
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
