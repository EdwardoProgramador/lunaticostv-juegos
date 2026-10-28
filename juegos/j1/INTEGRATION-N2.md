# Juego 1 · Nivel 2 "El Cuarto del Cholo" — plan de integración

Fuente: el export de Claude Design de los niveles 1 + 2 (fuera de este proyecto). Aquí solo se portó el código
reutilizable de su `lib/` y los assets que de verdad se usan.

## Flujo en el sitio

1. Antes de activar: solo `boot.js` + `config.js` + `j1/gate.js` + `j1/progress.js` (pocos KB). La luna del logo
   (`svg.nav__mark`) brilla con un halo cálido y destella en naranja; un botón transparente encima de la luna (fuera del
   `<a>`, accesible con teclado) activa el juego con un sonido de campanas. El texto "LunáticosTv" sigue siendo el
   enlace a Inicio.
2. Al activar: se carga `j1/main.js` → HUD con 5 siluetas, botón "El Cuarto del Cholo" (se materializa), objeto de la
   página (mapeo original: index→cassette, estudio→micrófono, proyectos→libreta, talento→medalla, contacto→vela) y la
   caja cerrada solo en Inicio.
3. Nivel 1: el 5.º objeto dispara la secuencia 5/5 (HUD respira + destello, página 09) y abre el cuarto en
   "objetos listos". Sustituye a la recompensa automática del altar del export original (aquel `reward.js` se eliminó;
   el `reward.js` actual es otra cosa: el video y las fotos del final, punto 7).
4. Cuarto (overlay a pantalla completa, X y Esc cierran): hoja de la libreta como objeto propio de la bandeja, altar con
   fases lunares, orden correcto en `lib/level2-data.js`, error = tiembla y regresa, acierto = cristal sube y estalla,
   fragmentos salen de pantalla, "Encuentra los fragmentos".
5. Nivel 2: un fragmento estático por página (2D, SVG con la textura del cristal, sin WebGL), posiciones en
   `config.js`, con destello ocasional; al recogerlo aparece el HUD de fragmentos.
6. Con 5 fragmentos: aviso "Vuelve al Cuarto del Cholo" y etiqueta con flecha bajo el botón del cuarto (que pulsa)
   hasta entrar → puzzle de sombras (lunas gemelas) → el cristal se funde, se abre el cuadro, se toma la llave →
   "Ve a la caja en Inicio".
7. Caja en Inicio: sin llave tiembla ("Cerrada"); con llave gira y se abre → "Abriste la caja del Cholo" → video de
   Alonso Ortiz (automático) → carrusel de 9 fotos (`reward.js`, archivos en `assets/reward/`). Desde ahí el juego
   queda completado hasta recargar (ver `../README.md`).
8. Todo el recorrido tiene efectos de sonido sintetizados (`lib/sfx.js`; tabla en `../README.md` → "Sonido").

## Estado

`sessionStorage["lunaticos_j1_v2"]` (se borran `lunaticos_j1_v1` y `lunaticos_j1_last`):
`{ active, objects[], clue, altar, fragments[], puzzle, key }`. Recargar / entrar de nuevo = juego nuevo;
navegar entre páginas lo conserva (misma regla que el nivel 1). Sin checkpoints.

## Archivos (todo en `/juegos/j1/` + `config.js` + `boot.js`)

- `gate.js` (pre-activación), `main.js` (orquesta), `progress.js`, `i18n.js` (ES/EN), `game.css` (todo `.lj1-`).
- `float.js` (objeto flotante, se conserva), `complete.js` (5/5 → cuarto), `room-ui.js` (overlay + estados del cuarto),
  `room-button.js`, `fragments.js` (fragmentos en el sitio), `box.js` (caja + pantalla final).
- `lib/`: port del `lib/` del Design (objects, room, room-render, surfaces, altar, altar-order, tray, notebook-clue,
  crystal-shape, crystal, crystal-fx, shadow-puzzle, key, chest, hud, fragment-hud, loop, level2-data, dom).
  No se portan: páginas demo, site-header (sitio falso), room-page (cabecera de demo, Repetir, Escritorio/Móvil,
  selects), object-viewer, vendor.js (CDN/import map), cholo.css/reward-stage.css (estilos globales), `uploads/`.
- `vendor/`: Three 0.184.0 + GSAP 3.12.5 locales (ya estaban) + addons de post-proceso de Three 0.184.0
  (EffectComposer, RenderPass, UnrealBloomPass, OutputPass y sus dependencias), solo con el import de `three`
  reescrito a ruta relativa.

## Rendimiento

- Nada de Three/GSAP/fuentes/texturas antes de activar. Código del juego en idle.
- Se mantienen las optimizaciones del Design: WebP pre-horneados (set 512 en teléfonos y Baja), carga por etapas
  (cuarto → cristal → hierro de la llave), warm-up de shaders sin recompilar, luces fijas, calidad adaptativa
  Alta/Baja/Mínima que baja y sube, liberar GPU al cerrar el cuarto.
- El cuarto se prepara en segundo plano cuando se acerca su momento (falta 1 objeto o 1 fragmento, o ya hay algo que
  hacer dentro) y al pasar el puntero/enfocar el botón; la pantalla de la vela queda solo como respaldo. En las demás
  páginas solo se precalienta la caché HTTP en idle.
- Un renderer por vista, pixel ratio limitado por calidad, render en pausa con la pestaña oculta o la vista fuera de
  pantalla. `prefers-reduced-motion`: jugable, con fundidos en vez de movimientos grandes.

## Fases (un commit por fase)

a) port de lib + assets + fuentes · b) activador, botón del cuarto y caja · c) nivel 1 recableado ·
d) cuarto, altar, hoja, explosión · e) fragmentos + HUD · f) puzzle, llave, caja, final y reinicio · g) textos ES/EN ·
h) rendimiento, móvil, movimiento reducido · i) QA.

## Fuentes: glifos faltantes

Los subsets del Design no tenían → ² − ≈ ≤ ≥ ✓ €. Se regeneraron desde las fuentes originales (Google Fonts, OFL)
con los mismos caracteres + ² − ≈ ≤ ≥ € (La Belle Aurore: ² − €, no trae ≈ ≤ ≥). → y ✓ no existen en ninguna de las
tres familias: ningún texto del juego los usa (el "✓" del HUD se cambió por texto).
