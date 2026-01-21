<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $accounts = DB::table('finance_accounts')
            ->where('type', '!=', 'credit-card')
            ->where('starting_balance', '>', 0)
            ->get([
                'id',
                'user_id',
                'currency',
                'starting_balance',
                'created_at',
            ]);

        foreach ($accounts as $account) {
            $hasOpening = DB::table('finance_transactions')
                ->where('finance_account_id', $account->id)
                ->where('metadata->source', 'opening_balance')
                ->exists();

            if ($hasOpening) {
                continue;
            }

            $occurredAt = $account->created_at
                ? Carbon::parse($account->created_at)
                : now();

            DB::table('finance_transactions')->insert([
                'user_id' => $account->user_id,
                'created_by_user_id' => $account->user_id,
                'finance_category_id' => null,
                'finance_account_id' => $account->id,
                'finance_loan_id' => null,
                'finance_savings_goal_id' => null,
                'finance_budget_id' => null,
                'finance_credit_card_account_id' => null,
                'type' => 'income',
                'amount' => (float) $account->starting_balance,
                'currency' => $account->currency ?? 'PHP',
                'description' => 'Opening balance',
                'notes' => null,
                'payment_method' => null,
                'is_recurring' => false,
                'recurring_frequency' => null,
                'metadata' => json_encode(['source' => 'opening_balance']),
                'occurred_at' => $occurredAt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('finance_transactions')
            ->where('metadata->source', 'opening_balance')
            ->delete();
    }
};
