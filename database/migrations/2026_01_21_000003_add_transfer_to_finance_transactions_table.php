<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->setEnum(['income', 'expense', 'savings', 'loan', 'transfer']);

        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->foreignId('finance_transfer_account_id')
                ->nullable()
                ->after('finance_account_id')
                ->constrained('finance_accounts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('finance_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('finance_transfer_account_id');
        });

        $this->setEnum(['income', 'expense', 'savings', 'loan']);
    }

    private function setEnum(array $values): void
    {
        $driver = DB::connection()->getDriverName();
        $list = "'" . implode("','", $values) . "'";

        if ($driver === 'pgsql') {
            foreach ($this->pgCheckConstraints('finance_transactions', 'type') as $name) {
                DB::statement("ALTER TABLE finance_transactions DROP CONSTRAINT \"{$name}\"");
            }
            DB::statement("ALTER TABLE finance_transactions ADD CONSTRAINT finance_transactions_type_check CHECK (type IN ({$list}))");
        } else {
            DB::statement("ALTER TABLE finance_transactions MODIFY COLUMN type ENUM({$list}) NOT NULL");
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
