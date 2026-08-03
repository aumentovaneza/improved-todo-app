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
        Schema::create('task_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('is_sample')->default(false);
            // Encrypted at rest — ciphertext exceeds varchar(255), so use text.
            $table->text('name');
            $table->string('color', 7)->default('#3B82F6');
            // Encrypted at rest.
            $table->text('description')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_lists');
    }
};
