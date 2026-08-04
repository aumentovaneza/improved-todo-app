<?php

namespace Tests\Feature\Modules\Finance;

use App\Models\User;
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

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = app(FinanceAccountRepository::class);
        $this->service = app(FinanceService::class);
        $this->userId = User::factory()->create()->id;
    }

    public function test_credit_card_reverts_to_full_limit_when_fully_paid()
    {
        // Create a credit card with some used credit
        $account = FinanceAccount::create([
            'user_id' => $this->userId,
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
            'user_id' => $this->userId,
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
            'user_id' => $this->userId,
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
            'user_id' => $this->userId,
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

    public function test_credit_card_payment_lifecycle_updates_and_reverses_both_accounts()
    {
        $user = User::factory()->create();
        $bank = FinanceAccount::create([
            'user_id' => $user->id,
            'name' => 'Payment Bank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 2000,
            'current_balance' => 2000,
            'is_active' => true,
        ]);
        $card = FinanceAccount::create([
            'user_id' => $user->id,
            'name' => 'Payment Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 5000,
            'used_credit' => 1000,
            'available_credit' => 4000,
            'is_active' => true,
        ]);

        $payment = $this->service->createTransaction([
            'finance_account_id' => $bank->id,
            'finance_credit_card_account_id' => $card->id,
            'type' => 'expense',
            'amount' => 400,
            'currency' => 'PHP',
            'description' => 'Card payment',
            'occurred_at' => now(),
        ], $user->id, $user->id);

        $this->assertEqualsWithDelta(1600, (float) $bank->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(600, (float) $card->refresh()->used_credit, 0.001);
        $this->assertEqualsWithDelta(4400, (float) $card->available_credit, 0.001);

        $this->service->updateTransaction($payment, ['amount' => 250], $user->id);

        $this->assertEqualsWithDelta(1750, (float) $bank->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(750, (float) $card->refresh()->used_credit, 0.001);
        $this->assertEqualsWithDelta(4250, (float) $card->available_credit, 0.001);

        $this->service->deleteTransaction($payment->refresh(), $user->id);

        $this->assertEqualsWithDelta(2000, (float) $bank->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(1000, (float) $card->refresh()->used_credit, 0.001);
        $this->assertEqualsWithDelta(4000, (float) $card->available_credit, 0.001);
    }

    public function test_full_credit_card_payment_restores_the_entire_limit()
    {
        $user = User::factory()->create();
        $bank = FinanceAccount::create([
            'user_id' => $user->id,
            'name' => 'Payment Bank',
            'type' => 'bank',
            'currency' => 'PHP',
            'starting_balance' => 2000,
            'current_balance' => 2000,
            'is_active' => true,
        ]);
        $card = FinanceAccount::create([
            'user_id' => $user->id,
            'name' => 'Payment Card',
            'type' => 'credit-card',
            'currency' => 'PHP',
            'credit_limit' => 5000,
            'used_credit' => 1000,
            'available_credit' => 4000,
            'is_active' => true,
        ]);

        $this->service->createTransaction([
            'finance_account_id' => $bank->id,
            'finance_credit_card_account_id' => $card->id,
            'type' => 'expense',
            'amount' => 1000,
            'currency' => 'PHP',
            'description' => 'Full card payment',
            'occurred_at' => now(),
        ], $user->id, $user->id);

        $this->assertEqualsWithDelta(1000, (float) $bank->refresh()->current_balance, 0.001);
        $this->assertEqualsWithDelta(0, (float) $card->refresh()->used_credit, 0.001);
        $this->assertEqualsWithDelta(5000, (float) $card->available_credit, 0.001);
    }
}
