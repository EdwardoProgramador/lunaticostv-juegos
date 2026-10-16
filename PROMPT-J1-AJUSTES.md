# GOAL: Adjustments to Game 1 (Level 1 + Level 2) on the LunaticosTv website

Context: Game 1 with Level 2 "El Cuarto del Cholo" is integrated and working in `/juegos/` (see `/juegos/README.md` and `/juegos/j1/INTEGRATION-N2.md`). The Claude Design source is in `/juego1-v2` (reference only, do not edit it). Use the existing models, textures, fonts and animation code; no new design source is needed.

Keep everything that already works. Same rules as before: do not change the site's own files (styles.css, script.js, shop.js, season-config.js, vercel.json, _redirects, page structure) without explaining first, prefix all game CSS, no globals, zero console errors, keep the performance optimizations and adaptive quality, ES/EN texts following the site language.

## CHANGES

### 1. Cache busting
In a normal browser I kept seeing the old game version because of cache. Add a single version number in `/juegos/config.js` (or boot) that is appended to every game file URL (scripts, styles, textures, fonts), so a new release is always loaded fresh. Document how to bump it.

### 2. Remove the visible rectangle around 3D elements (root fix)
The floating objects, the crystal fragments, the box and other 3D elements on the page still show a visible rectangle (canvas background or glow cut at the edges). Fix it at the root for EVERY 3D element drawn over the website:
- Fully transparent rendering, including when bloom or post-processing is used (the final output must keep alpha).
- Glows must fade out completely before reaching the canvas edges.
- Test over dark sections AND white/light sections of the site (for example the white cards on Proyectos).

### 3. Instructions at each stage
Short instruction texts in the brand title style that appear at key moments. They must not block the page: they fade in, stay a few seconds, and can be dismissed with a click or tap. ES/EN:
- After activating the moon: "Encuentra los 5 objetos del Cholo en todas las ventanas de la página."
- When the room opens with the 5 objects: "Coloca los objetos en el orden correcto. La libreta guarda la pista."
- After the crystal explodes: "Navega por todas las ventanas de la página para encontrar los fragmentos escondidos."
- Before the shadow puzzle (after the animation in change 4): "Gira los fragmentos hasta que su sombra encaje en el cuadro."
- After taking the key: "Ve a la caja en Inicio."

### 4. Fragments gathering animation before the shadow puzzle
When the player enters the room with all 5 fragments, do not show the puzzle immediately. First:
- The 5 fragments fly in one by one from different edges of the screen to the center, each with a glint and a soft copper trail.
- They gather into the loose floating cluster in front of the painting, with the candle light reacting.
- Then the instruction from change 3 appears, and the puzzle becomes interactive.

About 3-4 seconds, smooth and organic.

### 5. Fragment placement: hidden deeper, one per page except Inicio
- The 5 fragments go on: estudio, proyectos, talento, contacto and tienda. No fragment on Inicio (index).
- They must be truly hidden and spread across the WHOLE page height, so the player has to scroll. Not only at the top.
- For each page, define a pool of 3-4 hiding spots anchored to real page sections or elements (so they work on every screen size), placed at different scroll depths, including near the bottom. Each session picks one spot per page at random.
- Never inside the navigation, never covering buttons, links, forms or the shop's controls, never in places that cannot be reached.
- Still static, small, with the occasional glint. Render only when near the viewport.

### 6. Floating objects: distribution and timing
- The 5 floating objects can appear on any of the 6 pages: index, estudio, proyectos, talento, contacto and tienda. Each session assigns them at random, at most one object per page, so one page has no object. Keep an option in config to use a fixed mapping instead.
- They take too long to come back into view. Make their drift faster and keep them on screen most of the time: less time off-screen, quicker re-entry, a shorter cycle. Keep the motion smooth and organic.

### 7. Include the Tienda page
- The game now also loads on tienda.html: blinking moon, HUD, room button, floating object and fragment.
- It must NEVER interfere with shop.js or Shopify: do not block or overlap the cart, product buttons, checkout or any purchase flow. Check the shop's z-index values (cart drawer, modals) and stay below them.
- catalogo.html and any product, cart or checkout page stay excluded.

### 8. Completed state stays until reload
- After opening the box and viewing "Ver contenido exclusivo de CHOLO", the game must NOT reset or disappear.
- Until the page is reloaded:
  - The box stays visible and open on Inicio; clicking it reopens the final screen.
  - The room button stays.
  - The room shows its final state (crystal assembled, painting open).
- Remove the reset-on-close behavior. Reloading or a new visit still resets everything, as now.

## WORKFLOW
1. Commit the current state with git as "Juego 1 nivel 2 integrado (antes de ajustes)".
2. Do the changes in order, committing after each one with a clear message.
3. QA:
   - In a normal browser with cache disabled AND in the Cursor browser.
   - Play the whole game from the blinking moon to the box, on desktop and at 375/390 px.
   - Check that fragments require scrolling, that no rectangle appears over dark or white sections, that Tienda's cart and buttons still work, and that the completed state persists while navigating and resets on reload.
   - Zero console errors.
4. Final report in Spanish: what changed in each point, every file created or edited, how to bump the version number, how to edit hiding spots and the object mapping, and anything you could not verify.
