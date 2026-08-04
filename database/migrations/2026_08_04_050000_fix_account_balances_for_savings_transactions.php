<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill for the savings-transaction balance bug.
 *
 * Before this release, a `savings` transaction wrongly ADDED its amount to the
 * source account's current_balance instead of subtracting it (it fell into the
 * `default` arm of adjustAccountBalance). Because the reverse-on-delete path used
 * the same buggy sign, the residual error on any account is exactly +2x the sum
 * of the amounts of its currently-existing savings transactions.
 *
 * This corrects the stored balances by subtracting that error. Credit-card
 * accounts are skipped: their balance lives in used_credit/available_credit and
 * savings transactions never target them.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->applyCorrection(-2.0);
    }

    public function down(): void
    {
        $this->applyCorrection(2.0);
    }

    private function applyCorrection(float $factor): void
    {
        $sums = DB::table('finance_transactions')
            ->select('finance_account_id', DB::raw('SUM(amount) as total'))
            ->where('type', 'savings')
            ->whereNotNull('finance_account_id')
            ->groupBy('finance_account_id')
            ->pluck('total', 'finance_account_id');

        foreach ($sums as $accountId => $total) {
            $delta = $factor * (float) $total;
            if ($delta === 0.0) {
                continue;
            }

            DB::table('finance_accounts')
                ->where('id', $accountId)
                ->where('type', '!=', 'credit-card')
                ->update([
                    'current_balance' => DB::raw('current_balance + ('.$delta.')'),
                ]);
        }
    }
};
