<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEventException extends Model
{
    use HasFactory;

    protected $fillable = [
        'calendar_event_id',
        'occurrence_key',
        'is_cancelled',
        'start_date',
        'end_date',
        'starts_at',
        'ends_at',
        'overrides',
    ];

    protected $casts = [
        'is_cancelled' => 'boolean',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'overrides' => 'encrypted:array',
    ];

    /** @return BelongsTo<CalendarEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(CalendarEvent::class, 'calendar_event_id');
    }
}
