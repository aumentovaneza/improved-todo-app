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
        Schema::create('swimlanes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('position')->default(0);
            $table->string('color', 7)->default('#6B7280'); // Hex color for swimlane
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['board_id', 'position']);
            $table->index(['board_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swimlanes');
    }
};
