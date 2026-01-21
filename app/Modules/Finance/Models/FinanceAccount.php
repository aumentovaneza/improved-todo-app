<?php

namespace App\Modules\Finance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceAccount extends Model
{
    use SoftDeletes;

    protected $table = 'finance_accounts';

    protected $fillable = [
        'user_id',
        'name',
        'label',
        'account_number',
        'type',
        'currency',
        'starting_balance',
        'current_balance',
        'credit_limit',
        'available_credit',
        'used_credit',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'starting_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'available_credit' => 'decimal:2',
        'used_credit' => 'decimal:2',
        'account_number' => 'encrypted',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'finance_account_id');
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(FinanceBudget::class, 'finance_account_id');
    }

    public function savingsGoals(): HasMany
    {
        return $this->hasMany(FinanceSavingsGoal::class, 'finance_account_id');
    }
}
