<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pomodoro_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client_request_id')->nullable();
            // work / short_break / long_break
            $table->string('type');
            $table->integer('duration_seconds');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('awarded_points')->default(0);
            $table->foreignId('point_ledger_entry_id')->nullable()
                ->constrained('point_ledger_entries')->nullOnDelete();
            $table->timestamps();

            // Idempotency per client-generated session id.
            $table->unique(['user_id', 'client_request_id']);
            $table->index(['user_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pomodoro_sessions');
    }
};
