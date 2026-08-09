<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // earn / spend / adjust / refund
            $table->string('type');
            // task_completion / subtask_completion / daily_streak / pomodoro_session /
            // store_purchase / purchase_refund / admin_adjust
            $table->string('source');
            // Signed so SUM(amount) == wallet balance.
            $table->integer('amount');
            $table->integer('balance_after');
            $table->string('sourceable_type')->nullable();
            $table->unsignedBigInteger('sourceable_id')->nullable();
            $table->string('client_request_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            // Idempotency: a client_request_id is used at most once per user.
            $table->unique(['user_id', 'client_request_id']);
            // Net-award guard lookups.
            $table->index(['sourceable_type', 'sourceable_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_ledger_entries');
    }
};
