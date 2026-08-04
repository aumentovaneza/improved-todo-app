<?php

namespace Tests\Feature\Modules\Finance;

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavingsBalanceImpactTest extends TestCase
{
    use RefreshDatabase;

    private FinanceService $service;

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(FinanceService::class);
        $this->userId = User::factory()->create()->id;
    }

    private function makeAccount(float $current = 1000.0): FinanceAccount
    {
        return FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Test Bank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => $current,
            'current_balance' => $current,
            'is_active' => true,
        ]);
    }

    private function makeGoal(): FinanceSavingsGoal
    {
        return $this->service->createSavingsGoal([
            'name' => 'Emergency Fund',
            'target_amount' => 5000,
            'current_amount' => 0,
            'currency' => 'PHP',
            'is_active' => true,
        ], $this->userId);
    }

    public function test_savings_transaction_decreases_account_and_increases_goal()
    {
        $account = $this->makeAccount(1000);
        $goal = $this->makeGoal();

        $this->service->createTransaction([
            'finance_account_id' => $account->id,
            'finance_savings_goal_id' => $goal->id,
            'type' => 'savings',
            'amount' => 250,
            'currency' => 'PHP',
            'description' => 'Move to savings',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);

        $this->assertEqualsWithDelta(750.0, (float) $account->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(250.0, (float) $goal->refresh()->current_amount, 0.001);
    }

    public function test_savings_transaction_moves_between_accounts_and_increases_goal()
    {
        $from = $this->makeAccount(1000);
        $to = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Savings Bank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 100,
            'current_balance' => 100,
            'is_active' => true,
        ]);
        $goal = $this->makeGoal();

        $this->service->createTransaction([
            'finance_account_id' => $from->id,
            'finance_transfer_account_id' => $to->id,
            'finance_savings_goal_id' => $goal->id,
            'type' => 'savings',
            'amount' => 250,
            'currency' => 'PHP',
            'description' => 'Move to savings account',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);

        $this->assertEqualsWithDelta(750.0, (float) $from->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(350.0, (float) $to->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(250.0, (float) $goal->refresh()->current_amount, 0.001);
    }

    public function test_deleting_savings_transfer_restores_both_accounts_and_goal()
    {
        $from = $this->makeAccount(1000);
        $to = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Savings Bank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 100,
            'current_balance' => 100,
            'is_active' => true,
        ]);
        $goal = $this->makeGoal();

        $transaction = $this->service->createTransaction([
            'finance_account_id' => $from->id,
            'finance_transfer_account_id' => $to->id,
            'finance_savings_goal_id' => $goal->id,
            'type' => 'savings',
            'amount' => 250,
            'currency' => 'PHP',
            'description' => 'Move to savings account',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);

        $this->service->deleteTransaction($transaction, $this->userId);

        $this->assertEqualsWithDelta(1000.0, (float) $from->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(100.0, (float) $to->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(0.0, (float) $goal->refresh()->current_amount, 0.001);
    }

    public function test_deleting_savings_transaction_restores_account_and_goal()
    {
        $account = $this->makeAccount(1000);
        $goal = $this->makeGoal();

        $transaction = $this->service->createTransaction([
            'finance_account_id' => $account->id,
            'finance_savings_goal_id' => $goal->id,
            'type' => 'savings',
            'amount' => 250,
            'currency' => 'PHP',
            'description' => 'Move to savings',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);

        $this->service->deleteTransaction($transaction, $this->userId);

        $this->assertEqualsWithDelta(1000.0, (float) $account->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(0.0, (float) $goal->refresh()->current_amount, 0.001);
    }

    public function test_income_and_loan_add_while_expense_subtracts()
    {
        $account = $this->makeAccount(1000);

        $this->service->createTransaction([
            'finance_account_id' => $account->id,
            'type' => 'income',
            'amount' => 100,
            'currency' => 'PHP',
            'description' => 'Paycheck',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);
        $this->assertEqualsWithDelta(1100.0, (float) $account->refresh()->current_balance, 0.001);

        $this->service->createTransaction([
            'finance_account_id' => $account->id,
            'type' => 'expense',
            'amount' => 300,
            'currency' => 'PHP',
            'description' => 'Groceries',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);
        $this->assertEqualsWithDelta(800.0, (float) $account->refresh()->current_balance, 0.001);

        $this->service->createTransaction([
            'finance_account_id' => $account->id,
            'type' => 'loan',
            'amount' => 500,
            'currency' => 'PHP',
            'description' => 'Personal loan',
            'occurred_at' => now(),
        ], $this->userId, $this->userId);
        $this->assertEqualsWithDelta(1300.0, (float) $account->refresh()->current_balance, 0.001);
    }
}
