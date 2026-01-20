<?php

namespace App\Modules\Finance\Models;

use App\Models\User;
use App\Modules\Finance\Models\FinanceTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceLoan extends Model
{
    use SoftDeletes;

    protected $table = 'finance_loans';

    protected $fillable = [
        'user_id',
        'name',
        'total_amount',
        'remaining_amount',
        'currency',
        'target_date',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'target_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'finance_loan_id');
    }
}
