# Backend review checklist (Laravel / PHP)

## Architecture & layering
- [ ] Controllers stay thin — no business logic; delegate to a Service.
- [ ] Business logic in `app/Services/*`; data access in `app/Repositories/*` (interface injected, not the Eloquent class).
- [ ] New repositories have a `Contracts/*Interface` + `Eloquent/*` impl + a binding in `AppServiceProvider`.
- [ ] `Modules/Finance` code stays inside the module; no cross-leak with top-level `app/` layers.

## Validation & requests
- [ ] Validation lives in a Form Request (`app/Http/Requests/*`), not inline `$request->validate()` in the controller.
- [ ] `authorize()` is implemented where the action is permission-gated (not blindly `return true`).

## Database portability (critical)
- [ ] No unguarded MySQL-only SQL (`DATE_FORMAT`, `DAYOFWEEK`, `CONCAT` date math, `IFNULL`, etc.) — must work on MySQL, SQLite, Postgres.
- [ ] Raw driver-specific SQL branches on `DB::connection()->getDriverName()` (see `Task::scopeOrderByDateTime`, `AnalyticsController`, `FinanceTransactionRepository::monthPeriodExpression()`).
- [ ] Migrations are reversible (`down()`) and use driver-neutral column types.

## Eloquent & performance
- [ ] No N+1 — relationships eager-loaded (`with()`) where iterated.
- [ ] `$fillable` set intentionally (no accidental mass-assignment of sensitive columns); `$hidden` covers secrets (passwords, tokens).
- [ ] `$casts` correct for dates/booleans/json.
- [ ] Expensive queries paginated/limited; indexes considered for new query patterns.

## Security & authorization
- [ ] Authorization enforced (policies / `EnsureUserIsAdmin` middleware / gate checks) — a user can't access another user's/workspace's data.
- [ ] No secrets hardcoded; config via `config()`/env, not literals.
- [ ] User input not concatenated into raw SQL (parameter bindings used).
- [ ] Sanctum/session auth respected on protected routes.

## Testing & quality
- [ ] New behavior has Pest coverage (`tests/Feature` with `RefreshDatabase`, or `tests/Unit`).
- [ ] `composer test` passes.
- [ ] `vendor/bin/pint --test` clean; `composer analyse` (if configured) introduces no new errors.

## Consistency
- [ ] Follows existing naming/structure; reuses existing Services/helpers instead of duplicating.
- [ ] Routes named and exposed via Ziggy where the frontend needs them.
