<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'reminder_time',
        'type',
        'is_sent',
        'sent_at',
    ];

    protected $casts = [
        'reminder_time' => 'datetime',
        'is_sent' => 'boolean',
        'sent_at' => 'datetime',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
