# Framework/language upgrade protocol

Use this before recommending or performing any Laravel or PHP major-version bump. The rule for this repo: **only upgrade when the assessment below shows no breaking impact.** Never bump speculatively.

## Step 1 — Establish the delta
- Installed: `composer show laravel/framework | grep versions`, `php -v`.
- Latest: `WebSearch` laravel.com/docs (releases page) and laravel-news.com for the current major and its **minimum PHP**.
- Note the gap (e.g. repo on 12 / PHP 8.2 → latest 13 / PHP 8.3+).

## Step 2 — Read the official upgrade guide
- `laravel.com/docs/{target}.x/upgrade` — list every "High/Medium impact" change.
- Map each change to this codebase: does it touch code we use? (config casts, middleware registration, Eloquent behavior, validation, etc.)

## Step 3 — Dependency compatibility
- `composer outdated --direct` — see how far each direct dep is behind.
- For each direct dependency (Inertia, Ziggy, Sanctum, Breeze, Pest, google/apiclient, symfony/console), confirm a release supports the target Laravel/PHP. **A single incompatible dep blocks the upgrade** until it ships support.

## Step 4 — Dry-run in isolation
- Do it on a **branch**, never on `main`/the working branch directly.
- Bump constraints, `composer update`, resolve conflicts.
- Run the full gate: `composer test` (Pest), `vendor/bin/pint --test`, `composer analyse` (if configured), `npm run build`.
- Manually verify the Inertia bridge still renders and auth (Sanctum) works.

## Step 5 — Decide
- **All green + no behavioral diffs** → recommend the upgrade with the branch ready for review.
- **Any red / incompatible dep / behavioral change** → do **not** upgrade. Report the specific blocker(s) and stay on the current version.

## PHP-only bumps
Same discipline: check `composer.json` `php` constraint, deploy target PHP, and each dep's PHP support; run the full gate on a branch. (Repo already deploys on PHP 8.5 while the floor is `^8.2` — raising the floor is low-risk but still gets the full gate.)

## Frontend (React/Vite/Tailwind) analogue
- `npm outdated`; read the React/Vite/Tailwind migration guides.
- React 18 → 19: check for removed APIs, `react-dom/client` changes, and third-party lib peer-dep support (Headless UI, Tremor, dnd-kit, react-joyride).
- Tailwind 3 → 4: config format + PostCSS/plugin changes; the repo has a large custom token set + safelist that must be ported.
- Dry-run on a branch, `npm run build`, visually verify before recommending.
