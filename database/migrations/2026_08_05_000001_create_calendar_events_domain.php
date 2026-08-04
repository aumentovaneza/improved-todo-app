<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_calendars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('name');
            $table->string('color', 7)->default('#4ACF91');
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'position']);
        });

        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_calendar_id')->constrained()->cascadeOnDelete();
            $table->text('title');
            $table->text('notes')->nullable();
            $table->text('location')->nullable();
            $table->string('kind', 24)->default('event');
            $table->boolean('is_all_day')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->string('timezone', 64)->default('UTC');
            $table->string('color', 7)->nullable();
            $table->text('recurrence_rule')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'starts_at']);
            $table->index(['user_id', 'start_date']);
        });

        Schema::create('calendar_event_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calendar_event_id')->constrained()->cascadeOnDelete();
            $table->string('occurrence_key', 80);
            $table->boolean('is_cancelled')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->text('overrides')->nullable();
            $table->timestamps();

            $table->unique(['calendar_event_id', 'occurrence_key'], 'calendar_event_occurrence_unique');
        });

        Schema::create('calendar_event_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calendar_event_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('offset_minutes');
            $table->dateTime('next_remind_at')->nullable();
            $table->string('next_occurrence_key', 80)->nullable();
            $table->timestamps();

            $table->unique(['calendar_event_id', 'offset_minutes']);
            $table->index('next_remind_at');
        });

        Schema::create('calendar_event_reminder_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('calendar_event_reminder_id')->constrained()->cascadeOnDelete();
            $table->string('occurrence_key', 80);
            $table->dateTime('scheduled_for');
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['calendar_event_reminder_id', 'occurrence_key'],
                'calendar_event_reminder_occurrence_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_event_reminder_deliveries');
        Schema::dropIfExists('calendar_event_reminders');
        Schema::dropIfExists('calendar_event_exceptions');
        Schema::dropIfExists('calendar_events');
        Schema::dropIfExists('event_calendars');
    }
};
