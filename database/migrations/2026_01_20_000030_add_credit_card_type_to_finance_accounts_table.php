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
        DB::statement("ALTER TABLE finance_accounts MODIFY COLUMN type ENUM('bank','e-wallet','credit-card') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE finance_accounts MODIFY COLUMN type ENUM('bank','e-wallet') NOT NULL");
    }
};
