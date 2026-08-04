<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Idempotency markers so due/overdue notifications are only ever sent once
     * per task by the scheduled dispatcher.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('due_notified_at')->nullable()->after('completed_at');
            $table->timestamp('overdue_notified_at')->nullable()->after('due_notified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['due_notified_at', 'overdue_notified_at']);
        });
    }
};
