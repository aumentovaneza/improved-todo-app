<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Models\FinanceLoan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class FinanceSeeder extends Seeder
{
    private ?Collection $users = null;

    public function setUsers(Collection $users): self
    {
        $this->users = $users;

        return $this;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = $this->users ?? User::all();

        foreach ($users as $user) {
            $mainStartingBalance = 3500;
            $mainAccount = FinanceAccount::create([
                'user_id' => $user->id,
                'name' => 'Main Bank',
                'label' => 'Salary account',
                'account_number' => '00123456789',
                'type' => 'bank',
                'currency' => 'PHP',
                'starting_balance' => $mainStartingBalance,
                'current_balance' => $mainStartingBalance + 5200 - 1400 - 320 - 120,
                'notes' => 'Primary expense and salary account.',
                'is_active' => true,
            ]);

            $savingsStartingBalance = 1200;
            $savingsAccount = FinanceAccount::create([
                'user_id' => $user->id,
                'name' => 'Savings Account',
                'label' => 'Emergency fund',
                'account_number' => '00987654321',
                'type' => 'bank',
                'currency' => 'PHP',
                'starting_balance' => $savingsStartingBalance,
                'current_balance' => $savingsStartingBalance + 600,
                'notes' => 'Dedicated savings account.',
                'is_active' => true,
            ]);

            $creditCard = FinanceAccount::create([
                'user_id' => $user->id,
                'name' => 'BDO Credit Card',
                'label' => 'Travel card',
                'account_number' => '4111111111111111',
                'type' => 'credit-card',
                'currency' => 'PHP',
                'credit_limit' => 60000,
                'available_credit' => 52000,
                'used_credit' => 8000,
                'notes' => 'Primary credit card for travel.',
                'is_active' => true,
            ]);

            $incomeCategory = FinanceCategory::create([
                'user_id' => $user->id,
                'name' => 'Salary',
                'type' => 'income',
                'color' => '#22C55E',
                'icon' => 'briefcase',
            ]);

            $expenseCategories = [
                FinanceCategory::create([
                    'user_id' => $user->id,
                    'name' => 'Housing',
                    'type' => 'expense',
                    'color' => '#EF4444',
                    'icon' => 'home',
                ]),
                FinanceCategory::create([
                    'user_id' => $user->id,
                    'name' => 'Groceries',
                    'type' => 'expense',
                    'color' => '#F97316',
                    'icon' => 'shopping-cart',
                ]),
                FinanceCategory::create([
                    'user_id' => $user->id,
                    'name' => 'Transportation',
                    'type' => 'expense',
                    'color' => '#3B82F6',
                    'icon' => 'car',
                ]),
            ];

            $savingsCategory = FinanceCategory::create([
                'user_id' => $user->id,
                'name' => 'Emergency Fund',
                'type' => 'savings',
                'color' => '#A855F7',
                'icon' => 'piggy-bank',
            ]);

            $loanCategory = FinanceCategory::create([
                'user_id' => $user->id,
                'name' => 'Personal Loan',
                'type' => 'loan',
                'color' => '#06B6D4',
                'icon' => 'hand-coins',
            ]);

            $emergencyGoal = FinanceSavingsGoal::create([
                'user_id' => $user->id,
                'finance_account_id' => $savingsAccount->id,
                'name' => 'Emergency fund',
                'target_amount' => 10000,
                'current_amount' => 2200,
                'currency' => 'PHP',
                'target_date' => now()->addMonths(10),
                'notes' => 'Build a 6-month safety net.',
            ]);

            $vacationGoal = FinanceSavingsGoal::create([
                'user_id' => $user->id,
                'finance_account_id' => $savingsAccount->id,
                'name' => 'Vacation',
                'target_amount' => 2500,
                'current_amount' => 900,
                'currency' => 'PHP',
                'target_date' => now()->addMonths(6),
                'notes' => 'Summer trip savings.',
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $incomeCategory->id,
                'finance_account_id' => $mainAccount->id,
                'type' => 'income',
                'amount' => 5200,
                'currency' => 'PHP',
                'description' => 'Monthly salary',
                'occurred_at' => now()->subDays(5),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[0]->id,
                'finance_account_id' => $mainAccount->id,
                'type' => 'expense',
                'amount' => 1400,
                'currency' => 'PHP',
                'description' => 'Rent',
                'occurred_at' => now()->subDays(3),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[1]->id,
                'finance_account_id' => $mainAccount->id,
                'type' => 'expense',
                'amount' => 320,
                'currency' => 'PHP',
                'description' => 'Groceries',
                'occurred_at' => now()->subDays(2),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[2]->id,
                'finance_account_id' => $mainAccount->id,
                'type' => 'expense',
                'amount' => 120,
                'currency' => 'PHP',
                'description' => 'Transit card',
                'occurred_at' => now()->subDay(),
            ]);

            $loan = FinanceLoan::create([
                'user_id' => $user->id,
                'name' => 'Car loan',
                'total_amount' => 15000,
                'remaining_amount' => 15000,
                'currency' => 'PHP',
                'target_date' => now()->addMonths(8),
                'notes' => 'Auto loan from dealership.',
                'is_active' => true,
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $loanCategory->id,
                'finance_loan_id' => $loan->id,
                'finance_account_id' => $mainAccount->id,
                'type' => 'loan',
                'amount' => 15000,
                'currency' => 'PHP',
                'description' => 'Car loan proceeds',
                'occurred_at' => now()->subDays(6),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[0]->id,
                'finance_credit_card_account_id' => $creditCard->id,
                'type' => 'expense',
                'amount' => 8000,
                'currency' => 'PHP',
                'description' => 'Airline ticket',
                'occurred_at' => now()->subDays(1),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $savingsCategory->id,
                'finance_savings_goal_id' => $emergencyGoal->id,
                'finance_account_id' => $savingsAccount->id,
                'type' => 'savings',
                'amount' => 600,
                'currency' => 'PHP',
                'description' => 'Emergency fund deposit',
                'occurred_at' => now()->subDays(4),
            ]);

            FinanceBudget::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[1]->id,
                'finance_account_id' => $mainAccount->id,
                'budget_type' => 'spending',
                'name' => 'Groceries budget',
                'amount' => 500,
                'currency' => 'PHP',
                'period' => 'monthly',
                'starts_on' => now()->startOfMonth(),
                'ends_on' => now()->endOfMonth(),
                'is_active' => true,
            ]);

            FinanceBudget::create([
                'user_id' => $user->id,
                'finance_account_id' => $savingsAccount->id,
                'budget_type' => 'saved',
                'name' => 'Japan trip budget',
                'amount' => 4000,
                'currency' => 'PHP',
                'period' => null,
                'starts_on' => null,
                'ends_on' => null,
                'is_recurring' => false,
                'is_active' => true,
            ]);

        }
    }
}
