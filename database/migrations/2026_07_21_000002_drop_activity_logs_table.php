<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('activity_logs');
    }

    /**
     * Reverse the migrations.
     *
     * The activity_logs system has been removed entirely, so there is
     * nothing meaningful to restore here.
     */
    public function down(): void
    {
        // Intentionally left blank — the activity_logs table is no longer supported.
    }
};
