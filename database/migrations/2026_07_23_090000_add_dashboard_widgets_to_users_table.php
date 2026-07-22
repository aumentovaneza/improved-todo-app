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
        Schema::table('users', function (Blueprint $table) {
            $table->json('dashboard_widgets')->nullable()->after('news_category');
            $table->boolean('daily_summary_enabled')->default(true)->after('dashboard_widgets');
            $table->string('daily_summary_time')->default('08:00')->after('daily_summary_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['dashboard_widgets', 'daily_summary_enabled', 'daily_summary_time']);
        });
    }
};
