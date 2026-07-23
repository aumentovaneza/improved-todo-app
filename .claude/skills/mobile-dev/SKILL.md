---
name: mobile-dev
description: Native & hybrid mobile development for Wevie on Android and iOS — deciding and building the mobile delivery (Capacitor wrap of the existing React/Inertia PWA, or native SwiftUI / Jetpack Compose apps against the Laravel API), plus store packaging, push notifications, offline, deep links, and Sanctum auth. Use for any Android/iOS/Capacitor/Swift/Kotlin work or "take Wevie mobile" tasks.
---

# Mobile (Android & iOS) — Wevie

Repo-aware guidance for taking **Wevie** to mobile. Wevie today is a **Laravel 12 + Inertia v2 + React 18 PWA** — there is **no native mobile code and no dedicated mobile API yet**. Read this before adding any `android/`, `ios/`, or Capacitor scaffolding. Load `references/platform-strategy.md` first to choose the path, then `references/ios.md` and/or `references/android.md` for the platform you're building.

## 0. Understand what exists before adding anything

- **The app is already a PWA** (`vite-plugin-pwa`, `resources/js/Components/Offline/`, service worker). Installable to a home screen today — confirm the requirement isn't already met before writing native code.
- **There is a mobile-web layer**: `resources/js/Components/Mobile/` (`MobileTabBar`, `MobileFab`, …). Native shells should reuse these responsive React screens, not reimplement them.
- **Auth is session/SPA (Sanctum + Breeze)** over `routes/web.php`; there is **no token API surface** for third-party native clients. Native (non-webview) apps need Sanctum **token** auth added deliberately — see §3.
- **No native tooling is installed** (`package.json`/`composer.json` have no Capacitor/Cordova/RN). Adding a path is a real dependency + CI decision — justify it.

## 1. Pick the delivery path first (this is the biggest decision)

Two viable paths — `references/platform-strategy.md` has the full decision matrix. Default recommendation for this stack:

- **Capacitor wrap (recommended default).** Wrap the existing Inertia/React PWA in a native WebView shell. One codebase, reuses every screen and the Wevie design system, ships to both stores, and adds native plugins (push, biometrics, share, filesystem) only where needed. Lowest cost, highest reuse — fits a Laravel+React monolith.
- **Fully native (SwiftUI + Jetpack Compose).** Two native apps consuming a Laravel JSON API. Choose only when you need deep native UX, background work, or performance the WebView can't give. ~2× the build/maintenance and requires building & versioning a real mobile API.

Do **not** introduce React Native / Expo / Flutter as a third stack without explicit sign-off — it duplicates the React UI you already have without the code reuse Capacitor gives.

State which path you're on at the top of any mobile task; the rest of the skill branches on it.

## 2. Version freshness protocol (do this first, like the other skills)

- **Establish installed versions** before non-trivial work: `package.json` (React 18.2, Vite 6, Inertia 2), `composer.json` (Laravel 12, Sanctum 4, PHP 8.2+). Build for **these**.
- **Establish platform toolchain versions** you're targeting and say so: iOS deployment target + Xcode/Swift, Android `minSdk`/`targetSdk` + Kotlin/AGP, and for Capacitor the major (`@capacitor/core`). If a task needs a new native API, `WebSearch` the official docs (developer.apple.com, developer.android.com, capacitorjs.com) — mobile SDKs move fast and store requirements change yearly.
- Never silently bump a native minSdk / deployment target / Capacitor major as a side effect; assess and recommend.

## 3. Backend & auth — what mobile needs from Laravel

- **Capacitor/WebView** rides the existing **session cookie** auth as long as the WebView shares cookies and CSRF works — verify CORS/`SANCTUM_STATEFUL_DOMAINS`/`config/cors.php` for the app's origin. Prefer reusing the web session over inventing a token flow.
- **Native apps** need **Sanctum personal-access tokens** (`createToken`) and a small, versioned **API surface** (e.g. `routes/api.php` under `auth:sanctum`) — this does not exist yet, so building native means building that API first, going through the repo's layers (thin controller → Service → Repository, Form Requests, **portable SQL**). Respect the `Modules/Finance` boundary.
- **Keep the backend the single source of truth.** Don't duplicate business logic in the app; call the API/Service. Follow the root `CLAUDE.md` and the `laravel-backend` skill for any PHP you add.
- **Never ship secrets in the app binary** — mobile bundles are trivially decompiled. No API keys, no signing secrets, no service-account JSON in the client.

## 4. Cross-cutting mobile concerns (both paths)

- **Offline** — Wevie already has offline UX on web; don't regress it. Capacitor: keep the service worker working inside the shell. Native: cache with the platform store (Core Data / Room) and reconcile on reconnect.
- **Push notifications** — server side integrates with the existing `NotificationService`; client side is APNs (iOS) + FCM (Android), surfaced via a plugin (Capacitor) or native SDK. Handle permission prompts, denied state, and foreground vs background.
- **Deep links / universal links** — map to Ziggy routes so a link opens the right screen; register Associated Domains (iOS) and App Links (Android).
- **Safe areas & insets** — respect notches/home indicator/status bar; test small phones and tablets, portrait and landscape.
- **Design system** — the mobile UI must read as Wevie: reuse the Tailwind tokens (`primary` #4ACF91, `secondary` #5FDDE0, `wevie.*`, `light-*`/`dark-*`) in the webview path, and mirror those exact colors + `Inter` font natively. Honor light/dark and `prefers-reduced-motion`.
- **Store compliance** — privacy manifests / data-safety forms, required permission usage strings, account-deletion path, and current SDK-level requirements are release blockers. Check them before promising a submission.

## 5. Conventions

- **Repo web code** keeps its existing rules (4-space indent, PascalCase JS, double-quoted imports, Wevie tokens, Inertia props — no Redux/Zustand/React Query). Follow `react-ui-ux` / `laravel-backend` when you touch `resources/js` or `app/`.
- **Native code** follows its platform idiom, not the web one: Swift API Design Guidelines + SwiftUI (`references/ios.md`); Kotlin coding conventions + Jetpack Compose + Material 3 (`references/android.md`). Don't force 4-space-JS habits onto Swift/Kotlin.
- **Isolate native projects.** Capacitor `ios/` & `android/` or standalone native apps live in clearly separated directories (or a sibling repo) with their own gitignore/build config — keep them out of the Laravel/Vite build.
- **Verify it builds** before returning: web/Capacitor → `npm run build` then `npx cap sync`; iOS → `xcodebuild` / builds in Xcode; Android → `./gradlew assembleDebug`. Paste the result.

## Definition of done
Delivery path stated & justified · reuses the PWA/design system (or documents why native) · auth path correct (session for WebView, Sanctum tokens + versioned API for native) · offline/push/deep-links/safe-areas handled as scoped · no secrets in the binary · native projects isolated from the web build · target build passes · store-compliance blockers called out.
