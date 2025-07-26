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
            $table->foreignId('board_id')->nullable()->constrained()->onDelete('cascade')->after('category_id');
            $table->foreignId('swimlane_id')->nullable()->constrained()->onDelete('cascade')->after('board_id');

            $table->index(['board_id', 'swimlane_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['board_id']);
            $table->dropForeign(['swimlane_id']);
            $table->dropIndex(['board_id', 'swimlane_id', 'position']);
            $table->dropColumn(['board_id', 'swimlane_id']);
        });
    }
};
