<?php

namespace App\Modules\Points\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStoreItem extends Model
{
    protected $table = 'user_store_items';

    protected $fillable = [
        'user_id',
        'store_item_id',
        'acquired_via',
        'point_ledger_entry_id',
        'acquired_at',
    ];

    protected $casts = [
        'acquired_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function storeItem(): BelongsTo
    {
        return $this->belongsTo(StoreItem::class);
    }

    public function ledgerEntry(): BelongsTo
    {
        return $this->belongsTo(PointLedgerEntry::class, 'point_ledger_entry_id');
    }
}
