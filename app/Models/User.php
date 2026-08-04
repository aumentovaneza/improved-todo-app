<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Modules\Finance\Models\FinanceAccount;
use App\Modules\Finance\Models\FinanceBudget;
use App\Modules\Finance\Models\FinanceCategory;
use App\Modules\Finance\Models\FinanceSavingsGoal;
use App\Modules\Finance\Models\FinanceTransaction;
use App\Modules\MealPlanning\Models\Household;
use App\Modules\MealPlanning\Models\HouseholdMember;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use CanResetPassword, HasFactory, Notifiable;

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
        'dashboard_widgets',
        'daily_summary_enabled',
        'daily_summary_time',
        'email_notifications_enabled',
        'sms_notifications_enabled',
        'push_notifications_enabled',
        'daily_digest_enabled',
        'weekly_summary_enabled',
        'reminder_notifications_enabled',
        'tutorial_progress',
        'last_active_at',
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
            'tutorial_progress' => 'encrypted:array',
            'dashboard_widgets' => 'array',
            'daily_summary_enabled' => 'boolean',
            'email_notifications_enabled' => 'boolean',
            'sms_notifications_enabled' => 'boolean',
            'push_notifications_enabled' => 'boolean',
            'daily_digest_enabled' => 'boolean',
            'weekly_summary_enabled' => 'boolean',
            'reminder_notifications_enabled' => 'boolean',
            'last_active_at' => 'datetime',
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

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class);
    }

    /**
     * Route notifications for the APNs channel.
     *
     * The apn channel calls this to resolve the device tokens to push to. We
     * return the user's active APNs device-token strings (provider = apns).
     *
     * @return array<int, string>
     */
    public function routeNotificationForApn(): array
    {
        return $this->pushTokens()
            ->where('provider', 'apns')
            ->pluck('token')
            ->all();
    }

    /**
     * Route notifications for the Web Push channel.
     *
     * Returns the user's web-push PushToken models (provider = webpush); the
     * WebPushChannel reads each row's `meta` (endpoint + keys) to build the
     * browser subscription.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\PushToken>
     */
    public function routeNotificationForWebPush()
    {
        return $this->pushTokens()
            ->where('provider', 'webpush')
            ->get();
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function taskLists(): HasMany
    {
        return $this->hasMany(TaskList::class);
    }

    public function financeAccounts(): HasMany
    {
        return $this->hasMany(FinanceAccount::class);
    }

    public function financeTransactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class);
    }

    public function financeCategories(): HasMany
    {
        return $this->hasMany(FinanceCategory::class);
    }

    public function financeBudgets(): HasMany
    {
        return $this->hasMany(FinanceBudget::class);
    }

    public function financeSavingsGoals(): HasMany
    {
        return $this->hasMany(FinanceSavingsGoal::class);
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

    public function ownedHouseholds(): HasMany
    {
        return $this->hasMany(Household::class, 'owner_user_id');
    }

    public function householdMemberships(): HasMany
    {
        return $this->hasMany(HouseholdMember::class);
    }

    public function walletCollaborators(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'finance_wallet_collaborators',
            'owner_user_id',
            'collaborator_user_id'
        )
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function collaboratingWallets(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'finance_wallet_collaborators',
            'collaborator_user_id',
            'owner_user_id'
        )
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

    /**
     * The canonical "premium" predicate — the single source of truth for paid
     * entitlement (used by AiEntitlementService and FinanceAccessService). Today
     * premium maps to admins; future subscription/plan logic lands here.
     */
    public function isPremium(): bool
    {
        return $this->isAdmin();
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
