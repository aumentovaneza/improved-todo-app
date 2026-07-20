---
name: laravel-backend
description: Backend development for this Laravel + Inertia app — controllers, models, migrations, Services, Repositories, Form Requests, Pest tests, Artisan, queues, and the Modules/Finance domain. Use for any PHP/Laravel/Eloquent/database work. Keeps current with the latest Laravel & PHP while building correctly on the repo's installed versions.
---

# Laravel Backend (Wevie)

Repo-aware guidance for backend work on this **Laravel + Inertia.js v2 + React** monolith. Read this before touching PHP; load `references/conventions.md` for the full architecture map and `references/upgrade-protocol.md` before any version bump.

## 1. Version freshness protocol (do this first)

Never assume versions from memory — they drift. Before non-trivial work:

1. **What's installed:** `composer show laravel/framework | grep versions` and `php -v`. Prefer the docs matching that release (`laravel.com/docs/{major}.x`).
2. **What's latest:** if the task touches new framework features or a version question, `WebSearch` laravel.com / laravel-news.com for the current release. State which version you are targeting.
3. **Build for the installed version**, not the latest — don't use a Laravel-13-only API while the repo is on 12.

**Current baseline (verify, don't trust):** Laravel `^12.0` (locked 12.19), PHP `^8.2` (deploys on 8.5), Inertia v2, Sanctum 4, Pest 3, Pint (default `laravel` preset). Latest available at time of writing: Laravel 13, PHP 8.5.

## 2. Architecture — reuse the existing layers

This app is layered. Do **not** put business logic in controllers.

- **Controllers** (`app/Http/Controllers/`) stay thin: resolve request → call a Service → return an Inertia response / redirect.
- **Services** (`app/Services/`, ~15 of them: `TaskService`, `CategoryService`, `ReminderService`, `SearchService`, …) hold business logic. Many are bound as singletons in `AppServiceProvider`.
- **Repositories** (`app/Repositories/Contracts/*Interface.php` + `Eloquent/*Repository.php`) own data access. Inject the **interface**, not the Eloquent class — bindings live in `app/Providers/AppServiceProvider.php`. When you add a repository, add its interface + binding.
- **Form Requests** (`app/Http/Requests/`) hold validation + authorization. Add a Form Request rather than validating inline in a controller.
- **Models** (`app/Models/`) — Eloquent conventions; keep `$fillable`/`$hidden`/`$casts` explicit.
- **Modules/Finance** (`app/Modules/Finance/`) is a self-contained domain with its **own** `Controllers/`, `Models/`, `Repositories/`, `Services/`, `Enums/`. Keep Finance code inside the module; don't leak it into the top-level `app/` layers or vice-versa.

See `references/conventions.md` for the concrete file map.

## 3. Database portability (hard rule)

The app targets **three drivers**: MySQL (prod), SQLite (in-memory tests), Postgres (portability). Raw SQL must work on all three.

- Never emit an unguarded MySQL-only function (`DATE_FORMAT`, `DAYOFWEEK`, `CONCAT` for date math, etc.).
- Follow the existing driver-aware patterns:
  - `Task::scopeOrderByDateTime` — portable `CAST(... AS TIME)` ordering.
  - `AnalyticsController` day-of-week — branches per driver (`EXTRACT(DOW)+1` pgsql / `strftime` sqlite / `DAYOFWEEK` mysql).
  - `FinanceTransactionRepository::monthPeriodExpression()` — `TO_CHAR` / `strftime` / `DATE_FORMAT` per driver.
- Prefer Eloquent / query-builder expressions over raw SQL when possible. When raw is needed, branch on `DB::connection()->getDriverName()`.
- Migrations must be reversible (`down()`), timestamp-named, and driver-neutral in column types.

## 4. Testing (required for new behavior)

- Runner is **Pest 3**; tests hit **sqlite `:memory:`**. `Feature` suite uses `RefreshDatabase`.
- Add `tests/Feature/*` for endpoints/flows and `tests/Unit/*` for isolated logic. Follow existing examples (e.g. `tests/Feature/Modules/Finance/CreditCardResetTest`).
- Run `composer test` (clears config then `artisan test`) before returning. New behavior without a test is incomplete.

## 5. Style & static analysis

- Format with `vendor/bin/pint` (default `laravel` preset, no `pint.json`). 4-space indent per `.editorconfig`.
- If configured, run `composer analyse` (Larastan). Don't introduce new Larastan errors above the configured baseline level.

## 6. Upgrade posture

Build on the **installed** version. You may *recommend* moving toward a newer Laravel/PHP, but only after running the `references/upgrade-protocol.md` assessment and confirming no breaking impact. Never perform a major upgrade speculatively or as a side effect of another task.

## Definition of done
Logic in the right layer · validation in a Form Request · portable SQL · Pest test added & `composer test` green · `pint` clean · (Larastan clean if configured).
