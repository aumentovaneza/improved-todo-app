<?php

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Proves the `encrypted` / `encrypted:array` casts store ciphertext at rest
 * (a DB dump / DBA sees no plaintext) while the model transparently returns the
 * original value, and that the one-off backfill command is correct + idempotent.
 */
function rawValue(string $table, int $id, string $column): ?string
{
    return DB::table($table)->where('id', $id)->value($column);
}

it('stores task title and description encrypted but reads them back plaintext', function () {
    $user = User::factory()->create();

    $task = Task::create([
        'user_id' => $user->id,
        'title' => 'Overthrow the tyrant',
        'description' => 'Secret battle plan details',
        'priority' => 'high',
        'status' => 'pending',
        'position' => 1,
    ]);

    $rawTitle = rawValue('tasks', $task->id, 'title');
    $rawDescription = rawValue('tasks', $task->id, 'description');

    // At rest: ciphertext, containing none of the plaintext.
    expect($rawTitle)->not->toBe('Overthrow the tyrant')
        ->and(str_contains($rawTitle, 'tyrant'))->toBeFalse()
        ->and(str_contains($rawDescription, 'battle plan'))->toBeFalse()
        ->and(Crypt::decryptString($rawTitle))->toBe('Overthrow the tyrant');

    // Through the model: transparent plaintext.
    expect(Task::find($task->id)->title)->toBe('Overthrow the tyrant')
        ->and(Task::find($task->id)->description)->toBe('Secret battle plan details');
});

it('encrypts category, finance account and transaction content at rest', function () {
    $user = User::factory()->create();

    $category = Category::create([
        'user_id' => $user->id,
        'name' => 'Personal Health',
        'color' => '#4ACF91',
    ]);

    $account = FinanceAccount::create([
        'user_id' => $user->id,
        'name' => 'Main Checking',
        'label' => 'Everyday',
        'account_number' => '1234567890',
        'notes' => 'Primary salary account',
        'type' => 'bank',
        'currency' => 'PHP',
    ]);

    $transaction = FinanceTransaction::create([
        'user_id' => $user->id,
        'type' => 'expense',
        'amount' => 42.50,
        'currency' => 'PHP',
        'description' => 'Dinner with in-laws',
        'notes' => 'Private note',
        'payment_method' => 'Visa ending 4242',
        'occurred_at' => now(),
    ]);

    expect(rawValue('categories', $category->id, 'name'))->not->toContain('Personal Health')
        ->and(rawValue('finance_accounts', $account->id, 'name'))->not->toContain('Main Checking')
        ->and(rawValue('finance_accounts', $account->id, 'account_number'))->not->toContain('1234567890')
        ->and(rawValue('finance_accounts', $account->id, 'notes'))->not->toContain('salary')
        ->and(rawValue('finance_transactions', $transaction->id, 'description'))->not->toContain('in-laws')
        ->and(rawValue('finance_transactions', $transaction->id, 'payment_method'))->not->toContain('4242');

    // Read back plaintext through the models.
    expect(Category::find($category->id)->name)->toBe('Personal Health')
        ->and(FinanceAccount::find($account->id)->account_number)->toBe('1234567890')
        ->and(FinanceTransaction::find($transaction->id)->description)->toBe('Dinner with in-laws');

    // amount stays a plaintext decimal (still SQL-summable).
    expect(rawValue('finance_transactions', $transaction->id, 'amount'))->toBe('42.50');
});

it('encrypts array-cast columns (activity log values, tutorial progress) at rest', function () {
    $user = User::factory()->create([
        'tutorial_progress' => ['dashboard' => true, 'secretStep' => 'done'],
    ]);

    $log = ActivityLog::create([
        'user_id' => $user->id,
        'action' => 'updated',
        'model_type' => Task::class,
        'model_id' => 1,
        'old_values' => ['title' => 'Old secret title'],
        'new_values' => ['title' => 'New secret title'],
        'description' => 'Updated a task',
    ]);

    expect(rawValue('users', $user->id, 'tutorial_progress'))->not->toContain('secretStep')
        ->and(rawValue('activity_logs', $log->id, 'old_values'))->not->toContain('Old secret title');

    // Round-trips back to arrays.
    expect(User::find($user->id)->tutorial_progress)->toBe(['dashboard' => true, 'secretStep' => 'done'])
        ->and(ActivityLog::find($log->id)->new_values)->toBe(['title' => 'New secret title']);
});

it('backfills pre-existing plaintext rows and is idempotent', function () {
    $user = User::factory()->create();

    // Simulate legacy plaintext rows by writing raw (bypassing the cast).
    $categoryId = DB::table('categories')->insertGetId([
        'user_id' => $user->id,
        'name' => 'Legacy Plaintext Category',
        'color' => '#000000',
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(rawValue('categories', $categoryId, 'name'))->toBe('Legacy Plaintext Category');

    $this->artisan('encrypt:existing-data', ['--force' => true, '--table' => 'categories'])
        ->assertSuccessful();

    // Now encrypted at rest, and the model reads it back cleanly.
    $encrypted = rawValue('categories', $categoryId, 'name');
    expect($encrypted)->not->toBe('Legacy Plaintext Category')
        ->and(Crypt::decryptString($encrypted))->toBe('Legacy Plaintext Category')
        ->and(Category::find($categoryId)->name)->toBe('Legacy Plaintext Category');

    // Re-running must not double-encrypt (idempotent): value unchanged.
    $this->artisan('encrypt:existing-data', ['--force' => true, '--table' => 'categories'])
        ->assertSuccessful();

    expect(rawValue('categories', $categoryId, 'name'))->toBe($encrypted)
        ->and(Category::find($categoryId)->name)->toBe('Legacy Plaintext Category');
});
