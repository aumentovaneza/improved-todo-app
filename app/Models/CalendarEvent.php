<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalendarEvent extends Model
{
    use HasFactory;

    public const KINDS = ['event', 'class', 'appointment', 'holiday', 'routine'];

    protected $fillable = [
        'user_id',
        'event_calendar_id',
        'title',
        'notes',
        'location',
        'kind',
        'is_all_day',
        'start_date',
        'end_date',
        'starts_at',
        'ends_at',
        'timezone',
        'color',
        'recurrence_rule',
    ];

    protected $casts = [
        'title' => 'encrypted',
        'notes' => 'encrypted',
        'location' => 'encrypted',
        'is_all_day' => 'boolean',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<EventCalendar, $this> */
    public function calendar(): BelongsTo
    {
        return $this->belongsTo(EventCalendar::class, 'event_calendar_id');
    }

    /** @return HasMany<CalendarEventException, $this> */
    public function exceptions(): HasMany
    {
        return $this->hasMany(CalendarEventException::class);
    }

    /** @return HasMany<CalendarEventReminder, $this> */
    public function reminders(): HasMany
    {
        return $this->hasMany(CalendarEventReminder::class);
    }
}
