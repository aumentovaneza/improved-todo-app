<?php

use App\Models\User;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\Finance\Services\FinanceReportService;
use Carbon\Carbon;

afterEach(function () {
    Carbon::setTestNow();
});

it('counts purchases but excludes credit card payments from spending reports', function () {
    Carbon::setTestNow(Carbon::parse('2026-08-05 12:00:00'));

    $user = User::factory()->create();
    $bank = FinanceAccount::create([
        'user_id' => $user->id,
        'name' => 'Bank',
        'type' => 'bank',
        'currency' => 'PHP',
        'starting_balance' => 0,
        'current_balance' => 0,
        'is_active' => true,
    ]);
    $card = FinanceAccount::create([
        'user_id' => $user->id,
        'name' => 'Card',
        'type' => 'credit-card',
        'currency' => 'PHP',
        'credit_limit' => 5000,
        'used_credit' => 800,
        'available_credit' => 4200,
        'is_active' => true,
    ]);

    $base = [
        'user_id' => $user->id,
        'currency' => 'PHP',
        'occurred_at' => now(),
    ];

    foreach ([
        ['type' => 'income', 'amount' => 5000, 'description' => 'Salary', 'finance_account_id' => $bank->id],
        ['type' => 'loan', 'amount' => 1000, 'description' => 'Borrowed cash', 'finance_account_id' => $bank->id],
        ['type' => 'expense', 'amount' => 1200, 'description' => 'Groceries', 'finance_account_id' => $bank->id],
        ['type' => 'expense', 'amount' => 800, 'description' => 'Card purchase', 'finance_account_id' => $card->id],
        [
            'type' => 'expense',
            'amount' => 500,
            'description' => 'Card payment',
            'finance_account_id' => $bank->id,
            'finance_credit_card_account_id' => $card->id,
        ],
        ['type' => 'savings', 'amount' => 1000, 'description' => 'Emergency savings', 'finance_account_id' => $bank->id],
        [
            'type' => 'transfer',
            'amount' => 200,
            'description' => 'External transfer',
            'finance_account_id' => $bank->id,
            'metadata' => ['transfer_destination' => 'external'],
        ],
    ] as $transaction) {
        FinanceTransaction::create(array_merge($base, $transaction));
    }

    $report = app(FinanceReportService::class)->buildDashboardData($user->id, 'this_month');

    expect($report['summary'])
        ->income->toBe(5000.0)
        ->borrowed->toBe(1000.0)
        ->expenses->toBe(2200.0)
        ->savings->toBe(1000.0)
        ->net->toBe(3800.0)
        ->unallocated->toBe(2800.0);

    $monthly = collect($report['charts']['income_vs_expense'])->firstWhere('period', '2026-08');
    $daily = collect($report['charts']['trend'])->firstWhere('period', '2026-08-05');

    expect((float) $monthly['expense'])->toBe(2200.0)
        ->and((float) $daily['expense'])->toBe(2200.0)
        ->and(collect($report['charts']['category_breakdown'])->where('type', 'expense')->sum('total'))
        ->toBe(2000.0);
});
