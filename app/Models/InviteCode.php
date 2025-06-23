<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InviteCode extends Model
{
    protected $fillable = [
        'code',
        'max_uses',
        'used_count',
        'created_by',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created this invite code.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if the invite code is valid for use.
     */
    public function isValid(): bool
    {
        return $this->is_active
            && $this->used_count < $this->max_uses
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /**
     * Check if the invite code has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Check if the invite code has reached its usage limit.
     */
    public function isExhausted(): bool
    {
        return $this->used_count >= $this->max_uses;
    }

    /**
     * Get remaining uses for this invite code.
     */
    public function getRemainingUsesAttribute(): int
    {
        return max(0, $this->max_uses - $this->used_count);
    }

    /**
     * Increment the used count when code is used.
     */
    public function markAsUsed(): void
    {
        $this->increment('used_count');

        // Deactivate if exhausted
        if ($this->isExhausted()) {
            $this->update(['is_active' => false]);
        }
    }

    /**
     * Generate a unique invite code.
     */
    public static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Scope to get only active invite codes.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only valid invite codes.
     */
    public function scopeValid($query)
    {
        return $query->where('is_active', true)
            ->whereColumn('used_count', '<', 'max_uses')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}
