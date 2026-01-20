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
        Schema::table('finance_budgets', function (Blueprint $table) {
            $table->enum('budget_type', ['spending', 'saved'])
                ->default('spending')
                ->after('finance_account_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_budgets', function (Blueprint $table) {
            $table->dropColumn('budget_type');
        });
    }
};
