<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->setEnum(['income', 'expense', 'savings', 'loan']);
    }

    public function down(): void
    {
        $this->setEnum(['income', 'expense', 'savings']);
    }

    private function setEnum(array $values): void
    {
        $driver = DB::connection()->getDriverName();
        $list = "'" . implode("','", $values) . "'";

        if ($driver === 'pgsql') {
            foreach ($this->pgCheckConstraints('finance_categories', 'type') as $name) {
                DB::statement("ALTER TABLE finance_categories DROP CONSTRAINT \"{$name}\"");
            }
            DB::statement("ALTER TABLE finance_categories ADD CONSTRAINT finance_categories_type_check CHECK (type IN ({$list}))");
            DB::statement("ALTER TABLE finance_categories ALTER COLUMN type SET DEFAULT 'expense'");
        } else {
            DB::statement("ALTER TABLE finance_categories MODIFY COLUMN type ENUM({$list}) NOT NULL DEFAULT 'expense'");
        }
    }

    private function pgCheckConstraints(string $table, string $column): array
    {
        $rows = DB::select(
            "SELECT c.conname
               FROM pg_constraint c
               JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
              WHERE c.conrelid = ?::regclass
                AND c.contype = 'c'
                AND a.attname = ?",
            [$table, $column]
        );

        return array_map(fn ($row) => $row->conname, $rows);
    }
};
