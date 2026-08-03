<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_list_id',
        'content',
        'is_completed',
        'completed_at',
        'position',
    ];

    protected $casts = [
        'content' => 'encrypted',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function taskList(): BelongsTo
    {
        return $this->belongsTo(TaskList::class);
    }
}
