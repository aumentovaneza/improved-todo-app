# CLAUDE.md — Wevie (improved-todo-app)

Guidance for AI agents working in this repo. Read this first; it's the shared baseline the skills build on.

## What this is
**Wevie** is a productivity app (tasks, boards/Kanban, calendar, analytics, Pomodoro, and a Finance module) built as a **Laravel + Inertia.js v2 + React monolith** — a single Laravel app that serves React pages through Inertia (not a decoupled SPA/API). It ships as a **PWA** with offline support.

## Stack (verify against composer.json / package.json — versions drift)
| Layer | Version | Notes |
|-------|---------|-------|
| PHP | `^8.2` floor | deploys on 8.5 |
| Laravel | `^12.0` (locked 12.19) | latest available is 13 |
| Inertia | v2 | `inertiajs/inertia-laravel` + `@inertiajs/react` |
| Auth | Sanctum 4 | session/SPA auth; scaffolded via Breeze |
| Routes→JS | Ziggy 2 | `route()` in JS |
| React | 18.2 | plain **JSX, no TypeScript**; latest available is 19 |
| Build | Vite 6 | `vite-plugin-pwa` |
| CSS | Tailwind v3 (PostCSS) | custom "Wevie" design system, `darkMode: 'class'` |
| Tests | Pest 3 | backend only; sqlite `:memory:` |
| Style | Pint (default preset) | + Larastan & ESLint/Prettier if configured |

## Architecture map
**Backend (`app/`)** — layered; keep logic out of controllers:
- `Http/Controllers/` thin → `Services/` (business logic) → `Repositories/{Contracts,Eloquent}` (data, interface-bound in `Providers/AppServiceProvider.php`).
- `Http/Requests/` Form Requests for validation/authorization; `Http/Middleware/` (`HandleInertiaRequests`, `EnsureUserIsAdmin`).
- `Modules/Finance/` — self-contained domain (own Controllers/Models/Repositories/Services/Enums). Keep it isolated.

**Frontend (`resources/js/`)** — `Pages/**/*.jsx` (Inertia route targets), `Components/` (incl. `Mobile/`, `Finance/`, `Pomodoro/`, `Offline/`), `Layouts/`, `tours/`. Entry `app.jsx`.

## Hard rules
1. **Portable SQL** — all raw SQL must run on MySQL (prod), SQLite (tests), and Postgres. Branch on `DB::connection()->getDriverName()`; never emit unguarded MySQL-only functions. See `Task::scopeOrderByDateTime`, `AnalyticsController`, `FinanceTransactionRepository::monthPeriodExpression()`.
2. **Server state = Inertia props** — use `usePage`/`useForm`/`router`. Do **not** add Redux, Zustand, or React Query. Shared client state via Context (see `PomodoroContext`).
3. **Design system** — reuse Wevie Tailwind tokens (`primary` #4ACF91, `secondary` #5FDDE0, `wevie.*`, `light-*`/`dark-*`, semantic scales); pair every color with a `dark:` variant. No raw hex.
4. **Reuse before adding** — existing Services/Repositories (backend) and libs (Headless UI, Tremor, lucide, dnd-kit, toastify, sweetalert2, react-joyride, date-fns) before new dependencies.
5. **Style** — 4-space indent (`.editorconfig`), PascalCase JS files, double-quoted imports.
6. **Upgrades** — build on installed versions. Only upgrade Laravel/React/etc. after the safe-assessment protocol shows no breakage (`.claude/skills/laravel-backend/references/upgrade-protocol.md`).

## Commands
```bash
composer test              # Pest (clears config first)
vendor/bin/pint            # format PHP   |  vendor/bin/pint --test  (check only)
composer analyse           # Larastan (if configured)
php artisan migrate        # DB migrations  |  migrate:fresh --seed
npm run dev                # Vite dev  |  npm run build  (prod build)
composer dev               # serve + queue + vite together
npm run lint / format      # ESLint / Prettier (if configured)
```

## Skills & subagents (`.claude/`)
Prefer these — they carry the detailed, repo-specific rules:
- **Skills:** `laravel-backend` (PHP/Laravel work), `react-ui-ux` (React + UI/UX), `code-review` (stack-aware diff review).
- **Subagents:** `laravel-backend-engineer`, `react-ui-engineer`, `code-reviewer` — delegate focused end-to-end work to these.
