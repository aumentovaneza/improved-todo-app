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
        DB::statement(
            "ALTER TABLE finance_transactions MODIFY COLUMN type ENUM('income','expense','savings','loan','transfer') NOT NULL"
        );

        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->foreignId('finance_transfer_account_id')
                ->nullable()
                ->after('finance_account_id')
                ->constrained('finance_accounts')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('finance_transfer_account_id');
        });

        DB::statement(
            "ALTER TABLE finance_transactions MODIFY COLUMN type ENUM('income','expense','savings','loan') NOT NULL"
        );
    }
};
