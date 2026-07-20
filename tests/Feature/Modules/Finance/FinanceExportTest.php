<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Capture the streamed export body and load it back as a spreadsheet so we can
 * make assertions about the actual worksheet contents.
 */
function loadExportedWorkbook(string $content): array
{
    $path = tempnam(sys_get_temp_dir(), 'export').'.xlsx';
    file_put_contents($path, $content);

    $spreadsheet = IOFactory::load($path);
    $sheets = [];
    foreach ($spreadsheet->getAllSheets() as $sheet) {
        $sheets[$sheet->getTitle()] = $sheet->toArray();
    }

    unlink($path);

    return $sheets;
}

function makeAccount(User $user, array $overrides = []): FinanceAccount
{
    return FinanceAccount::create(array_merge([
        'user_id' => $user->id,
        'name' => 'Regular Bank',
        'type' => 'bank',
        'currency' => 'PHP',
        'account_number' => '1234567890',
        'starting_balance' => 100,
        'current_balance' => 100,
        'is_active' => true,
        'is_default' => false,
    ], $overrides));
}

it('exports wallet data as an xlsx with the expected sheets', function () {
    $user = User::factory()->create();
    $account = makeAccount($user);

    FinanceTransaction::create([
        'user_id' => $user->id,
        'finance_account_id' => $account->id,
        'type' => 'expense',
        'amount' => 42.50,
        'currency' => 'PHP',
        'description' => 'Coffee run',
        'occurred_at' => '2026-07-10 09:00:00',
    ]);

    $response = $this->actingAs($user)->get(route('weviewallet.export.excel'));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $content = $response->streamedContent();
    expect(substr($content, 0, 2))->toBe('PK'); // xlsx is a zip archive

    $sheets = loadExportedWorkbook($content);
    expect(array_keys($sheets))->toBe(['Accounts', 'Transactions', 'Budgets', 'Savings Goals', 'Loans']);

    $flat = collect($sheets['Transactions'])->flatten()->filter()->implode('|');
    expect($flat)->toContain('Coffee run');
});

it('respects the date range for the transactions sheet', function () {
    $user = User::factory()->create();
    $account = makeAccount($user);

    FinanceTransaction::create([
        'user_id' => $user->id,
        'finance_account_id' => $account->id,
        'type' => 'expense',
        'amount' => 10,
        'currency' => 'PHP',
        'description' => 'InsideRange',
        'occurred_at' => '2026-07-15 09:00:00',
    ]);
    FinanceTransaction::create([
        'user_id' => $user->id,
        'finance_account_id' => $account->id,
        'type' => 'expense',
        'amount' => 20,
        'currency' => 'PHP',
        'description' => 'OutsideRange',
        'occurred_at' => '2026-06-01 09:00:00',
    ]);

    $response = $this->actingAs($user)->get(route('weviewallet.export.excel', [
        'start_date' => '2026-07-01',
        'end_date' => '2026-07-31',
    ]));

    $response->assertOk();

    $sheets = loadExportedWorkbook($response->streamedContent());
    $flat = collect($sheets['Transactions'])->flatten()->filter()->implode('|');

    expect($flat)->toContain('InsideRange');
    expect($flat)->not->toContain('OutsideRange');
});

it('only includes the requesting user\'s data', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    makeAccount($other, ['name' => 'Someone Elses Bank']);

    $response = $this->actingAs($user)->get(route('weviewallet.export.excel'));
    $response->assertOk();

    $sheets = loadExportedWorkbook($response->streamedContent());
    $flat = collect($sheets['Accounts'])->flatten()->filter()->implode('|');

    expect($flat)->not->toContain('Someone Elses Bank');
});

it('shows the full account number when you export your own wallet', function () {
    $user = User::factory()->create();
    makeAccount($user, ['account_number' => '9998887777']);

    $response = $this->actingAs($user)->get(route('weviewallet.export.excel'));
    $sheets = loadExportedWorkbook($response->streamedContent());

    $flat = collect($sheets['Accounts'])->flatten()->filter()->implode('|');
    expect($flat)->toContain('9998887777');
});

it('masks the account number when a collaborator exports a shared wallet', function () {
    $owner = User::factory()->create();
    $collaborator = User::factory()->create();
    makeAccount($owner, ['account_number' => '9998887777']);

    DB::table('finance_wallet_collaborators')->insert([
        'owner_user_id' => $owner->id,
        'collaborator_user_id' => $collaborator->id,
        'role' => 'collaborator',
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->actingAs($collaborator)->get(route('weviewallet.export.excel', [
        'wallet_user_id' => $owner->id,
    ]));
    $response->assertOk();

    $sheets = loadExportedWorkbook($response->streamedContent());
    $flat = collect($sheets['Accounts'])->flatten()->filter()->implode('|');

    expect($flat)->not->toContain('9998887777');
    expect($flat)->toContain('•••• 7777');
});

it('falls back to your own wallet when given an inaccessible wallet_user_id', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();
    makeAccount($user, ['name' => 'My Own Bank']);
    makeAccount($stranger, ['name' => 'Strangers Bank']);

    $response = $this->actingAs($user)->get(route('weviewallet.export.excel', [
        'wallet_user_id' => $stranger->id,
    ]));
    $response->assertOk();

    $sheets = loadExportedWorkbook($response->streamedContent());
    $flat = collect($sheets['Accounts'])->flatten()->filter()->implode('|');

    expect($flat)->toContain('My Own Bank');
    expect($flat)->not->toContain('Strangers Bank');
});

it('requires authentication', function () {
    $this->get(route('weviewallet.export.excel'))->assertRedirect(route('login'));
});
