<?php

namespace Tests\Feature\Modules\Finance;

use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Repositories\FinanceAccountRepository;
use App\Modules\Finance\Services\FinanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditCardResetTest extends TestCase
{
    use RefreshDatabase;

    private FinanceAccountRepository $repository;
    private FinanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = app(FinanceAccountRepository::class);
        $this->service = app(FinanceService::class);
    }

    public function test_credit_card_reverts_to_full_limit_when_fully_paid()
    {
        // Create a credit card with some used credit
        $account = FinanceAccount::create([
            'user_id' => 1,
            'name' => 'Test Credit Card',
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

    public function test_credit_card_partial_payment_maintains_correct_values()
    {
        // Create a credit card with some used credit
        $account = FinanceAccount::create([
            'user_id' => 1,
            'name' => 'Test Credit Card',
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

    public function test_credit_card_manual_update_to_zero_reverts_to_full_limit()
    {
        // Create a credit card with some used credit
        $account = FinanceAccount::create([
            'user_id' => 1,
            'name' => 'Test Credit Card',
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
        // Create a credit card with some used credit
        $account = FinanceAccount::create([
            'user_id' => 1,
            'name' => 'Test Credit Card',
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
