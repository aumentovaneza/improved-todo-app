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
        Schema::table('finance_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('finance_transactions', 'finance_loan_id')) {
                $table->foreignId('finance_loan_id')
                    ->nullable()
                    ->after('finance_category_id')
                    ->constrained('finance_loans')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('finance_transactions', 'finance_loan_id')) {
                $table->dropConstrainedForeignId('finance_loan_id');
            }
        });
    }
};
