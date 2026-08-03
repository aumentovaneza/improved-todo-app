# iOS device testing — sideload Wevie without the App Store

This is the Capacitor **WebView shell** for Wevie. The native app is a thin wrapper: at
launch it loads `server.url` from `capacitor.config.json` (your live/staging Wevie origin)
in a full-screen WebView. Because the WebView loads that origin directly, the Laravel
session cookie is first-party — **no CORS / Sanctum / CSRF changes are needed** for this path.

Goal: install Wevie on a physical iPhone for testing, using a **free Apple ID** (no paid
Developer Program, no App Store submission).

---

## One-time prerequisites (manual)

1. **Full Xcode** from the Mac App Store (Command Line Tools alone are not enough).
   Open it once to accept the license, then:
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   xcodebuild -version          # should print a version
   ```
2. **Sign your Apple ID into Xcode**: Xcode ▸ Settings ▸ Accounts ▸ “+” ▸ Apple ID.
   This becomes your free **Personal Team** for signing.

> Capacitor 8 uses **Swift Package Manager**, so CocoaPods is **not** required for this
> project. You open `App.xcodeproj` directly — there is no `.xcworkspace`.

## Set the server URL

Edit `capacitor.config.json` and replace the placeholder with your live/staging HTTPS URL:
```json
"server": { "url": "https://app.yourdomain.com", "cleartext": false }
```
It must be **HTTPS** (ATS requires it) and reachable from the phone.

## Generate & sync the iOS project (after prerequisites)

From the repo root:
```bash
npx cap add ios        # generates ios/  (first time only; Capacitor 8 uses SPM, no pods)
npm run cap:sync       # cap sync ios — run after any config change
npm run cap:ios        # cap open ios — opens App.xcodeproj in Xcode
```

## Sign & install to your iPhone (Xcode)

1. In Xcode, select the **App** target ▸ **Signing & Capabilities**:
   - ✅ *Automatically manage signing*
   - **Team** = your Personal Team (Apple ID)
   - **Bundle Identifier** = `com.wevie.app` (change if Xcode reports it’s taken — free
     personal teams need a globally-unique id, e.g. `com.<you>.wevie`)
   - **Deployment Target** = iOS 16 (set deliberately; don’t just accept Xcode’s newest).
2. Connect the iPhone via USB and **trust** the Mac when prompted.
3. Pick your device from the run-destination dropdown, press **▶ Run**.
4. First launch fails to open with an “Untrusted Developer” warning — on the phone go to
   **Settings ▸ General ▸ VPN & Device Management ▸ [your Apple ID] ▸ Trust**, then re-open
   the app.

The app should launch, show the brief “Loading Wevie…” splash, then load the live site.
An existing web login session works because the cookie is same-origin.

## The 7-day expiry (free-account limitation)

A free Personal Team signs apps for **7 days**. After that the app refuses to launch until
re-signed — just **re-run from Xcode** (steps above) to reinstall a fresh 7-day build.
Free accounts also cap you at ~3 sideloaded apps at a time.

> Want to drop the 7-day churn? A paid **Apple Developer Program** ($99/yr) gives 1-year
> signing plus TestFlight / ad-hoc over-the-air installs — a later upgrade, not required now.

## Verify

- `npx cap doctor` → iOS listed as installed, no missing deps.
- Xcode build to the device **succeeds**.
- App loads the live Wevie over HTTPS and the session works.

## Notes / caveats

- This shell points at a **remote** origin, which is ideal for testing but **Apple would
  reject a pure-WebView at store submission (Guideline 4.2)**. Store readiness (native push,
  background Pomodoro timer, biometrics, etc.) is a later phase, not this setup.
- Treat the generated `ios/` project as **managed** — re-run `npm run cap:sync` after config
  changes rather than hand-editing files the sync overwrites.
