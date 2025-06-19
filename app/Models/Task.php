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
        'start_time',
        'end_time',
        'is_all_day',
        'completed_at',
        'position',
        'is_recurring',
        'recurrence_type',
        'recurrence_config',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'is_all_day' => 'boolean',
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

    public function getFullStartDateTimeAttribute()
    {
        if (!$this->due_date) {
            return null;
        }

        if ($this->is_all_day || !$this->start_time) {
            return $this->due_date->startOfDay();
        }

        // Combine due_date and start_time
        return $this->due_date->setTimeFromTimeString($this->start_time);
    }

    public function getFullEndDateTimeAttribute()
    {
        if (!$this->due_date) {
            return null;
        }

        if ($this->is_all_day || !$this->end_time) {
            return $this->due_date->endOfDay();
        }

        // Combine due_date and end_time
        return $this->due_date->setTimeFromTimeString($this->end_time);
    }

    public function getFormattedTimeRangeAttribute()
    {
        if ($this->is_all_day || (!$this->start_time && !$this->end_time)) {
            return 'All day';
        }

        $formatTime = function ($timeStr) {
            if (!$timeStr) return '';
            $time = \Carbon\Carbon::createFromFormat('H:i:s', $timeStr) ?: \Carbon\Carbon::createFromFormat('H:i', $timeStr);
            return $time ? $time->format('g:i A') : '';
        };

        $startTime = $this->start_time ? $formatTime($this->start_time) : '';
        $endTime = $this->end_time ? $formatTime($this->end_time) : '';

        if ($startTime && $endTime) {
            return $startTime . ' - ' . $endTime;
        } elseif ($startTime) {
            return 'From ' . $startTime;
        } elseif ($endTime) {
            return 'Until ' . $endTime;
        }

        return 'All day';
    }

    public function scopeOrderByDateTime($query)
    {
        return $query->orderByRaw('
            CASE 
                WHEN is_all_day = 1 OR (start_time IS NULL AND end_time IS NULL) THEN CONCAT(DATE(due_date), " 00:00:00")
                WHEN start_time IS NOT NULL THEN CONCAT(DATE(due_date), " ", TIME(start_time))
                WHEN end_time IS NOT NULL THEN CONCAT(DATE(due_date), " ", TIME(end_time))
                ELSE CONCAT(DATE(due_date), " 00:00:00")
            END ASC
        ');
    }
}
