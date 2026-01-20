<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('finance_savings_goals', function (Blueprint $table) {
            $table->foreignId('finance_account_id')
                ->nullable()
                ->after('user_id')
                ->constrained('finance_accounts')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_savings_goals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('finance_account_id');
        });
    }
};
