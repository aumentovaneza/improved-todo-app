<?php

namespace App\Modules\Points\Models;

use App\Models\User;
use App\Modules\Points\Enums\PointLedgerType;
use App\Modules\Points\Enums\PointSource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PointLedgerEntry extends Model
{
    protected $table = 'point_ledger_entries';

    protected $fillable = [
        'user_id',
        'type',
        'source',
        'amount',
        'balance_after',
        'sourceable_type',
        'sourceable_id',
        'client_request_id',
        'metadata',
    ];

    protected $casts = [
        'type' => PointLedgerType::class,
        'source' => PointSource::class,
        'amount' => 'integer',
        'balance_after' => 'integer',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceable(): MorphTo
    {
        return $this->morphTo();
    }
}
