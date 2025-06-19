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
        Schema::table('tasks', function (Blueprint $table) {
            // Add start_time field
            $table->time('start_time')->nullable()->after('due_date');

            // Rename due_time to end_time for clarity
            $table->renameColumn('due_time', 'end_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Remove start_time field
            $table->dropColumn('start_time');

            // Rename end_time back to due_time
            $table->renameColumn('end_time', 'due_time');
        });
    }
};
