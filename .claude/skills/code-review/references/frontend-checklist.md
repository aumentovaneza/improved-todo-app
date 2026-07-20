# Frontend review checklist (React / Inertia / UX)

## State & data flow
- [ ] Server state comes from Inertia props (`usePage().props`, `useForm`, `router`) — **no** newly introduced Redux / Zustand / React Query.
- [ ] Shared client state uses Context following `PomodoroContext` (not prop-drilling or globals).
- [ ] Forms use `useForm`; `form.processing` drives loading; `form.errors` shown inline.
- [ ] URLs via Ziggy `route()` — no hardcoded string paths.

## Design system & dark mode
- [ ] Colors come from Wevie tokens in `tailwind.config.js` (`primary`, `secondary`, `wevie.*`, `light-*`/`dark-*`, semantic scales) — no raw hex / ad-hoc colors.
- [ ] **Every** light utility has a `dark:` counterpart; component verified in both themes (no invisible text / wrong surfaces).
- [ ] Spacing, radius, and `shadow-soft` consistent with surrounding UI.

## UX states
- [ ] Loading, empty, error, and success states all handled — not just the happy path.
- [ ] Field validation errors surfaced; request failures shown via toast, not swallowed.

## Accessibility
- [ ] Semantic HTML (`button`/`a`/`Link`, labels tied to inputs, heading order).
- [ ] Keyboard operable with visible focus states.
- [ ] Menus/modals/comboboxes/tabs use Headless UI for ARIA + focus management.
- [ ] Icon-only controls have `aria-label`; contrast meets AA in both themes.

## Responsive & PWA
- [ ] Mobile-first; no horizontal overflow; adequate touch targets.
- [ ] Mobile variant considered (`Components/Mobile/`).
- [ ] Offline/PWA behavior respected where relevant (`Components/Offline/`).

## Dependencies & reuse
- [ ] Reuses existing libs (Headless UI, Tremor, lucide, dnd-kit, toastify, sweetalert2, date-fns) rather than adding new ones; any new dep is justified.
- [ ] Reuses existing components rather than duplicating.

## Security
- [ ] No secrets / API keys / tokens embedded in client code or props.
- [ ] User-generated content rendered safely (no unsafe `dangerouslySetInnerHTML` without sanitization).

## Conventions & build
- [ ] 4-space indent, PascalCase files/dirs, double-quoted imports, `@/` alias.
- [ ] Plain JSX (no stray TypeScript).
- [ ] `npm run build` passes; `npm run lint` clean if configured.
