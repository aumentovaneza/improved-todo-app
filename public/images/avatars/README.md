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
