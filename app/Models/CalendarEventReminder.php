<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalendarEventReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'calendar_event_id',
        'offset_minutes',
        'next_remind_at',
        'next_occurrence_key',
    ];

    protected $casts = [
        'offset_minutes' => 'integer',
        'next_remind_at' => 'datetime',
    ];

    /** @return BelongsTo<CalendarEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(CalendarEvent::class, 'calendar_event_id');
    }

    /** @return HasMany<CalendarEventReminderDelivery, $this> */
    public function deliveries(): HasMany
    {
        return $this->hasMany(CalendarEventReminderDelivery::class);
    }
}
