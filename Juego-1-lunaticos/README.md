# Los objetos del Cholo · lib/

Every page loads `lib/cholo.css` and `lib/vendor.js` first. Nothing else is shared by copy-paste: if it's in two pages, it lives here.

| File | What it does | Used by |
| --- | --- | --- |
| `vendor.js` | Pins library versions in one place: Three.js 0.184.0 (import map + addons, with integrity hashes) and GSAP 3.12.5. | 00–09 |
| `cholo.css` | Brand tokens (colors, fonts via Google Fonts: Grenze Gotisch, Barlow Condensed), title, labels, buttons, page header, desktop/mobile switch (`.seg`, incl. keyboard focus ring). | 00–09 |
| `loop.js` | Background-tab keep-alive: `keepGsapAlive()` keeps GSAP running at real speed when the tab is hidden (one ticker per page; lag smoothing off while hidden, one catch-up tick on return); `runLoop(fn)` is the render loop and calls it too (dt capped at 50 ms visible, 1 s hidden). | 06, 09 directly; 00–05, 07–09 via `cholo-objects.js` |
| `cholo-objects.js` | The 5 3D models, shared materials (copper, wax, velvet, wood, mercury glass and worn silver for the candle…), renderer setup, environment map, warm key + purple rim lighting, glow sprites, flame, GLB export. Re-exports `runLoop` from `loop.js`. | 00, 01–05 (via object-viewer), 07, 08–09 (via altar-scene), altar.js |
| `object-viewer.js` | Object page shell: orbit view, 120/80 px previews, triangle/material count, intro animation, GLB download. | 01–05 |
| `hud.js` | Collection HUD (fonts from `cholo.css` `--f-ui`): slide in/out, glitch flicker per slot, 0–5 states, `holdMs: Infinity` to keep it on screen. | 06, 07, 09 |
| `altar.js` | Altar geometry, candles, smoke and the resting slot for each object. | altar-scene.js |
| `altar-scene.js` | The full altar reward sequence: scene, lights, camera framing (desktop + mobile fit), rise, objects flying in, title and CTA. | 08, 09 |
| `reward-stage.css` | Stage for the reward pages: mock site, dim overlay, canvas, title/CTA placement, phone frame and real-phone rules. | 08, 09 |

Page-only code (not shared, by design):
- 00 — style sheet layout and the copper sphere demo.
- 06 — HUD demo stage and the 0/5…5/5 states row.
- 07 — mock site, floating object, drift and collect effect.
- 09 — the 5/5 chain, move-to-center, breathing and the hand-off flash.

Assets: `assets/hud/` (HUD icons and silhouettes), textures referenced by `cholo-objects.js`.

Notes:
- Candle glass is thin-walled (`thickness: 0`, no attenuation). Volume attenuation is measured in world units, so it changed colour with display scale (the 03 viewer draws the candle ~10× real size, which turned it purple). Keep any glass tint in `color`/`map`.
- `crescentGeo` is mirrored in z (reversed winding); the candle runs it through `flipWinding` so the moon's front face renders. The altar crescents use it unchanged.
