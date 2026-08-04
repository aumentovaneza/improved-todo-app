<?php

namespace Tests\Feature\Modules\Finance;

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavingsBalanceBackfillTest extends TestCase
{
    use RefreshDatabase;

    public function test_backfill_subtracts_double_the_savings_total_from_stored_balance()
    {
        $userId = User::factory()->create()->id;

        // Simulate an account whose stored balance was inflated by the old bug:
        // two savings contributions (250 + 150 = 400) that each swung +amount
        // instead of -amount, leaving the balance +2 x 400 = 800 too high.
        $account = FinanceAccount::create([
            'user_id' => $userId,
            'name' => 'Unionbank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 1000,
            'current_balance' => 1800, // should be 1000 after backfill
            'is_active' => true,
        ]);

        foreach ([250, 150] as $amount) {
            FinanceTransaction::create([
                'user_id' => $userId,
                'created_by_user_id' => $userId,
                'finance_account_id' => $account->id,
                'type' => 'savings',
                'amount' => $amount,
                'currency' => 'PHP',
                'description' => 'To savings',
                'occurred_at' => now(),
            ]);
        }

        $this->runBackfill();

        $this->assertEqualsWithDelta(1000.0, (float) $account->refresh()->current_balance, 0.001);
    }

    public function test_backfill_leaves_accounts_without_savings_untouched()
    {
        $userId = User::factory()->create()->id;

        $account = FinanceAccount::create([
            'user_id' => $userId,
            'name' => 'BPI',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 500,
            'current_balance' => 500,
            'is_active' => true,
        ]);

        $this->runBackfill();

        $this->assertEqualsWithDelta(500.0, (float) $account->refresh()->current_balance, 0.001);
    }

    private function runBackfill(): void
    {
        $migration = require database_path(
            'migrations/2026_08_04_050000_fix_account_balances_for_savings_transactions.php'
        );
        $migration->up();
    }
}
