<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskList extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_sample',
        'name',
        'color',
        'description',
        'position',
    ];

    protected $casts = [
        'name' => 'encrypted',
        'description' => 'encrypted',
        'is_sample' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ListItem::class)->orderBy('position');
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'list_task', 'task_list_id', 'task_id')
            ->withTimestamps();
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
