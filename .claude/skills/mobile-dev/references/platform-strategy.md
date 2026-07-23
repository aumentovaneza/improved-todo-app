# Mobile delivery strategy — choosing the path

Wevie is a Laravel + Inertia + React **PWA**. Before writing native code, decide *how* Wevie goes mobile. Get this wrong and you either ship a WebView you didn't need to eject from, or start a native app whose API doesn't exist.

## Step 0 — is a native app even required?

The app is already an installable PWA (`vite-plugin-pwa`, offline components). Ask what the store app buys that the PWA doesn't:

- Store presence / discoverability, native push, biometrics, background sync, App Store payments, deep native gestures, or "must be in the store" org requirement → yes, build a shell/native app.
- Just "installable on a phone" / "works offline" → the PWA may already satisfy it. Confirm the real requirement before adding a stack.

## The decision matrix

| Factor | Capacitor wrap (WebView) | Fully native (SwiftUI + Compose) |
|---|---|---|
| Code reuse | **~100%** of the React/Inertia UI | ~0% UI; reuses only the backend |
| Codebases to maintain | 1 (web) + thin shells | web + **2 native apps** |
| Backend work | Reuse session auth; verify CORS/Sanctum stateful | **Build a versioned token API first** |
| Native UX ceiling | Good; native via plugins | Highest |
| Offline | Reuse existing service worker | Rebuild with Room / Core Data |
| Time-to-store | Low | High (~2×+) |
| Best when | Reuse & speed matter (default here) | Deep native UX / background / perf needs |

**Recommended default for this repo: Capacitor.** A React monolith with an existing PWA is the exact case Capacitor is for — one UI, two stores, native plugins only where needed.

## Path A — Capacitor wrap (recommended)

High-level (verify current commands against capacitorjs.com — the major version drives the API):

1. Add Capacitor to the existing web project; set `webDir` to the Vite build output.
2. `npx cap add ios` / `npx cap add android` → creates isolated `ios/` & `android/` native projects.
3. Build web (`npm run build`) then `npx cap sync` on every web change to copy assets + plugins into the shells.
4. **Auth:** the WebView loads the Laravel app; it rides the **session cookie**. Verify `SANCTUM_STATEFUL_DOMAINS`, `config/cors.php`, and CSRF work for the app origin (`capacitor://localhost` / the served origin). Prefer this over a token flow.
5. **Native features via plugins:** `@capacitor/push-notifications` (APNs/FCM), `@capacitor/preferences`, `@capacitor/filesystem`, `@capacitor/share`, biometrics — add only what's used.
6. **Keep the PWA service worker functioning** inside the shell so offline UX doesn't regress.
7. Respect safe areas (env insets), status-bar theming, and the back button (Android hardware back → Inertia/router history).

Guardrails: don't fork the UI for mobile — reuse `Components/Mobile/` responsive screens. Don't leak native-only code into the web bundle; gate on `Capacitor.isNativePlatform()`.

## Path B — Fully native

Choose only when Path A's ceiling is genuinely too low. Then:

1. **Build the API first.** No mobile/token API exists today. Add `auth:sanctum` token routes (`createToken`), versioned (`/api/v1`), through the repo's layers (controller → Service → Repository, Form Requests, **portable SQL**, `Modules/Finance` isolated). See the `laravel-backend` skill.
2. **iOS:** SwiftUI app — see `references/ios.md`.
3. **Android:** Jetpack Compose app — see `references/android.md`.
4. Mirror the Wevie brand exactly (`#4ACF91`, `#5FDDE0`, `Inter`, light/dark) so it reads as the same product.
5. Two apps = two release trains, two sets of store metadata, double the QA. Budget for it.

## Anti-patterns

- **A third UI stack** (React Native / Expo / Flutter) — duplicates the React UI you already have, without Capacitor's reuse. Needs explicit sign-off.
- **Starting native before the API exists** — you'll block on backend work mid-app.
- **Secrets in the binary** — decompilable. Keep them server-side.
- **Forking business logic into the app** — backend stays the source of truth.
