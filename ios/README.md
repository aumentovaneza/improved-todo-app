# Wevie iOS (Capacitor shell)

This is a thin [Capacitor](https://capacitorjs.com) native shell that wraps the
live Wevie web app in an iOS WebView. At runtime it loads `server.url` from
`capacitor.config.json` (the root config), which points at **https://wevie.app** —
so there is no local web bundle to build for normal use. The `capacitor/www/index.html`
splash is only shown briefly on launch / if the server is unreachable.

The native project uses **Swift Package Manager** (`ios/App/CapApp-SPM`), so no
CocoaPods / `pod install` is required.

## Prerequisites

- macOS with **Xcode** installed
- Node deps installed: `npm install`

## Open & run

```bash
npm run cap:sync     # copy config + web assets into the native project
npm run cap:open     # open ios/App/App.xcodeproj in Xcode
```

Then in Xcode: pick a simulator (or a connected device) and press **Run (⌘R)**.
You'll see the branded loading splash, then the live Wevie app.

Equivalent raw commands: `npx cap sync ios` / `npx cap open ios`.

## Point at a local dev server (optional)

To test against a local build instead of production, temporarily change
`server.url` in the root `capacitor.config.json` to your machine's LAN IP running
`npm run dev` (and set `"cleartext": true` for http), then `npm run cap:sync`.
Do **not** commit that change.

## Regenerating

If the native project ever needs to be rebuilt from scratch:

```bash
git rm -r ios
npx cap add ios
npx cap sync ios
git add ios
```

The generated `ios/.gitignore` keeps `project.pbxproj` and the Swift sources
tracked while ignoring `Pods/`, `DerivedData/`, `xcuserdata/`, and the
regenerated `App/App/public` + `App/App/capacitor.config.json`. Make sure
`ios/App/App.xcodeproj/project.pbxproj` stays committed — it's the file Xcode
needs to open the project.
