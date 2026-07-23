# Android — native & Capacitor shell

Guidance for the Android side of Wevie, whether it's the Capacitor `android/` shell or a fully native Jetpack Compose app. Verify toolchain specifics against developer.android.com — Google raises the required `targetSdk` for Play submissions on a yearly cadence.

## Toolchain — establish and state it

- **Kotlin** for app code; **Jetpack Compose** + **Material 3** for new UI.
- **Gradle (AGP) with Kotlin DSL** (`build.gradle.kts`).
- Pick `minSdk` (device reach vs. API availability) and `targetSdk` (Play requires a recent level) deliberately — state both. Don't silently accept the template defaults.

## Conventions

- Follow the official **Kotlin coding conventions** — do **not** carry the web repo's 4-space-JSX habits into Kotlin; use the Kotlin/Android idiom.
- Compose UI + `ViewModel` (state holder) + repository for data; `Kotlin coroutines` / `Flow` for async; **Retrofit + kotlinx.serialization / Moshi** for the API; models mirror the API JSON.
- Keep composables small and stateless where possible (hoist state); push logic into ViewModels/repositories, mirroring the backend's layered thinking.
- Match the Wevie brand: a Compose theme with `#4ACF91` (primary) and `#5FDDE0` (secondary), `Inter` (or a bundled font), supporting light **and** dark via `dynamicColor`-off Material theming so brand colors hold.

## Auth (native path)

- Sanctum **personal-access token** from a login API call, stored via **EncryptedSharedPreferences** / DataStore (never plain SharedPreferences).
- Send `Authorization: Bearer <token>`; on 401 clear the token and route to login.

## Platform concerns

- **Push:** **FCM** via the server + a `FirebaseMessagingService`; on Android 13+ request the `POST_NOTIFICATIONS` runtime permission and handle denial.
- **App Links:** verified `android:autoVerify` intent filters + the `assetlinks.json` served by Laravel; route the deep link to the matching screen.
- **Back navigation:** honor the system/predictive back gesture — hardware/gesture back maps to the app's nav stack (in Capacitor, to Inertia/router history).
- **Insets:** edge-to-edge with `WindowInsets`; respect status/navigation bars and cutouts; test a small phone and a tablet.
- **Permissions & Data safety:** request at point of use; complete the Play **Data safety** form and provide an account-deletion path. These are submission blockers.
- **Biometrics:** `androidx.biometric` if gating sensitive Finance screens.

## Capacitor shell specifics

- The `android/` project is generated — treat most of it as managed; `npx cap sync` after every web build.
- Custom native code goes in a Capacitor plugin, not by hand-editing generated files that sync overwrites.
- Verify cookie/session sharing so the WebView stays authenticated against Sanctum; wire the hardware back button to router history.

## Verify before returning

- Build: `./gradlew assembleDebug`; for Capacitor run `npm run build && npx cap sync android` first.
- Note `minSdk`/`targetSdk`, whether it installs/runs on an emulator, and any signing/keystore setup still required. Paste the build result.
