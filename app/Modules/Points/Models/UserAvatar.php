<?php

namespace App\Modules\Points\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAvatar extends Model
{
    protected $table = 'user_avatars';

    protected $fillable = [
        'user_id',
        'base_item_id',
        'equipped',
    ];

    protected $casts = [
        'equipped' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function baseItem(): BelongsTo
    {
        return $this->belongsTo(StoreItem::class, 'base_item_id');
    }
}
