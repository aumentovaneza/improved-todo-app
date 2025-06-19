<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

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
        'recurring_until',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'is_all_day' => 'boolean',
        'completed_at' => 'datetime',
        'is_recurring' => 'boolean',
        'recurrence_config' => 'array',
        'recurring_until' => 'datetime',
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

    /**
     * Get all occurrences of this task within a date range
     * For non-recurring tasks, returns the task itself if it falls within the range
     * For recurring tasks, generates occurrences based on the recurrence pattern
     */
    public function getOccurrencesInRange($startDate, $endDate)
    {
        $occurrences = collect();

        if (!$this->is_recurring) {
            // Non-recurring task - check if due_date falls within range
            if (
                $this->due_date &&
                $this->due_date->between($startDate, $endDate)
            ) {
                $occurrences->push($this);
            }
        } else {
            // Recurring task - generate occurrences
            if (!$this->recurring_until || !$this->recurrence_type) {
                return $occurrences;
            }

            // Start from the task creation date or start date, whichever is later
            $currentDate = max($this->created_at->startOfDay(), $startDate->copy()->startOfDay());
            $endDateLimit = min($endDate->copy()->endOfDay(), $this->recurring_until->copy()->endOfDay());

            while ($currentDate <= $endDateLimit) {
                // Create a virtual occurrence for this date
                $occurrence = clone $this;
                $occurrence->due_date = $currentDate->copy();
                $occurrence->is_recurring_instance = true;
                $occurrence->original_task_id = $this->id;

                $occurrences->push($occurrence);

                // Move to next occurrence
                $currentDate = $this->getNextOccurrenceDate($currentDate);

                if (!$currentDate || $currentDate > $endDateLimit) {
                    break;
                }
            }
        }

        return $occurrences;
    }

    /**
     * Get the next occurrence date based on recurrence type
     */
    private function getNextOccurrenceDate($currentDate)
    {
        switch ($this->recurrence_type) {
            case 'daily':
                return $currentDate->copy()->addDay();
            case 'weekly':
                return $currentDate->copy()->addWeek();
            case 'monthly':
                return $currentDate->copy()->addMonth();
            case 'yearly':
                return $currentDate->copy()->addYear();
            default:
                return null;
        }
    }

    /**
     * Check if this task should be displayed on a specific date
     */
    public function isVisibleOnDate($date)
    {
        if (!$this->is_recurring) {
            return $this->due_date && $this->due_date->format('Y-m-d') === $date->format('Y-m-d');
        }

        if (!$this->recurring_until || !$this->recurrence_type) {
            return false;
        }

        if ($date > $this->recurring_until) {
            return false;
        }

        // Check if the date matches the recurrence pattern
        $baseDate = $this->created_at;
        $daysDiff = $baseDate->diffInDays($date);

        switch ($this->recurrence_type) {
            case 'daily':
                return true;
            case 'weekly':
                return $daysDiff % 7 === 0;
            case 'monthly':
                return $baseDate->day === $date->day;
            case 'yearly':
                return $baseDate->month === $date->month && $baseDate->day === $date->day;
            default:
                return false;
        }
    }
}
