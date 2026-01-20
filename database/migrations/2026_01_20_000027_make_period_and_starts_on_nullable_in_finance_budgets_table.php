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
            $table->string('period')->nullable()->change();
            $table->date('starts_on')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance_budgets', function (Blueprint $table) {
            $table->string('period')->nullable(false)->change();
            $table->date('starts_on')->nullable(false)->change();
        });
    }
};
