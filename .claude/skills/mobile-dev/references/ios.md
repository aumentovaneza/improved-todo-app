# iOS — native & Capacitor shell

Guidance for the iOS side of Wevie, whether it's the Capacitor `ios/` shell or a fully native SwiftUI app. Verify toolchain specifics against developer.apple.com — Apple changes SDK levels, privacy rules, and submission requirements yearly.

## Toolchain — establish and state it

- **Xcode / Swift** current stable; pick a **deployment target** deliberately (don't just accept Xcode's newest default — it drops older devices). State it in the task.
- **Swift** for app code; **SwiftUI** for new UI, with UIKit interop only where SwiftUI lacks the API.
- **Swift Package Manager** for dependencies (prefer over CocoaPods for new work; Capacitor may still use CocoaPods — follow its generated `Podfile`).

## Conventions

- Follow the **Swift API Design Guidelines** (naming, clarity at the call site) — do **not** carry the web repo's 4-space-JSX habits into Swift; use the Swift/Xcode idiom.
- SwiftUI: `@Observable` / `@State` / `@Environment` for state; `async/await` + `URLSession` for networking; `Codable` models mirroring the API JSON.
- Keep views small and composable; push logic into view models / services, mirroring the backend's layered thinking.
- Match the Wevie brand: define a color asset catalog with `#4ACF91` (primary) and `#5FDDE0` (secondary), `Inter` (or the system font if Inter isn't bundled), and support light **and** dark appearance.

## Auth (native path)

- Sanctum **personal-access token** obtained via a login API call, stored in the **Keychain** (never `UserDefaults`).
- Send `Authorization: Bearer <token>`; handle 401 by clearing the token and routing to login.

## Platform concerns

- **Push:** APNs via the server + `UNUserNotificationCenter`. Request permission at a sensible moment; handle denied and provisional states; handle foreground presentation.
- **Universal Links:** Associated Domains entitlement + `apple-app-site-association` served by Laravel; route the incoming URL to the matching screen.
- **Safe areas:** respect notch/Dynamic Island/home indicator via safe-area insets; test the smallest supported device and iPad.
- **Privacy:** provide required `Info.plist` usage strings for any permission, and the **privacy manifest** (`PrivacyInfo.xcprivacy`) + App Store privacy answers. These are submission blockers.
- **Biometrics:** `LocalAuthentication` (Face ID/Touch ID) if gating sensitive Finance screens — include the Face ID usage string.

## Capacitor shell specifics

- The `ios/` project is generated — treat most of it as managed; `npx cap sync` after every web build.
- Custom native code goes in a Capacitor plugin, not by hand-editing generated files that sync overwrites.
- Verify cookie/session sharing so the WebView stays authenticated against Sanctum.

## Verify before returning

- Build: open in Xcode or `xcodebuild -scheme <App> -sdk iphonesimulator build`; for Capacitor run `npm run build && npx cap sync ios` first.
- Note the deployment target, whether it runs in the simulator, and any signing/capability setup still required. Paste the build result.
