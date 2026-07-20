# UI/UX pre-ship checklist

Run through this before considering any UI change done.

## States (never ship only the happy path)
- [ ] **Loading** — skeleton/spinner while data or `form.processing` is pending; disable submit during in-flight requests.
- [ ] **Empty** — a meaningful empty state (icon + copy + primary action), not a blank area.
- [ ] **Error** — form field errors (`form.errors`) shown inline near the field; request/API failures surfaced via toast, not swallowed.
- [ ] **Success** — confirmation (toast / inline), form reset where appropriate.

## Accessibility
- [ ] Semantic HTML (`button` for actions, `a`/`Link` for navigation, headings in order, `label` tied to inputs).
- [ ] Fully keyboard operable; visible focus (`focus-visible:`) states.
- [ ] Interactive widgets (menus, modals, comboboxes, tabs) use **Headless UI** for correct ARIA + focus trapping instead of hand-rolled divs.
- [ ] Icon-only buttons have `aria-label`.
- [ ] Color contrast meets WCAG AA in **both** light and dark themes; color is never the only signal.
- [ ] Images/emoji have text alternatives where meaningful.

## Dark mode (class strategy)
- [ ] Every color/background/border/text utility has a `dark:` counterpart.
- [ ] Verify the component in **both** themes — no invisible text, no white cards on dark bg.
- [ ] Use Wevie tokens (`light-*` / `dark-*`, `primary`, `secondary`, semantic scales) — no raw hex.

## Responsive & mobile
- [ ] Mobile-first; test at sm / md / lg breakpoints.
- [ ] Check whether a `Components/Mobile/` variant exists or is expected.
- [ ] Touch targets ≥ ~44px; no horizontal overflow; tables/charts degrade gracefully on small screens.

## PWA / offline
- [ ] Don't assume network availability; handle offline (see `Components/Offline/`).
- [ ] Optimistic UI where it improves perceived speed, with rollback on failure.

## Motion & polish
- [ ] Transitions are subtle; honor `prefers-reduced-motion`.
- [ ] Use Headless UI `Transition` for enter/leave rather than ad-hoc timeouts.

## Feedback pattern guidance
- **Toast (react-toastify):** non-blocking confirmations, background results.
- **Modal/confirm (sweetalert2 or Headless UI Dialog):** destructive or blocking decisions.
- **Inline:** field-level validation.

## Consistency
- [ ] Reused existing components/libs rather than adding new ones.
- [ ] Spacing, radius (`rounded-lg`), and `shadow-soft` match surrounding UI.
- [ ] `npm run build` passes; lint clean if configured.
