<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Explicitly named `list_task` so it does not depend on Laravel's default
     * pivot-name guess (which would produce `task_task_list`).
     */
    public function up(): void
    {
        Schema::create('list_task', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_list_id')->constrained('task_lists')->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['task_list_id', 'task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('list_task');
    }
};
