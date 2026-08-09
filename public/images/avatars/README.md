# Avatar art assets

Static, pre-generated avatar art for the Points store. These are **not** generated at
runtime — the catalog is fixed and everyone buys from the same set. Generate art once
per catalog drop (OpenArt), commit the PNGs here, and register each item in
`database/seeders/PointsStoreCatalogSeeder.php`.

## Layout

```
public/images/avatars/
  bases/<key>.png            # full base avatar, e.g. bases/fox.png
  bases/preview/<key>.png     # store-card preview variant
  hats/<key>.png              # Phase 2 accessory layers
  frames/<key>.png            # Phase 2
  backgrounds/<key>.png       # Phase 2
```

The seeder stores `asset` as `bases/<key>.png` and `preview_asset` as
`bases/preview/<key>.png`; `AvatarService::presentFor()` resolves them with
`asset('images/avatars/'.$path)`. If a file is missing, the `<Avatar>` component
falls back to a token-coloured initials circle (via `onError`), so the feature works
before art lands.

## Canvas / style spec (keep drops consistent)

- **Canvas:** 512×512, transparent background (PNG), subject centered.
- **Preview:** same art, may be tighter-cropped; ~256×256 is fine.
- **Style prompt:** use one shared prompt across a drop so all avatars read as a set
  (same rendering style, lighting, line weight, palette family). Record the exact
  prompt alongside the drop for reproducibility.

## Phase 1 catalog keys

`avatar_base_default` (free), `avatar_base_fox`, `avatar_base_owl`, `avatar_base_cat`,
`avatar_base_robot`, `avatar_base_dragon` → files `bases/{default,fox,owl,cat,robot,dragon}.png`.

## Drop log

### Drop 1 — 2026-08-09 (bases: default, fox, owl, cat)

- **Model:** OpenArt `kling-3-omni`, text2image, 1:1, 1K → 1024×1024 PNG, downscaled
  locally with `sips` to 512×512 (`bases/`) and 256×256 (`bases/preview/`).
- **Status:** `default`, `fox`, `owl`, `cat` committed. `robot` and `dragon` NOT yet
  generated (OpenArt credits exhausted) — they render the initials fallback until a
  future drop. Generate them with the same prompt template and `sips` pipeline.
- **Note:** output is opaque RGB (no alpha). Fine for bases because `<Avatar>` clips to
  a circle with `object-cover`. Accessory layers (Phase 2) need transparent PNGs.
- **Shared style suffix** (append to each subject description):

  > Cute kawaii chibi mascot character, centered, friendly big sparkly eyes, warm
  > smile, flat vector illustration, thick clean rounded outlines, smooth cel shading,
  > modern productivity-app avatar icon, mint-green and teal color accents (#4ACF91,
  > #5FDDE0), soft flat pale-mint circular background, clean, crisp, high detail, 1:1
  > square composition, no text, no watermark.

- **Per-subject leads:**
  - `default` — "A cheerful smiling green sprout mascot, a cute little plant sprite with two round leaves sprouting from a seed, symbol of growth and a fresh start."
  - `fox` — "A clever cute orange fox with a big fluffy white-tipped tail and perky ears, winking playfully."
  - `owl` — "An adorable round owl with big round glasses, wise and cozy night-owl vibe, small feather tufts and a tiny beak."
  - `cat` — "A calm content cat with closed happy eyes and a gentle smile, whiskers, small paws, cozy and relaxed."
  - `robot` (pending) — "A productivity-optimized robot buddy with a friendly rounded screen face and antenna."
  - `dragon` (pending) — "A legendary but cute baby dragon with tiny wings and a proud grin, for streak champions."
