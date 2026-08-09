<?php

namespace App\Modules\Points\Models;

use App\Modules\Points\Enums\StoreItemSlot;
use App\Modules\Points\Enums\StoreItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreItem extends Model
{
    protected $table = 'store_items';

    protected $fillable = [
        'key',
        'name',
        'description',
        'type',
        'slot',
        'cost',
        'asset',
        'preview_asset',
        'metadata',
        'sort_order',
        'is_active',
        'is_default',
        'is_premium',
        'available_from',
        'available_until',
    ];

    protected $casts = [
        'type' => StoreItemType::class,
        'slot' => StoreItemSlot::class,
        'cost' => 'integer',
        'metadata' => 'array',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'is_premium' => 'boolean',
        'available_from' => 'datetime',
        'available_until' => 'datetime',
    ];

    public function userStoreItems(): HasMany
    {
        return $this->hasMany(UserStoreItem::class);
    }
}
