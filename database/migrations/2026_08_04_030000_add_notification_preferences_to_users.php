<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Per-channel notification opt-in flags. Each notification's via() gates its
     * channels on these, replacing the temporary `?? true` masking in
     * NotificationService::getNotificationPreferences.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('email_notifications_enabled')->default(true)->after('daily_summary_time');
            $table->boolean('sms_notifications_enabled')->default(false)->after('email_notifications_enabled');
            $table->boolean('push_notifications_enabled')->default(true)->after('sms_notifications_enabled');
            $table->boolean('daily_digest_enabled')->default(true)->after('push_notifications_enabled');
            $table->boolean('weekly_summary_enabled')->default(true)->after('daily_digest_enabled');
            $table->boolean('reminder_notifications_enabled')->default(true)->after('weekly_summary_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_notifications_enabled',
                'sms_notifications_enabled',
                'push_notifications_enabled',
                'daily_digest_enabled',
                'weekly_summary_enabled',
                'reminder_notifications_enabled',
            ]);
        });
    }
};
