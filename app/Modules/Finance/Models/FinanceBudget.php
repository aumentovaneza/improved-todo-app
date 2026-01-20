<?php

namespace App\Modules\Finance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceBudget extends Model
{
    use SoftDeletes;

    protected $table = 'finance_budgets';

    protected $fillable = [
        'user_id',
        'finance_category_id',
        'name',
        'amount',
        'current_spent',
        'currency',
        'period',
        'is_recurring',
        'starts_on',
        'ends_on',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'current_spent' => 'decimal:2',
        'starts_on' => 'date',
        'ends_on' => 'date',
        'is_active' => 'boolean',
        'is_recurring' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'finance_category_id');
    }
}
