<?php

namespace App\Modules\Finance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceSavingsGoal extends Model
{
    use SoftDeletes;

    protected $table = 'finance_savings_goals';

    protected $fillable = [
        'user_id',
        'finance_account_id',
        'converted_finance_budget_id',
        'name',
        'target_amount',
        'current_amount',
        'currency',
        'target_date',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'current_amount' => 'decimal:2',
        'target_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }

    public function convertedBudget(): BelongsTo
    {
        return $this->belongsTo(FinanceBudget::class, 'converted_finance_budget_id');
    }
}
