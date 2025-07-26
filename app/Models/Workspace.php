<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'organizer_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function boards(): HasMany
    {
        return $this->hasMany(Board::class);
    }

    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_collaborators')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function allMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_collaborators')
            ->withPivot('role', 'joined_at')
            ->withTimestamps()
            ->union($this->organizer()->select('users.*'));
    }

    public function isOrganizer(User $user): bool
    {
        return $this->organizer_id === $user->id;
    }

    public function isCollaborator(User $user): bool
    {
        return $this->collaborators()->where('user_id', $user->id)->exists();
    }

    public function isMember(User $user): bool
    {
        return $this->isOrganizer($user) || $this->isCollaborator($user);
    }
}
