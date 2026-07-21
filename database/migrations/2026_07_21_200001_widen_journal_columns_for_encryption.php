<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen the Journal + calendar-month-title columns that now use the `encrypted`
 * / `encrypted:array` casts (see JournalEntry, JournalTag, CalendarMonthTitle).
 *
 * Runs after the module's create migrations (later timestamp). The unique index
 * on journal_tags(user_id, name) must be dropped first: MySQL cannot index a
 * TEXT column without a key length, and the constraint is meaningless once the
 * name is non-deterministic ciphertext (uniqueness is now enforced in PHP by
 * JournalTagRepository::syncByNames). Must run BEFORE the encrypt:existing-data
 * backfill. Portable across MySQL / SQLite / Postgres.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('journal_tags')) {
            // The user_id FK is supported by the leftmost column of the
            // (user_id, name) unique index; add a standalone user_id index so
            // the FK still has one after we drop the unique index.
            Schema::table('journal_tags', function (Blueprint $table) {
                $table->index('user_id');
            });

            Schema::table('journal_tags', function (Blueprint $table) {
                $table->dropUnique(['user_id', 'name']);
            });

            Schema::table('journal_tags', function (Blueprint $table) {
                $table->text('name')->change();
            });
        }

        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->text('title')->change();
                $table->text('content')->change();
            });
        }

        if (Schema::hasTable('calendar_month_titles')) {
            Schema::table('calendar_month_titles', function (Blueprint $table) {
                $table->text('title')->change();
            });
        }
    }

    /**
     * Down restores original types/constraints for schema symmetry only.
     * WARNING: destructive if encrypted data is present (ciphertext will not fit
     * in varchar). Decrypt/restore before rolling back in production.
     */
    public function down(): void
    {
        if (Schema::hasTable('journal_entries')) {
            Schema::table('journal_entries', function (Blueprint $table) {
                $table->string('title')->change();
                $table->json('content')->change();
            });
        }

        if (Schema::hasTable('calendar_month_titles')) {
            Schema::table('calendar_month_titles', function (Blueprint $table) {
                $table->string('title', 60)->change();
            });
        }

        if (Schema::hasTable('journal_tags')) {
            Schema::table('journal_tags', function (Blueprint $table) {
                $table->string('name')->change();
            });

            Schema::table('journal_tags', function (Blueprint $table) {
                $table->unique(['user_id', 'name']);
            });

            Schema::table('journal_tags', function (Blueprint $table) {
                $table->dropIndex(['user_id']);
            });
        }
    }
};
