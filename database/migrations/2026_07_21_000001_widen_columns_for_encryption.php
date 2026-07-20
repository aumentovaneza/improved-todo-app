<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen columns that now use Laravel's `encrypted` / `encrypted:array` cast.
 *
 * Encrypted ciphertext is ~2-4x the plaintext (plus base64), so it will not fit
 * in varchar(255). It is also NOT valid JSON, so native `json` columns reject it.
 * Both cases must become `text`. Columns already typed `text` are left untouched.
 *
 * Portable across MySQL (prod), SQLite (tests), and Postgres.
 * Must run BEFORE the `encrypt:existing-data` backfill command.
 */
return new class extends Migration
{
    /**
     * string/json columns → text. Format: table => [ [column, nullable], ... ]
     */
    private array $toText = [
        'tasks' => [
            ['title', false],
            ['recurrence_config', true],
        ],
        'subtasks' => [
            ['title', false],
        ],
        'categories' => [
            ['name', false],
        ],
        'workspaces' => [
            ['name', false],
        ],
        'boards' => [
            ['name', false],
        ],
        'swimlanes' => [
            ['name', false],
        ],
        'activity_logs' => [
            ['old_values', true],
            ['new_values', true],
        ],
        'users' => [
            ['tutorial_progress', true],
        ],
        'finance_categories' => [
            ['name', false],
        ],
        'finance_transactions' => [
            ['description', false],
            ['payment_method', true],
            // metadata intentionally left as native json — queried in SQL via
            // JSON-path in the finance reporting aggregations, so not encrypted.
        ],
        'finance_budgets' => [
            ['name', false],
        ],
        'finance_reports' => [
            ['payload', false],
        ],
        'finance_savings_goals' => [
            ['name', false],
        ],
        'finance_loans' => [
            ['name', false],
        ],
        'finance_accounts' => [
            ['name', false],
            ['label', true],
        ],
    ];

    public function up(): void
    {
        foreach ($this->toText as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $columns) {
                foreach ($columns as [$column, $nullable]) {
                    if (! Schema::hasColumn($table, $column)) {
                        continue;
                    }

                    $definition = $blueprint->text($column);

                    if ($nullable) {
                        $definition->nullable();
                    }

                    $definition->change();
                }
            });
        }
    }

    /**
     * Down restores the original column types for schema symmetry only.
     * WARNING: if encrypted data is present it will not fit in varchar and this
     * rollback is destructive. Decrypt/restore data before rolling back in prod.
     */
    public function down(): void
    {
        $original = [
            'tasks' => [['title', 'string', false], ['recurrence_config', 'json', true]],
            'subtasks' => [['title', 'string', false]],
            'categories' => [['name', 'string', false]],
            'workspaces' => [['name', 'string', false]],
            'boards' => [['name', 'string', false]],
            'swimlanes' => [['name', 'string', false]],
            'activity_logs' => [['old_values', 'json', true], ['new_values', 'json', true]],
            'users' => [['tutorial_progress', 'json', true]],
            'finance_categories' => [['name', 'string', false]],
            'finance_transactions' => [['description', 'string', false], ['payment_method', 'string', true]],
            'finance_budgets' => [['name', 'string', false]],
            'finance_reports' => [['payload', 'json', false]],
            'finance_savings_goals' => [['name', 'string', false]],
            'finance_loans' => [['name', 'string', false]],
            'finance_accounts' => [['name', 'string', false], ['label', 'string', true]],
        ];

        foreach ($original as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $columns) {
                foreach ($columns as [$column, $type, $nullable]) {
                    if (! Schema::hasColumn($table, $column)) {
                        continue;
                    }

                    $definition = $type === 'json'
                        ? $blueprint->json($column)
                        : $blueprint->string($column);

                    if ($nullable) {
                        $definition->nullable();
                    }

                    $definition->change();
                }
            });
        }
    }
};
