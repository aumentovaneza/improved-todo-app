---
name: code-review
description: Repo-stack-aware review of a diff/PR/changed files for correctness, security, and convention adherence across both the Laravel backend and the React/Inertia frontend. Use when reviewing changes before commit or on a PR. Complements the built-in /code-review with Wevie-specific rules.
---

# Code Review (Wevie)

Review changes on this **Laravel + Inertia + React** repo against its own conventions. This complements — does not replace — the built-in `/code-review`; it adds stack-specific rules (portable SQL, layering, Wevie tokens, dark mode, Inertia state).

## Process

1. **Get the diff.** `git diff origin/main...` (or the PR diff / staged changes). List changed files.
2. **Route each file** to the right checklist by path:
   - `app/**`, `routes/**`, `database/**`, `tests/**`, `*.php` → **backend** (`references/backend-checklist.md`).
   - `resources/js/**`, `resources/css/**`, `*.jsx`, `tailwind.config.js`, `vite.config.js` → **frontend** (`references/frontend-checklist.md`).
   - A change spanning both (e.g. new endpoint + page) gets **both**.
3. **Run the repo's own tooling as evidence** (don't just eyeball):
   - `vendor/bin/pint --test` — style.
   - `composer analyse` — Larastan (if configured).
   - `composer test` — Pest (or at least the tests covering changed code).
   - `npm run lint` — ESLint/a11y (if configured).
   - `npm run build` — frontend compiles.
4. **Verify before reporting.** Trace the actual code path; don't flag on suspicion. If you can't confirm it's a real problem, either verify it or drop it.

## Version-awareness
For framework-specific concerns, check the **installed** versions (`composer show`, `package.json`) — don't flag use of an API as wrong when it's valid for the installed Laravel 12 / React 18, and don't approve a React-19-only API on an 18 codebase.

## What to check (summary — full lists in references/)

**Backend:** validation in Form Requests (not inline); logic in Services + data access in Repositories (not fat controllers/models); **portable SQL** across MySQL/SQLite/Postgres (flag unguarded MySQL-only functions); N+1 / missing eager-loading; authorization (policies, `EnsureUserIsAdmin`, Sanctum); mass-assignment (`$fillable`) & `$hidden` leaks; reversible migrations + `Modules/Finance` boundary respected; Pest coverage for new behavior.

**Frontend:** server state via Inertia props/`useForm` (flag introduced Redux/Zustand/React Query); Wevie tokens reused with **dark-mode variants present**; accessibility (semantic HTML, keyboard, ARIA via Headless UI, contrast); responsive/mobile; loading/empty/error states handled; existing libs reused vs new deps; no secrets/API keys shipped to the client; Ziggy `route()` used (no hardcoded paths).

## Output format

Report findings **most-severe first**, grouped:

- **Must-fix** (correctness / security / data-integrity / broken build or tests)
- **Should-fix** (convention violations, missing states, a11y gaps, portability risks)
- **Nice-to-have** (simplification, naming, minor style)

Each finding:
```
<path>:<line> — <one-line problem>
  Fix: <concrete suggestion>
```
End with a short verdict: what's blocking vs. safe to merge. No speculative findings — if it's unverified, say so or omit it.
