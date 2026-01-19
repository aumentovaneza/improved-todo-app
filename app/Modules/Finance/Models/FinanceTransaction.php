<?php

namespace App\Modules\Finance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceTransaction extends Model
{
    protected $table = 'finance_transactions';

    protected $fillable = [
        'user_id',
        'finance_category_id',
        'finance_savings_goal_id',
        'finance_budget_id',
        'type',
        'amount',
        'currency',
        'description',
        'notes',
        'payment_method',
        'is_recurring',
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
}
