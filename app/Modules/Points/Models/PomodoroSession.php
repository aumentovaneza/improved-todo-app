<?php

namespace App\Modules\Points\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PomodoroSession extends Model
{
    protected $table = 'pomodoro_sessions';

    protected $fillable = [
        'user_id',
        'client_request_id',
        'type',
        'duration_seconds',
        'started_at',
        'completed_at',
        'awarded_points',
        'point_ledger_entry_id',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'awarded_points' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ledgerEntry(): BelongsTo
    {
        return $this->belongsTo(PointLedgerEntry::class, 'point_ledger_entry_id');
    }
}
