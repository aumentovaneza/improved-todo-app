---
name: react-ui-ux
description: Frontend development for this Inertia + React app — building/editing pages and components, styling with Tailwind, responsive & mobile layouts, dark mode, accessibility, and UI/UX quality. Use for any .jsx / resources/js / Tailwind / component work. Deeply versed in React and UI/UX; builds on the repo's installed React while tracking the latest.
---

# React & UI/UX (Wevie)

Repo-aware guidance for the **React 18 + Inertia.js v2** frontend (Vite 6, Tailwind v3, plain JSX — **no TypeScript**). Read before touching `resources/js`. Load `references/conventions.md` for patterns and `references/ux-checklist.md` before shipping any UI.

## 1. Version freshness protocol (do this first)

- **Installed:** check `package.json` — React 18.2, `@inertiajs/react` 2, Vite 6, Tailwind 3, Headless UI 2. Build for **these** versions.
- **Latest:** if a task involves new React patterns, `WebSearch` react.dev. Latest at time of writing is React 19.2 — **do not** use React-19-only APIs (`use`, new `<form>` actions, `useActionState`, ref-as-prop) while the repo is on 18.
- State which React version you are targeting when it matters.

## 2. Architecture — how this frontend works

- **Inertia, not a separate SPA/API.** Pages live in `resources/js/Pages/**/*.jsx` and are rendered server-side via `Inertia::render`. Entry: `resources/js/app.jsx`.
- **Server state comes from Inertia props** — read with `usePage().props`, submit with `useForm`, navigate with `router` (`@inertiajs/react`). **Do NOT add Redux, Zustand, or React Query** — none are installed and server state is already handled by Inertia.
- **Shared client state** uses React Context (see `resources/js/Components/Pomodoro/PomodoroContext.jsx`, which wraps the app). Follow that pattern for new cross-component state.
- **Routing:** use Ziggy `route('name', params)` for URLs — never hardcode paths.
- **Structure:** `Pages/` (per-feature: Tasks, Calendar, Boards, Finance, Analytics, Admin, Workspaces, Profile, Auth), `Components/` (shared, incl. `Mobile/`, `Finance/`, `Pomodoro/`, `widgets/`, `Offline/`), `Layouts/`, `tours/` (react-joyride).

## 3. Design system — reuse Wevie tokens, don't invent colors

`tailwind.config.js` defines the full system (`darkMode: 'class'`). Use the tokens; don't hardcode hex or add ad-hoc colors.

- **Brand:** `primary` (400 = `#4ACF91`, green) and `secondary` (400 = `#5FDDE0`, cyan). Also a `wevie.*` set (teal/mint/surface/border/text.*, plus `wevie.dark.*`).
- **Semantic:** `success`, `warning`, `error`, `info` scales.
- **Theme surfaces:** `light-*` and `dark-*` background/text/border utilities (e.g. `bg-light-card` / `bg-dark-card`, `text-light-primary` / `text-dark-primary`, `border-light-border` / `border-dark-border`).
- **Every color needs a dark-mode variant** — pair each `light-*` / light class with its `dark:` counterpart. The app toggles the `class` strategy, so untreated components break in dark mode.
- Font is `Inter`; soft shadow token is `shadow-soft`.

## 4. Component libraries — use what's installed, don't add new ones

Reach for the existing library before adding a dependency:

- **Headless UI** (`@headlessui/react`) — accessible primitives (menus, dialogs, listboxes, transitions).
- **Tremor** (`@tremor/react`) — charts / dashboard tiles (Analytics, Finance).
- **lucide-react** — icons.
- **@dnd-kit** (core/sortable/utilities) — drag & drop (Kanban boards, task ordering).
- **react-toastify** — toasts; **sweetalert2** — confirm dialogs.
- **react-joyride** — product tours (`resources/js/tours/`).
- **@emoji-mart** — emoji picker. **date-fns** — dates. **axios** — configured in `resources/js/bootstrap.js`.

Adding a new UI dependency needs justification that nothing above covers it.

## 5. UI/UX quality bar

Every interactive surface must satisfy `references/ux-checklist.md`. Highlights:
- **Accessible:** semantic HTML, keyboard operable, focus-visible states, sufficient contrast; use Headless UI for correct ARIA rather than hand-rolling.
- **Responsive & mobile:** design mobile-first; there is a dedicated `Components/Mobile/` — check whether a mobile variant is expected.
- **Every state handled:** loading, empty, error, and success — never render only the happy path.
- **PWA/offline aware:** the app is a PWA (`vite-plugin-pwa`, `Components/Offline/`) — don't assume the network is up.
- **Motion:** honor `prefers-reduced-motion`.

## 6. Conventions

- 4-space indent (`.editorconfig`), PascalCase component files & directories, double-quoted imports, `@/` alias → `resources/js` (see `jsconfig.json`).
- Plain JSX — no TypeScript, no `.tsx`.
- No linter was originally configured; if ESLint/Prettier are present, run `npm run lint` / `npm run format` before finishing and match their rules. Otherwise match surrounding code style manually.
- Confirm your change **compiles**: `npm run build` (or run `npm run dev` / `composer dev`) before returning.

## Definition of done
Uses Inertia props (no new state lib) · reuses Wevie tokens with dark-mode variants · reuses existing component libs · loading/empty/error states handled · accessible & responsive · `npm run build` passes · lint clean (if configured).
