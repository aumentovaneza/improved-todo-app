<?php

namespace Tests\Unit\Modules\Finance;

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Repositories\FinanceAccountRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditCardResetUnitTest extends TestCase
{
    use RefreshDatabase;

    private FinanceAccountRepository $repository;

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = app(FinanceAccountRepository::class);
        $this->userId = User::factory()->create()->id;
    }

    public function test_credit_card_adjust_balance_reverts_to_full_limit_when_fully_paid()
    {
        $account = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Test Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 50000,
            'used_credit' => 20000,
            'available_credit' => 30000,
            'is_active' => true,
        ]);

        // Pay off the full amount (positive delta increases available credit)
        $updatedAccount = $this->repository->adjustBalance($account, 20000);

        // Assert that the credit card is reset to full limit
        $this->assertEquals(0, $updatedAccount->used_credit);
        $this->assertEquals(50000, $updatedAccount->available_credit);
        $this->assertEquals(50000, $updatedAccount->credit_limit);
    }

    public function test_credit_card_adjust_balance_partial_payment()
    {
        $account = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Test Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 50000,
            'used_credit' => 20000,
            'available_credit' => 30000,
            'is_active' => true,
        ]);

        // Make a partial payment
        $updatedAccount = $this->repository->adjustBalance($account, 5000);

        // Assert that values are updated correctly but not reset
        $this->assertEquals(15000, $updatedAccount->used_credit);
        $this->assertEquals(35000, $updatedAccount->available_credit);
        $this->assertEquals(50000, $updatedAccount->credit_limit);
    }

    public function test_credit_card_update_to_zero_reverts_to_full_limit()
    {
        $account = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Test Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 50000,
            'used_credit' => 20000,
            'available_credit' => 30000,
            'is_active' => true,
        ]);

        // Manually set used_credit to 0
        $updatedAccount = $this->repository->update($account, ['used_credit' => 0]);

        // Assert that the credit card is reset to full limit
        $this->assertEquals(0, $updatedAccount->used_credit);
        $this->assertEquals(50000, $updatedAccount->available_credit);
        $this->assertEquals(50000, $updatedAccount->credit_limit);
    }

    public function test_credit_card_prevents_negative_used_credit()
    {
        $account = FinanceAccount::create([
            'user_id' => $this->userId,
            'name' => 'Test Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 50000,
            'used_credit' => 20000,
            'available_credit' => 30000,
            'is_active' => true,
        ]);

        // Try to pay more than the used amount
        $updatedAccount = $this->repository->adjustBalance($account, 25000);

        // Assert that used credit doesn't go negative and resets to full limit
        $this->assertEquals(0, $updatedAccount->used_credit);
        $this->assertEquals(50000, $updatedAccount->available_credit);
        $this->assertEquals(50000, $updatedAccount->credit_limit);
    }
}
