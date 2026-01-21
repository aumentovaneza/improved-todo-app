<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('finance_accounts', function (Blueprint $table) {
            $table->decimal('used_credit', 12, 2)
                ->default(0)
                ->after('available_credit');
        });

        DB::table('finance_accounts')
            ->where('type', 'credit-card')
            ->update([
                'used_credit' => DB::raw(
                    'CASE WHEN credit_limit - available_credit < 0 THEN 0 ELSE credit_limit - available_credit END'
                ),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_accounts', function (Blueprint $table) {
            $table->dropColumn('used_credit');
        });
    }
};
