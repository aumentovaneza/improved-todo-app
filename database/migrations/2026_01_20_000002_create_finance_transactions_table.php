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
        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('finance_category_id')
                ->nullable()
                ->constrained('finance_categories')
                ->nullOnDelete();
            $table->enum('type', ['income', 'expense', 'savings'])->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 8)->default('PHP');
            $table->string('description');
            $table->text('notes')->nullable();
            $table->string('payment_method')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_transactions');
    }
};
