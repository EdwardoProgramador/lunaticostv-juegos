# Juegos de LunáticosTv

Cada página incluye una sola línea, antes de `</body>`:

```html
<script type="module" src="juegos/boot.js"></script>
```

`boot.js` lee `config.js`. Si hay juego activo y la página está en su lista, carga solo la "puerta" del juego (para el
Juego 1: `j1/gate.js` + `j1/progress.js`, unos 14 KB sin comprimir). El juego completo se descarga únicamente cuando el
visitante lo activa. Con `activeGame: null` solo se descargan `boot.js` y `config.js` y el sitio queda igual al original.

## Versión y caché

`config.js` → `version` es la versión publicada del juego. `boot.js` pide `config.js` siempre fresco y carga el juego con
`?v=<version>`; cada archivo del juego pasa ese mismo `?v=` a todo lo que carga (módulos, `game.css`, fuentes, texturas,
iconos). **Cada vez que publiques cambios en `/juegos/`, cambia `version`** (cualquier valor distinto; por costumbre
fecha + número, p. ej. `'2026-10-16.2'`) y el navegador descargará todo de nuevo. Las librerías de `vendor/` no usan
`?v=`: su carpeta lleva la versión de la librería (`three-0.184.0`, `gsap-3.12.5`) y su contenido nunca cambia.
`boot.js` no lleva versión (lo incluyen las páginas tal cual): no debería cambiar entre versiones del juego.

## config.js

| Campo | Qué hace |
| --- | --- |
| `version` | Versión del juego; se añade como `?v=` a todos sus archivos. Cámbiala en cada publicación. |
| `activeGame` | `'j1'` activa "Los objetos del Cholo" (niveles 1 y 2). `null` lo apaga todo. |
| `games.j1.pages` | Páginas donde se carga el juego (luna, botón del cuarto, HUD). Tienda y catálogo no van aquí. |
| `games.j1.objects` | Página → objeto del nivel 1: `cassette`, `microphone`, `candle`, `notebook`, `medallion`. |
| `games.j1.objectDelay` | Segundos `[mín, máx]` hasta que aparece el objeto al entrar a la página. |
| `games.j1.fragments` | Página → lista de escondites del fragmento de cristal (nivel 2). Se usa el primero que exista y no tape nada interactivo. Cada escondite: `anchor` (selector CSS), `x`/`y` (% dentro del ancla; pueden salir de 0–100), `size` (px), `rotate` (grados), `tuck` opcional (`top`/`bottom`/`left`/`right`: asoma por ese borde del ancla). El orden de las páginas es el número de fragmento. |
| `games.j1.rewardLink` | Destino del botón "Ver contenido exclusivo de CHOLO" de la caja. `'#'` = sin destino. Otro dominio = pestaña nueva. |
| `games.j1.debug` | `params`: acepta `?j1reset`, `?j1stage`, `?calidad`. `console`: muestra en consola los errores del juego (también con `?j1debug`). |

## Juego 1 · Los objetos del Cholo (`j1/`)

Flujo: la luna del logo parpadea → clic en la luna (no en el texto, que sigue llevando a Inicio) → HUD con 5 siluetas,
botón "El Cuarto del Cholo" en el menú, objeto de la página, caja en Inicio → 5.º objeto: secuencia 5/5 y se abre el cuarto
→ hoja de la libreta y altar (orden en `j1/lib/level2-data.js`) → el cristal estalla → un fragmento por página → con 5, el
botón pulsa → puzzle de sombras → llave → caja en Inicio → pantalla final. Desde ahí el juego queda **completado hasta recargar**: la caja sigue abierta en Inicio
(un clic vuelve a mostrar la pantalla final), el botón del cuarto sigue y el cuarto muestra su estado final (cuadro
abierto, cristal entero). Recargar o volver a entrar al sitio lo reinicia todo.

| Archivo | Qué hace |
| --- | --- |
| `gate.js` | Antes de activar: luna que parpadea + botón accesible encima de la luna. `?j1reset`, `?j1stage`. |
| `progress.js` | Progreso en `sessionStorage["lunaticos_j1_v2"]` (borra `v1`). Dura la visita: navegar lo conserva; recargar, volver a entrar o cerrar la pestaña lo reinicia. Sin checkpoints. |
| `main.js` | Orquesta una página: botón, HUD, objeto, fragmento, caja, preparación del cuarto, atrás/adelante, reinicio. |
| `i18n.js` | Todos los textos ES/EN. Sigue `<html lang>` / `ltv:languagechange` del sitio. |
| `room-button.js` | Botón del cuarto: escritorio al final de los enlaces; ≤960 px junto a la hamburguesa (nunca dentro); nombre corto en 961–1040 px y ≤640 px; en <375 px cuelga bajo la barra. Pulsa cuando hay algo que hacer en el cuarto. |
| `float.js` | Objeto flotante del nivel 1 (esquiva enlaces, botones y formularios). |
| `complete.js` | Secuencia 5/5 → abre el cuarto. |
| `room-ui.js` | El cuarto a pantalla completa (X y Esc cierran) y sus estados según el progreso. |
| `fragments.js` | Fragmento de cristal escondido en la página (SVG 2D, sin WebGL). |
| `box.js` | Caja en Inicio y pantalla final. |
| `game.css` | Todos los estilos, prefijo `.lj1-` (las `@font-face` las declara `main.js`, con `?v=`). Capas: fragmento 40, caja 44, objeto 45, HUD 85 (debajo del menú del sitio); cuarto 1050, secuencia 5/5 1060, pantalla final 1070 (pantalla completa, debajo de la intro de video). |
| `lib/` | Port de `/juego1-v2/lib` (modelos, cuarto, render, superficies, altar, bandeja, hoja, cristal, puzzle, llave, caja, HUDs). |
| `vendor/` | `three-0.184.0/` (Three.js + addons de post-proceso) y `gsap-3.12.5/`, servidos desde el sitio, sin modificar (en los addons solo cambia la ruta del import de `three`). La carpeta lleva la versión de la librería. |
| `assets/` | Texturas WebP (1024 y 512 px), iconos del HUD, icono de la llave, fuentes WOFF2 recortadas. |

### Rendimiento

- Antes de activar: solo la puerta. Three, GSAP, CSS, fuentes y texturas llegan al activar (en idle).
- El cuarto se prepara en segundo plano cuando se acerca su momento (falta el último objeto o fragmento, o ya hay algo que
  hacer dentro) y al pasar el puntero o enfocar su botón; si se abre antes de estar listo, aparece la vela de carga.
- Calidad adaptativa Alta / Baja / Mínima (sube y baja según los cuadros por segundo), texturas de 512 px en teléfonos y en
  Baja/Mínima, carga por etapas, shaders compilados antes de mostrar, GPU liberada al cerrar el cuarto.
- Nada se dibuja con la pestaña oculta, fuera de pantalla o tapado por el cuarto.

### Depuración (con `debug.params: true`)

- `?j1reset` — borra el progreso.
- `?j1stage=room` — 5 objetos: abre el cuarto con los objetos listos para el altar.
- `?j1stage=altar` — abre el cuarto, coloca los objetos en orden y lanza la explosión del cristal.
- `?j1stage=fragments` — altar resuelto: aparecen los fragmentos en las páginas.
- `?j1stage=puzzle` — 5 fragmentos: abre el cuarto en el puzzle de sombras.
- `?j1stage=box` — con la llave: ve a Inicio y toca la caja.
- `?j1stage=done` — juego completado: caja abierta en Inicio, cuarto en su estado final.
- `?calidad=alta|baja|minima` — fuerza la calidad del cuarto.
- `?j1debug` — errores del juego en consola.

`?j1stage` se aplica en la página donde se escribe; para seguir jugando, navega con los enlaces del sitio (recargar reinicia).

Plan e historial de la integración del nivel 2: `j1/INTEGRATION-N2.md`. Fuente original: `/juego1-v2` (no se usa en el sitio).
