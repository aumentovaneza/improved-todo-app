<?php

namespace App\Modules\Finance\Services;

use App\Modules\Finance\Repositories\FinanceAccountRepository;
use App\Modules\Finance\Repositories\FinanceBudgetRepository;
use App\Modules\Finance\Repositories\FinanceLoanRepository;
use App\Modules\Finance\Repositories\FinanceSavingsGoalRepository;
use App\Modules\Finance\Repositories\FinanceTransactionRepository;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinanceExportService
{
    public function __construct(
        private FinanceAccountRepository $accountRepository,
        private FinanceTransactionRepository $transactionRepository,
        private FinanceBudgetRepository $budgetRepository,
        private FinanceSavingsGoalRepository $savingsGoalRepository,
        private FinanceLoanRepository $loanRepository,
    ) {}

    /**
     * Build a multi-tab workbook for a wallet. The date range only bounds the
     * Transactions sheet (by occurred_at); the other sheets are current-state
     * snapshots. Account numbers are masked unless the requester owns the wallet.
     */
    public function build(int $walletUserId, ?Carbon $startDate, ?Carbon $endDate, bool $maskAccountNumbers): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->removeSheetByIndex(0);

        $this->buildAccountsSheet($spreadsheet, $walletUserId, $maskAccountNumbers);
        $this->buildTransactionsSheet($spreadsheet, $walletUserId, $startDate, $endDate);
        $this->buildBudgetsSheet($spreadsheet, $walletUserId);
        $this->buildSavingsGoalsSheet($spreadsheet, $walletUserId);
        $this->buildLoansSheet($spreadsheet, $walletUserId);

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    private function buildAccountsSheet(Spreadsheet $spreadsheet, int $walletUserId, bool $maskAccountNumbers): void
    {
        $sheet = $this->addSheet($spreadsheet, 'Accounts');
        $headers = [
            'Name', 'Label', 'Type', 'Currency', 'Account Number', 'Starting Balance',
            'Current Balance', 'Credit Limit', 'Available Credit', 'Used Credit',
            'Active', 'Default', 'Notes',
        ];
        $this->writeHeader($sheet, $headers);

        $row = 2;
        foreach ($this->accountRepository->getForUser($walletUserId) as $account) {
            $sheet->fromArray([
                $account->name,
                $account->label,
                $account->type,
                $account->currency,
                $this->formatAccountNumber($account->account_number, $maskAccountNumbers),
                $this->number($account->starting_balance),
                $this->number($account->current_balance),
                $this->number($account->credit_limit),
                $this->number($account->available_credit),
                $this->number($account->used_credit),
                $this->bool($account->is_active),
                $this->bool($account->is_default),
                $account->notes,
            ], null, "A{$row}");
            $row++;
        }

        $this->autoSize($sheet, $headers);
    }

    private function buildTransactionsSheet(Spreadsheet $spreadsheet, int $walletUserId, ?Carbon $startDate, ?Carbon $endDate): void
    {
        $sheet = $this->addSheet($spreadsheet, 'Transactions');
        $headers = [
            'Date', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Transfer Account',
            'Description', 'Notes', 'Payment Method', 'Recurring', 'Frequency', 'Tags',
        ];
        $this->writeHeader($sheet, $headers);

        $row = 2;
        foreach ($this->transactionRepository->getForUserInRange($walletUserId, $startDate, $endDate) as $transaction) {
            $sheet->fromArray([
                $transaction->occurred_at?->format('Y-m-d H:i'),
                $transaction->type,
                $this->number($transaction->amount),
                $transaction->currency,
                $transaction->category?->name,
                $transaction->account?->name,
                $transaction->transferAccount?->name,
                $transaction->description,
                $transaction->notes,
                $transaction->payment_method,
                $this->bool($transaction->is_recurring),
                $transaction->recurring_frequency,
                $transaction->tags->pluck('name')->implode(', '),
            ], null, "A{$row}");
            $row++;
        }

        $this->autoSize($sheet, $headers);
    }

    private function buildBudgetsSheet(Spreadsheet $spreadsheet, int $walletUserId): void
    {
        $sheet = $this->addSheet($spreadsheet, 'Budgets');
        $headers = [
            'Name', 'Budget Type', 'Category', 'Account', 'Amount', 'Current Spent',
            'Currency', 'Period', 'Recurring', 'Starts On', 'Ends On', 'Active',
        ];
        $this->writeHeader($sheet, $headers);

        $row = 2;
        foreach ($this->budgetRepository->getForUser($walletUserId) as $budget) {
            $sheet->fromArray([
                $budget->name,
                $budget->budget_type,
                $budget->category?->name,
                $budget->account?->name,
                $this->number($budget->amount),
                $this->number($budget->current_spent),
                $budget->currency,
                $budget->period,
                $this->bool($budget->is_recurring),
                $budget->starts_on?->format('Y-m-d'),
                $budget->ends_on?->format('Y-m-d'),
                $this->bool($budget->is_active),
            ], null, "A{$row}");
            $row++;
        }

        $this->autoSize($sheet, $headers);
    }

    private function buildSavingsGoalsSheet(Spreadsheet $spreadsheet, int $walletUserId): void
    {
        $sheet = $this->addSheet($spreadsheet, 'Savings Goals');
        $headers = [
            'Name', 'Account', 'Target Amount', 'Current Amount', 'Currency',
            'Target Date', 'Active', 'Notes',
        ];
        $this->writeHeader($sheet, $headers);

        $row = 2;
        foreach ($this->savingsGoalRepository->getForUser($walletUserId) as $goal) {
            $sheet->fromArray([
                $goal->name,
                $goal->account?->name,
                $this->number($goal->target_amount),
                $this->number($goal->current_amount),
                $goal->currency,
                $goal->target_date?->format('Y-m-d'),
                $this->bool($goal->is_active),
                $goal->notes,
            ], null, "A{$row}");
            $row++;
        }

        $this->autoSize($sheet, $headers);
    }

    private function buildLoansSheet(Spreadsheet $spreadsheet, int $walletUserId): void
    {
        $sheet = $this->addSheet($spreadsheet, 'Loans');
        $headers = [
            'Name', 'Total Amount', 'Remaining Amount', 'Currency', 'Target Date', 'Active', 'Notes',
        ];
        $this->writeHeader($sheet, $headers);

        $row = 2;
        foreach ($this->loanRepository->getForUser($walletUserId) as $loan) {
            $sheet->fromArray([
                $loan->name,
                $this->number($loan->total_amount),
                $this->number($loan->remaining_amount),
                $loan->currency,
                $loan->target_date?->format('Y-m-d'),
                $this->bool($loan->is_active),
                $loan->notes,
            ], null, "A{$row}");
            $row++;
        }

        $this->autoSize($sheet, $headers);
    }

    private function addSheet(Spreadsheet $spreadsheet, string $title): Worksheet
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($title);

        return $sheet;
    }

    /**
     * @param  array<int, string>  $headers
     */
    private function writeHeader(Worksheet $sheet, array $headers): void
    {
        $sheet->fromArray($headers, null, 'A1');
        $lastColumn = Coordinate::stringFromColumnIndex(count($headers));
        $sheet->getStyle("A1:{$lastColumn}1")->getFont()->setBold(true);
        $sheet->getStyle("A1:{$lastColumn}1")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->freezePane('A2');
    }

    /**
     * @param  array<int, string>  $headers
     */
    private function autoSize(Worksheet $sheet, array $headers): void
    {
        $lastColumn = Coordinate::stringFromColumnIndex(count($headers));
        foreach (range('A', $lastColumn) as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
    }

    private function formatAccountNumber(?string $accountNumber, bool $mask): ?string
    {
        if ($accountNumber === null || $accountNumber === '') {
            return null;
        }

        if (! $mask) {
            return $accountNumber;
        }

        $last4 = substr($accountNumber, -4);

        return '•••• '.$last4;
    }

    private function number(mixed $value): ?float
    {
        return $value === null ? null : (float) $value;
    }

    private function bool(?bool $value): string
    {
        return $value ? 'Yes' : 'No';
    }
}
