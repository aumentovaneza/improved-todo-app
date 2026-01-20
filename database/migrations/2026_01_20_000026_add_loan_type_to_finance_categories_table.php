<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE finance_categories MODIFY COLUMN type ENUM('income','expense','savings','loan') NOT NULL DEFAULT 'expense'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE finance_categories MODIFY COLUMN type ENUM('income','expense','savings') NOT NULL DEFAULT 'expense'");
    }
};
