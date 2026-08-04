<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEventReminderDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'calendar_event_reminder_id',
        'occurrence_key',
        'scheduled_for',
        'sent_at',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'sent_at' => 'datetime',
    ];

    /** @return BelongsTo<CalendarEventReminder, $this> */
    public function reminder(): BelongsTo
    {
        return $this->belongsTo(CalendarEventReminder::class, 'calendar_event_reminder_id');
    }
}
