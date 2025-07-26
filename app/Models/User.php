<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, CanResetPassword;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'timezone',
        'news_category',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function organizedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'organizer_id');
    }

    public function collaboratingWorkspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_collaborators')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function collaboratingBoards(): BelongsToMany
    {
        return $this->belongsToMany(Board::class, 'board_collaborators')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    public function getTimezone(): string
    {
        return $this->timezone ?? 'UTC';
    }

    public function toUserTimezone($date)
    {
        return $date ? $date->setTimezone($this->getTimezone()) : null;
    }

    public function todayInUserTimezone()
    {
        return now()->setTimezone($this->getTimezone())->startOfDay();
    }

    public function nowInUserTimezone()
    {
        return now()->setTimezone($this->getTimezone());
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }
}
