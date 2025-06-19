<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'priority',
        'status',
        'due_date',
        'completed_at',
        'position',
        'is_recurring',
        'recurrence_type',
        'recurrence_config',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'is_recurring' => 'boolean',
        'recurrence_config' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class)->orderBy('position');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeOverdue($query, $user = null)
    {
        if ($user) {
            $userToday = $user->todayInUserTimezone();
            return $query->where('due_date', '<', $userToday)->where('status', '!=', 'completed');
        }

        return $query->whereDate('due_date', '<', today())->where('status', '!=', 'completed');
    }

    public function scopeOverdueForUser($query, $user)
    {
        $userToday = $user->todayInUserTimezone();
        return $query->where('user_id', $user->id)
            ->where('due_date', '<', $userToday)
            ->where('status', '!=', 'completed');
    }

    public function scopeDueTodayForUser($query, $user)
    {
        $userToday = $user->todayInUserTimezone();
        $userTomorrow = $userToday->copy()->addDay();
        return $query->where('user_id', $user->id)
            ->where('due_date', '>=', $userToday)
            ->where('due_date', '<', $userTomorrow)
            ->where('status', '!=', 'completed');
    }
}
