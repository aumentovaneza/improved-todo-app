<?php

namespace App\Modules\Finance\Models;

use App\Models\Tag;
use App\Models\User;
use App\Modules\Finance\Models\FinanceLoan;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class FinanceTransaction extends Model
{
    protected $table = 'finance_transactions';

    protected $fillable = [
        'user_id',
        'created_by_user_id',
        'finance_category_id',
        'finance_loan_id',
        'finance_savings_goal_id',
        'finance_budget_id',
        'finance_account_id',
        'finance_transfer_account_id',
        'finance_credit_card_account_id',
        'type',
        'amount',
        'currency',
        'description',
        'notes',
        'payment_method',
        'is_recurring',
        'recurring_frequency',
        'metadata',
        'occurred_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'finance_category_id');
    }

    public function savingsGoal(): BelongsTo
    {
        return $this->belongsTo(FinanceSavingsGoal::class, 'finance_savings_goal_id');
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(FinanceBudget::class, 'finance_budget_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }

    public function transferAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_transfer_account_id');
    }

    public function creditCardAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_credit_card_account_id');
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(FinanceLoan::class, 'finance_loan_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'finance_transaction_tag')
            ->withTimestamps();
    }

    /**
     * Get all occurrences of this transaction within a date range.
     */
    public function getOccurrencesInRange(Carbon $startDate, Carbon $endDate)
    {
        $occurrences = collect();

        if (!$this->occurred_at) {
            return $occurrences;
        }

        if (!$this->is_recurring) {
            if ($this->occurred_at->between($startDate, $endDate)) {
                $occurrences->push($this);
            }

            return $occurrences;
        }

        if (!$this->recurring_frequency) {
            return $occurrences;
        }

        $currentDate = $this->getFirstOccurrenceOnOrAfter($startDate);
        $endDateLimit = $endDate->copy()->endOfDay();

        while ($currentDate && $currentDate->lte($endDateLimit)) {
            $occurrence = clone $this;
            $occurrence->occurred_at = $currentDate->copy();
            $occurrence->is_recurring_instance = true;
            $occurrence->original_transaction_id = $this->id;

            $occurrences->push($occurrence);

            $currentDate = $this->getNextOccurrenceDate($currentDate);
        }

        return $occurrences;
    }

    private function getFirstOccurrenceOnOrAfter(Carbon $startDate): ?Carbon
    {
        $baseDate = $this->occurred_at->copy();

        if ($baseDate->gte($startDate)) {
            return $baseDate;
        }

        $baseStart = $baseDate->copy()->startOfDay();
        $start = $startDate->copy()->startOfDay();
        $daysDiff = $baseStart->diffInDays($start);
        $candidate = null;

        switch ($this->recurring_frequency) {
            case 'daily':
                $candidate = $baseDate->copy()->addDays($daysDiff);
                break;
            case 'weekly':
                $weeks = intdiv($daysDiff, 7);
                $candidate = $baseDate->copy()->addWeeks($weeks);
                break;
            case 'bi-weekly':
                $steps = intdiv($daysDiff, 14);
                $candidate = $baseDate->copy()->addDays($steps * 14);
                break;
            case 'monthly':
                $months = $baseStart->diffInMonths($start);
                $candidate = $baseDate->copy()->addMonthsNoOverflow($months);
                break;
            case 'yearly':
                $years = $baseStart->diffInYears($start);
                $candidate = $baseDate->copy()->addYearsNoOverflow($years);
                break;
            default:
                return null;
        }

        if ($candidate && $candidate->lt($startDate)) {
            return $this->getNextOccurrenceDate($candidate);
        }

        return $candidate;
    }

    private function getNextOccurrenceDate(Carbon $currentDate): ?Carbon
    {
        switch ($this->recurring_frequency) {
            case 'daily':
                return $currentDate->copy()->addDay();
            case 'weekly':
                return $currentDate->copy()->addWeek();
            case 'bi-weekly':
                return $currentDate->copy()->addWeeks(2);
            case 'monthly':
                return $currentDate->copy()->addMonthsNoOverflow();
            case 'yearly':
                return $currentDate->copy()->addYearsNoOverflow();
            default:
                return null;
        }
    }
}
