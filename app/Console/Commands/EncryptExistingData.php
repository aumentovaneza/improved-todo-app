<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * One-off backfill that encrypts pre-existing plaintext rows so they match the
 * models' new `encrypted` / `encrypted:array` casts.
 *
 * The encrypted at-rest representation for BOTH cast flavours is simply
 * Crypt::encryptString(<raw stored string>) — for JSON columns the raw stored
 * value is already the json_encoded text, so the same call applies uniformly.
 *
 * Idempotent: each value is probed with Crypt::decryptString() first; anything
 * that already decrypts (MAC-verified) is left alone, so re-runs are no-ops and
 * already-encrypted columns like finance_accounts.account_number are skipped.
 *
 * ALWAYS run the column-widening migration first, and back up APP_KEY + the DB
 * before running this against real data — encrypted data is unrecoverable
 * without APP_KEY.
 */
class EncryptExistingData extends Command
{
    protected $signature = 'encrypt:existing-data
                            {--dry-run : Report how many values would be encrypted without writing}
                            {--force : Skip the confirmation prompt (for non-interactive runs)}
                            {--table= : Restrict to a single table}';

    protected $description = 'Encrypt pre-existing plaintext rows to match the encrypted model casts';

    /**
     * table => list of columns now cast as encrypted / encrypted:array.
     */
    private array $map = [
        'tasks' => ['title', 'description', 'recurrence_config'],
        'subtasks' => ['title'],
        'categories' => ['name', 'description'],
        'workspaces' => ['name', 'description'],
        'boards' => ['name', 'description'],
        'swimlanes' => ['name'],
        'activity_logs' => ['old_values', 'new_values'],
        'users' => ['tutorial_progress'],
        'finance_transactions' => ['description', 'notes', 'payment_method'],
        'finance_accounts' => ['name', 'label', 'account_number', 'notes'],
        'finance_categories' => ['name'],
        'finance_budgets' => ['name'],
        'finance_savings_goals' => ['name', 'notes'],
        'finance_loans' => ['name', 'notes'],
        'finance_reports' => ['payload'],
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $only = $this->option('table');

        if ($dryRun) {
            $this->warn('DRY RUN — no data will be written.');
        } else {
            $this->warn('This will encrypt plaintext rows in place. Ensure APP_KEY and the DB are backed up.');
            if (! $this->option('force') && ! $this->confirm('Proceed?', false)) {
                $this->info('Aborted.');

                return self::SUCCESS;
            }
        }

        $grandTotal = 0;

        foreach ($this->map as $table => $columns) {
            if ($only && $only !== $table) {
                continue;
            }

            if (! $this->tableAndColumnsExist($table, $columns)) {
                $this->line("Skipping <comment>{$table}</comment> (table/columns not present).");

                continue;
            }

            $encrypted = $this->processTable($table, $columns, $dryRun);
            $grandTotal += $encrypted;
            $this->line("  {$table}: {$encrypted} value(s) ".($dryRun ? 'would be encrypted' : 'encrypted'));
        }

        $verb = $dryRun ? 'would be encrypted' : 'encrypted';
        $this->info("Done. {$grandTotal} value(s) {$verb}.");

        return self::SUCCESS;
    }

    private function processTable(string $table, array $columns, bool $dryRun): int
    {
        $count = 0;

        DB::table($table)
            ->select(array_merge(['id'], $columns))
            ->orderBy('id')
            ->chunkById(500, function ($rows) use ($table, $columns, $dryRun, &$count) {
                foreach ($rows as $row) {
                    $updates = [];

                    foreach ($columns as $column) {
                        $value = $row->{$column};

                        if ($value === null || $this->isEncrypted($value)) {
                            continue;
                        }

                        $count++;

                        if (! $dryRun) {
                            $updates[$column] = Crypt::encryptString((string) $value);
                        }
                    }

                    if (! $dryRun && $updates !== []) {
                        DB::table($table)->where('id', $row->id)->update($updates);
                    }
                }
            });

        return $count;
    }

    private function isEncrypted(mixed $value): bool
    {
        if (! is_string($value) || $value === '') {
            return false;
        }

        try {
            Crypt::decryptString($value);

            return true;
        } catch (DecryptException) {
            return false;
        }
    }

    private function tableAndColumnsExist(string $table, array $columns): bool
    {
        if (! DB::getSchemaBuilder()->hasTable($table)) {
            return false;
        }

        foreach ($columns as $column) {
            if (! DB::getSchemaBuilder()->hasColumn($table, $column)) {
                return false;
            }
        }

        return true;
    }
}
