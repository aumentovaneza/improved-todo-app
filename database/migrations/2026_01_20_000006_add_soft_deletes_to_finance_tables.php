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
            $table->decimal('current_spent', 12, 2)->default(0)->after('amount');
            $table->softDeletes();
        });

        Schema::table('finance_savings_goals', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_budgets', function (Blueprint $table) {
            $table->dropColumn('current_spent');
            $table->dropSoftDeletes();
        });

        Schema::table('finance_savings_goals', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
