<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix existing credit cards with incorrect bounds
        DB::table('finance_accounts')
            ->where('type', 'credit-card')
            ->update([
                'used_credit' => DB::raw('
                    CASE 
                        WHEN used_credit < 0 THEN 0
                        WHEN used_credit > credit_limit THEN credit_limit
                        ELSE used_credit
                    END
                '),
                'available_credit' => DB::raw('
                    CASE 
                        WHEN used_credit = 0 THEN credit_limit
                        WHEN available_credit < 0 THEN 0
                        WHEN available_credit > credit_limit THEN credit_limit - used_credit
                        WHEN available_credit > (credit_limit - used_credit) THEN credit_limit - used_credit
                        ELSE available_credit
                    END
                ')
            ]);
    }

    public function down(): void
    {
        // No need to revert this fix
    }
};
