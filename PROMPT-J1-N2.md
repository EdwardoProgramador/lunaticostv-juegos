# GOAL: Integrate Level 2 "El Cuarto del Cholo" into Game 1 on the LunaticosTv website

Fully working, polished, smooth on every device, and without breaking the website.

## CONTEXT

- This folder is a local copy of the LunaticosTv website: plain HTML/CSS/JS, no framework, deployed on Vercel. Never push from here.
- Game 1 Level 1 is already integrated and working: `/juegos/boot.js`, `/juegos/config.js`, `/juegos/j1/`, documented in `/juegos/README.md`. Read it first.
- Progress uses sessionStorage (`juegos/j1/progress.js`) and resets on reload, new visit or closing the tab, but survives navigation inside the site. KEEP this behavior for the whole game (levels 1 and 2). No checkpoints.
- The NEW source is the folder `/juego1-v2`: the Claude Design export with Level 1 + Level 2. Read its `README.md` first, including the performance log. Pages 00-19 are demos; `lib/` and `assets/` hold the real code and files.
- Port only the reusable code and the assets actually used. Do NOT port: demo pages, the mock website, demo toolbars, state selectors, "Repetir" buttons, desktop/mobile switches, the quality select (keep `?calidad=` as a debug option) or the `uploads/` folder.
- Leave `/juego1-v2` untouched as the reference source.
- Pending from Design (do it while porting): some trimmed fonts are missing characters (→ ² − ≈ ≤ ≥ ✓ €). Add them to the font files or replace them in the text. Do not port unused files, textures or code.

## THE COMPLETE GAME FLOW

1. **Activator:** the moon icon in the site logo (`svg.nav__mark`, `<use href="#mark">`) blinks softly every few seconds on every page where the game loads.
   - Until the game is activated in this session, clicking the MOON ICON activates the game instead of navigating. The text "LunáticosTv" must keep working as the normal link to Inicio.
   - If the icon and the text are inside the same link, separate the click target safely, without breaking the link, keyboard access or accessibility. Check `script.js` first for existing behavior on the logo or nav.
   - After activation the moon works normally again. If the visitor is already on Inicio, clicking the logo scrolls to the top WITHOUT reloading (a reload would reset the game).
2. **On activation:**
   - The objects HUD appears showing the 5 objects as black silhouettes.
   - The 5 floating objects appear, one per page (keep the current mapping). IMPORTANT change: objects now appear ONLY after activation.
   - The menu button "El Cuarto del Cholo" appears with its materialize animation.
   - The locked box appears on Inicio only.
3. **Room button:** desktop "El Cuarto del Cholo" in Grenze Gotisch with the brand gradient, next to the menu items. Mobile: "El Cuarto", visible next to the hamburger, never inside it. English: "Cholo's Room" / "Room". It pulses when there is something new to do in the room (all 5 objects or all 5 fragments collected). It opens the room as a full-screen overlay; the X button and Esc close it.
4. **Level 1:** collecting the 5th object plays the completion sequence (HUD breathing + flash, from page 09), which opens the room in the "objects ready" state. This REPLACES the old automatic altar reward currently in `/juegos/j1/`.
5. **Room:** works through its states as in the Design source: torn notebook clue page as its own tray item, altar with carved moon phases, placing objects in order (correct order in the level 2 text/data file), wrong order feedback, crystal rise and explosion, fragments flying off screen, hint "Encuentra los fragmentos".
6. **Level 2, fragments:** one crystal fragment per page (index, estudio, proyectos, talento, contacto).
   - STATIC, small, partly tucked into the layout, in different spots than the objects, with an occasional glint as a hint.
   - Never covering navigation, buttons, links or forms. Click/tap target at least 48 px.
   - Positions per page live in the config file so they are easy to change.
   - Collecting one shows the fragments HUD.
7. **Shadow puzzle:** with all 5 fragments, the room button pulses. In the room, the twin-moons shadow puzzle, then the crystal fuses, the painting opens, the player takes the key, and the hint reads "Ve a la caja en Inicio".
8. **Box on Inicio:**
   - Without the key: it shakes with "Cerrada".
   - With the key: the key turns, the lid opens and the button "Ver contenido exclusivo de CHOLO" appears. For now its target is a placeholder link in the config file ("#"); the real content (images + video) will be added later in a separate task.
   - When the player closes this final screen, the game resets: progress cleared and the moon blinks again, so it can be played again.

## STRUCTURE

- Everything stays in `/juegos/j1/` plus `/juegos/config.js` and `/juegos/boot.js`.
- Config must contain: `activeGame` ("j1" or null = nothing loads), object per page, fragment position per page, the reward link and the debug flags.
- Use a new versioned sessionStorage key (for example `lunaticos_j1_v2`) and clear the old one.
- All game texts in ES/EN following the site's language switch, using the site's own mechanism.
- Do not load the game (blinking moon included) on tienda.html, catalogo.html or any shop page.

## PERFORMANCE (must work well on powerful desktops, average laptops, iPhones and low-end Android)

- **Before activation the page must be as light as the original site:** only the tiny boot script and the blinking moon. No Three.js, GSAP, models, textures or fonts until the visitor activates the game.
- Keep all optimizations from the Design source: pre-baked WebP textures (512 px set on phones and Low), staged loading, shader warm-up, no light changes during play, adaptive quality High / Low / Minima that steps down AND up, disposing everything when the room closes.
- After activation, prepare the room in the background while the visitor plays Level 1, so it opens instantly. The candle loading screen is only a fallback.
- Load game code after page idle. One renderer per view, pixel ratio capped per quality level, pause rendering when the tab is hidden or nothing is visible.
- prefers-reduced-motion: keep the game playable, replace big motion with fades.
- Do not change `vercel.json`. If cache headers would help, write the recommendation in the report instead.

## DO NOT BREAK THE SITE

- Do not change `styles.css`, `script.js`, `shop.js`, `season-config.js`, `vercel.json`, `_redirects` or page structure. Explain any needed exception before doing it.
- Prefix all game CSS (`.lj1-`), never style global elements, check existing z-index values and stay below the site's own menus and modals.
- ES modules, no globals, zero console errors or warnings.

## DEBUG HELPERS (document them)

- `?j1reset`: clears progress.
- `?j1stage=room|altar|fragments|puzzle|box`: jumps to that stage with the needed items.
- `?calidad=alta|baja|minima`: forces a quality level.

## WORKFLOW

1. Commit the current state with git as "Juego 1 nivel 1 funcionando (antes de nivel 2)" (local only, no remote).
2. Write a short plan in `/juegos/j1/INTEGRATION-N2.md`.
3. Phases, committing after each one with a clear message:
   - (a) port lib and assets with cleanup and the font fix
   - (b) activator, room button and box
   - (c) Level 1 rewired: objects only after activation, completion opens the room
   - (d) room, altar, notebook clue, crystal explosion
   - (e) fragments on the site + fragments HUD
   - (f) shadow puzzle, key, box, final screen and reset
   - (g) ES/EN texts
   - (h) performance, mobile and reduced motion
   - (i) QA
4. **QA:** run `dev-server.mjs`. Play the whole game from the blinking moon to the box, on desktop and at 375/390 px widths. Test wrong altar orders, reloading (must reset), navigating between pages (must keep progress), switching language, and `?calidad=` levels. Set `activeGame: null` and confirm the site behaves exactly like the original. Zero console errors.
5. **Final report in Spanish:** what you built, every file created, edited or removed, how to turn the game on/off, how to change objects, fragment positions and the reward link, how to test each stage, and everything you could not verify (real phones, Safari).
