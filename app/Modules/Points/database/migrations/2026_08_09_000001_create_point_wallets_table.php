<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('balance')->default(0);
            $table->integer('lifetime_earned')->default(0);
            $table->integer('lifetime_spent')->default(0);
            $table->integer('current_streak_days')->default(0);
            $table->integer('longest_streak_days')->default(0);
            $table->date('last_earned_on')->nullable();
            $table->date('last_streak_awarded_on')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_wallets');
    }
};
