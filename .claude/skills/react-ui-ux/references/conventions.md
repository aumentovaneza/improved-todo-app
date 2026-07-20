# Frontend conventions & patterns

## File map

```
resources/js/
├── app.jsx                 # Inertia bootstrap: createInertiaApp + resolvePageComponent, wraps PomodoroProvider
├── bootstrap.js            # axios global config
├── Pages/                  # Inertia page components (route targets), by feature:
│                           #   Tasks/ Calendar/ Boards/ Finance/ Analytics/ Categories/
│                           #   Workspaces/ Profile/Partials/ Admin/{Users,InviteCodes,ActivityLogs} Auth/
├── Components/             # shared UI; subfolders: Mobile/ Pomodoro/ Finance/ widgets/ Offline/ Dropdown …
├── Layouts/                # page shells
├── tours/                  # react-joyride product tours
└── offline/                # PWA offline assets
resources/css/app.css       # Tailwind entry
resources/views/app.blade.php  # Inertia root (@inertia, @routes, @viteReactRefresh)
```

## Inertia patterns

```jsx
import { usePage, useForm, router, Link } from "@inertiajs/react";

// Read server state
const { auth, flash } = usePage().props;

// Forms
const form = useForm({ title: "", category_id: null });
const submit = (e) => {
    e.preventDefault();
    form.post(route("tasks.store"), {
        onSuccess: () => form.reset(),
        preserveScroll: true,
    });
};
// form.processing → loading state; form.errors.title → field error

// Navigation / links
<Link href={route("tasks.index")}>Tasks</Link>
router.visit(route("boards.show", board.id));
```

- Route URLs always via Ziggy `route(name, params)` — never string paths.
- Validation errors come back as `form.errors` (from the Laravel Form Request). Display them inline.
- Flash messages arrive as shared props; surface with react-toastify.

## Shared client state (Context)

Follow `Components/Pomodoro/PomodoroContext.jsx`: a `Provider` mounted in `app.jsx` + a `useX()` hook. Use this for genuinely cross-component client state — not for server data (that's Inertia props).

## Styling patterns

- Compose from Tailwind tokens defined in `tailwind.config.js`. Examples:
  - Card: `bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-soft`
  - Text: `text-light-primary dark:text-dark-primary`
  - Primary action: `bg-primary-400 hover:bg-primary-500 text-white`
- Pair **every** light utility with its `dark:` variant — the app switches themes via the `class` strategy.
- The safelist in `tailwind.config.js` permits dynamic `(bg|text|stroke|fill)-{palette}-{shade}` classes (used for user-chosen category/label colors).

## Conventions summary
- 4-space indent, PascalCase files/dirs, double-quoted imports, `@/` → `resources/js`.
- Plain JSX only. ESM (`"type": "module"`).
- Reuse `Components/` before creating new ones; check `Components/Mobile/` for a mobile variant.
- Verify compile with `npm run build`.
