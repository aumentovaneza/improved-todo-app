# Backend conventions & file map

Concrete layout of the Laravel backend so you extend existing patterns instead of inventing new ones.

## Layer map

```
app/
├── Http/
│   ├── Controllers/        # thin — Task, Board, Category, Calendar, Analytics, Admin, Workspace, Swimlane, Auth/*
│   ├── Requests/           # Form Requests (validation + authorize) — e.g. ProfileUpdateRequest, Auth/LoginRequest
│   └── Middleware/         # HandleInertiaRequests, EnsureUserIsAdmin
├── Services/               # business logic (~15): TaskService, CategoryService, ReminderService, SubtaskService,
│                           #   SearchService, ReportingService, NotificationService, CacheService, QueueService,
│                           #   GoogleCalendarService, ActivityLogService, MonitoringService, DatabaseOptimizationService…
├── Repositories/
│   ├── Contracts/          # TaskRepositoryInterface, CategoryRepositoryInterface, TagRepositoryInterface, UserRepositoryInterface
│   └── Eloquent/           # matching *Repository implementations
├── Models/                 # Task, Board, Swimlane, Workspace, Category, Tag, Subtask, Reminder, ActivityLog, InviteCode, User
├── Console/Commands/       # GoogleCalendarSync, ResetRecurringTasks, SystemOptimization, SetupShowcaseUser
├── Mail/  Notifications/  Providers/
└── Modules/
    └── Finance/            # self-contained domain module
        ├── Controllers/    # FinanceAccount, FinanceBudget, FinanceCategory, FinanceDashboard, FinanceLoan,
        │                   #   FinanceReport, FinanceSavingsGoal, FinanceTransaction, FinanceWalletCollaborator
        ├── Models/         # FinanceAccount, FinanceBudget, FinanceCategory, FinanceLoan, FinanceReport, FinanceSavingsGoal, …
        ├── Repositories/   ├── Services/   └── Enums/   # e.g. FinanceAccountInstitution
```

## Bindings

Repository interface → Eloquent implementation bindings live in `app/Providers/AppServiceProvider.php`:

```php
$this->app->bind(
    \App\Repositories\Contracts\TaskRepositoryInterface::class,
    \App\Repositories\Eloquent\TaskRepository::class
);
// … Category, Tag, User the same way
```

Several Services are registered as singletons in the same provider (`ReminderService`, `SubtaskService`, `GoogleCalendarService`, `NotificationService`, `SearchService`, `ReportingService`, `CacheService`, …). Add new bindings here.

**Pattern to follow when adding a feature:**
1. Migration (`database/migrations/`, reversible, driver-neutral).
2. Model in `app/Models/` (or `app/Modules/Finance/Models/`).
3. Repository interface + Eloquent impl + binding in `AppServiceProvider`.
4. Service method for the business logic.
5. Form Request for validation.
6. Thin controller action returning an Inertia response.
7. Route in `routes/web.php` (or `routes/auth.php`); expose to JS via Ziggy.
8. Pest test(s).

## Routing / frontend bridge

- Inertia web routes in `routes/web.php` + `routes/auth.php` — **not** a decoupled REST API. Controllers return `Inertia::render('Page', [...props])`.
- `App\Http\Middleware\HandleInertiaRequests` shares global props (auth user, flash, etc.).
- Named routes are exposed to React via **Ziggy** (`tightenco/ziggy`) — use `route()` names consistently.
- Sanctum 4 provides session/SPA auth.

## Database

- Default connection `sqlite` (`config/database.php`), but real dev/prod is **mysql** (`.env.example`). Tests use sqlite `:memory:` (`phpunit.xml`).
- Migrations are timestamp-named; Finance ships ~35 under `2026_01_20*`/`2026_01_21*` including data-backfill migrations (`backfill_opening_balance_transactions`, `fix_credit_card_bounds`).
- Pivots exist: `category_tag`, `task_tag`, `finance_transaction_tag`, `workspace_collaborators`, `board_collaborators`, `finance_wallet_collaborators`.

## Portable-SQL reference implementations
- `app/Models/Task.php` → `scopeOrderByDateTime`
- `app/Http/Controllers/AnalyticsController.php` → weekly day-of-week driver branching
- `app/Modules/Finance/Repositories/FinanceTransactionRepository.php` → `monthPeriodExpression()`

## Commands
- `composer test` — clear config + run Pest.
- `vendor/bin/pint` — format; `vendor/bin/pint --test` — check only.
- `composer analyse` — Larastan (if configured).
- `php artisan migrate` / `migrate:fresh --seed`.
- `composer dev` — serve + queue + vite concurrently.
