<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\ProductionShowcaseSeeder;
use Database\Seeders\FinanceSeeder;
use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceLoan;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Support\Facades\DB;

class SetupShowcaseUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:setup-showcase {--force : Force creation even if user already exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a showcase user with comprehensive data to demonstrate all app features';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up showcase user for production demo...');

        // Check if showcase user already exists
        $existingUser = User::where('email', 'showcase@todoapp.com')->first();

        if ($existingUser && !$this->option('force')) {
            $this->warn('Showcase user already exists!');
            $this->line('Email: showcase@todoapp.com');
            $this->line('Use --force option to recreate the user and data.');
            return 1;
        }

        if ($existingUser && $this->option('force')) {
            $this->warn('Removing existing showcase user and related data...');

            // Delete related data first
            $existingUser->tasks()->each(function ($task) {
                $task->subtasks()->delete();
                $task->reminders()->delete();
                $task->tags()->detach();
                $task->delete();
            });

            $existingUser->reminders()->delete();
            $existingUser->activityLogs()->delete();
            $transactionIds = FinanceTransaction::where('user_id', $existingUser->id)
                ->pluck('id');
            if ($transactionIds->isNotEmpty()) {
                DB::table('finance_transaction_tag')
                    ->whereIn('finance_transaction_id', $transactionIds)
                    ->delete();
            }
            $existingUser->financeTransactions()->delete();
            $existingUser->financeBudgets()->delete();
            $existingUser->financeSavingsGoals()->delete();
            $existingUser->financeCategories()->delete();
            FinanceLoan::where('user_id', $existingUser->id)->delete();
            FinanceAccount::where('user_id', $existingUser->id)->delete();
            DB::table('finance_reports')
                ->where('user_id', $existingUser->id)
                ->delete();
            DB::table('finance_wallet_collaborators')
                ->where('owner_user_id', $existingUser->id)
                ->orWhere('collaborator_user_id', $existingUser->id)
                ->delete();
            DB::table('finance_wallet_invitations')
                ->where('owner_user_id', $existingUser->id)
                ->delete();
            $existingUser->delete();

            $this->info('Existing showcase user removed.');
        }

        // Run the seeder
        $this->info('Creating showcase user with comprehensive demo data...');

        $seeder = new ProductionShowcaseSeeder();
        $seeder->setCommand($this);
        $seeder->run();
        $showcaseUser = User::where('email', 'showcase@todoapp.com')->first();
        if ($showcaseUser) {
            $financeSeeder = new FinanceSeeder();
            $financeSeeder->setCommand($this);
            $financeSeeder->setUsers(collect([$showcaseUser]));
            $financeSeeder->run();
            $this->seedExtraFinanceData($showcaseUser);
        }

        $this->newLine();
        $this->info('🎉 Showcase setup completed successfully!');
        $this->newLine();
        $this->line('This user has been created with:');
        $this->line('• Diverse task categories (Work, Personal, Health, Learning, etc.)');
        $this->line('• Tasks with different priorities and statuses');
        $this->line('• Overdue, today, and future tasks');
        $this->line('• Recurring tasks (daily, weekly, monthly)');
        $this->line('• Tasks with subtasks and reminders');
        $this->line('• Tasks tagged with various labels');
        $this->line('• Completed and in-progress tasks');
        $this->line('• Time-specific and all-day tasks');
        $this->line('• WevieWallet accounts (bank, e-wallet, credit cards)');
        $this->line('• Budgets (recurring and saved), goals, and loans');
        $this->line('• Transactions with credit card charges and payments');
        $this->newLine();

        return 0;
    }

    private function seedExtraFinanceData(User $user): void
    {
        $expenseCategories = FinanceCategory::where('user_id', $user->id)
            ->where('type', 'expense')
            ->orderBy('name')
            ->get();
        $creditCards = FinanceAccount::where('user_id', $user->id)
            ->where('type', 'credit-card')
            ->orderBy('name')
            ->get();

        if ($creditCards->count() < 2) {
            $creditCards->push(FinanceAccount::create([
                'user_id' => $user->id,
                'name' => 'Maya Credit Card',
                'label' => 'Everyday card',
                'account_number' => '5555555555554444',
                'type' => 'credit-card',
                'currency' => 'PHP',
                'credit_limit' => 20000,
                'available_credit' => 15500,
                'notes' => 'Daily spending credit line.',
                'is_active' => true,
            ]));
        }

        if ($expenseCategories->isEmpty() || $creditCards->isEmpty()) {
            return;
        }

        $charges = [
            [
                'amount' => 2300,
                'description' => 'Hotel booking',
                'occurred_at' => now()->subDays(8),
            ],
            [
                'amount' => 420,
                'description' => 'Coffee and snacks',
                'occurred_at' => now()->subDays(4),
            ],
            [
                'amount' => 1850,
                'description' => 'Online shopping',
                'occurred_at' => now()->subDays(2),
            ],
        ];

        foreach ($creditCards as $index => $card) {
            foreach ($charges as $offset => $charge) {
                $category = $expenseCategories[($index + $offset) % $expenseCategories->count()];
                FinanceTransaction::create([
                    'user_id' => $user->id,
                    'finance_category_id' => $category->id,
                    'finance_credit_card_account_id' => $card->id,
                    'type' => 'expense',
                    'amount' => $charge['amount'],
                    'currency' => $card->currency ?? 'PHP',
                    'description' => $charge['description'],
                    'occurred_at' => $charge['occurred_at'],
                ]);
            }
        }
    }
}
