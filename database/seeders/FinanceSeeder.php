<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
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

            $emergencyGoal = FinanceSavingsGoal::create([
                'user_id' => $user->id,
                'name' => 'Emergency fund',
                'target_amount' => 10000,
                'current_amount' => 2200,
                'currency' => 'PHP',
                'target_date' => now()->addMonths(10),
                'notes' => 'Build a 6-month safety net.',
            ]);

            $vacationGoal = FinanceSavingsGoal::create([
                'user_id' => $user->id,
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
                'type' => 'income',
                'amount' => 5200,
                'currency' => 'PHP',
                'description' => 'Monthly salary',
                'occurred_at' => now()->subDays(5),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[0]->id,
                'type' => 'expense',
                'amount' => 1400,
                'currency' => 'PHP',
                'description' => 'Rent',
                'occurred_at' => now()->subDays(3),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[1]->id,
                'type' => 'expense',
                'amount' => 320,
                'currency' => 'PHP',
                'description' => 'Groceries',
                'occurred_at' => now()->subDays(2),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[2]->id,
                'type' => 'expense',
                'amount' => 120,
                'currency' => 'PHP',
                'description' => 'Transit card',
                'occurred_at' => now()->subDay(),
            ]);

            FinanceTransaction::create([
                'user_id' => $user->id,
                'finance_category_id' => $savingsCategory->id,
                'finance_savings_goal_id' => $emergencyGoal->id,
                'type' => 'savings',
                'amount' => 600,
                'currency' => 'PHP',
                'description' => 'Emergency fund deposit',
                'occurred_at' => now()->subDays(4),
            ]);

            FinanceBudget::create([
                'user_id' => $user->id,
                'finance_category_id' => $expenseCategories[1]->id,
                'name' => 'Groceries budget',
                'amount' => 500,
                'currency' => 'PHP',
                'period' => 'monthly',
                'starts_on' => now()->startOfMonth(),
                'ends_on' => now()->endOfMonth(),
                'is_active' => true,
            ]);

        }
    }
}
