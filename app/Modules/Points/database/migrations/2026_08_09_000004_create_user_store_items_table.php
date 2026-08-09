<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_store_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_item_id')->constrained('store_items')->cascadeOnDelete();
            // purchase / grant / default
            $table->string('acquired_via')->nullable();
            $table->foreignId('point_ledger_entry_id')->nullable()
                ->constrained('point_ledger_entries')->nullOnDelete();
            $table->timestamp('acquired_at')->nullable();
            $table->timestamps();

            // Double-purchase guard.
            $table->unique(['user_id', 'store_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_store_items');
    }
};
