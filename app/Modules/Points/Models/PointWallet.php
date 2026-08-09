<?php

namespace App\Modules\Points\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointWallet extends Model
{
    protected $table = 'point_wallets';

    protected $fillable = [
        'user_id',
        'balance',
        'lifetime_earned',
        'lifetime_spent',
        'current_streak_days',
        'longest_streak_days',
        'last_earned_on',
        'last_streak_awarded_on',
    ];

    protected $casts = [
        'balance' => 'integer',
        'lifetime_earned' => 'integer',
        'lifetime_spent' => 'integer',
        'current_streak_days' => 'integer',
        'longest_streak_days' => 'integer',
        'last_earned_on' => 'date',
        'last_streak_awarded_on' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
