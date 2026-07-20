<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Flags starter content seeded for brand-new users so it can be shown with
     * a "sample" affordance and cleared in one click.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_sample')->default(false)->after('user_id');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('is_sample')->default(false)->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('is_sample');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('is_sample');
        });
    }
};
