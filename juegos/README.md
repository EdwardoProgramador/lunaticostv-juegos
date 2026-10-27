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
| `debug` | `false` en producción: ningún atajo de prueba en la URL y nada en la consola. `true` (solo para probar) activa los atajos de la sección Depuración y los errores del juego en la consola. |
| `activeGame` | `'j1'` activa "Los objetos del Cholo" (niveles 1 y 2). `null` lo apaga todo. |
| `games.j1.pages` | Páginas donde se carga el juego (luna, botón del cuarto, HUD). Incluye la portada de la Tienda (`tienda`); el catálogo y cualquier página de producto, carrito o pago no van aquí. |
| `games.j1.objectMode` | `'random'` (por defecto): cada partida reparte los 5 objetos entre las páginas de `objectPages`, como máximo uno por página. `'fixed'`: usa siempre `objects`. |
| `games.j1.objectPages` | Páginas que pueden tener objeto en modo aleatorio (hoy las 6: index, estudio, proyectos, talento, contacto, tienda; una se queda sin objeto). Mínimo 5. |
| `games.j1.objects` | Mapeo fijo página → objeto (`cassette`, `microphone`, `candle`, `notebook`, `medallion`), solo con `objectMode: 'fixed'`. |
| `games.j1.objectDelay` | Segundos `[mín, máx]` hasta que aparece el objeto al entrar a la página. |
| `games.j1.fragments` | Página → lista (pool) de escondites del fragmento de cristal (nivel 2). Un fragmento por página (Inicio no lleva). Cada partida elige un escondite al azar por página; si no cabe en esa pantalla o taparía algo interactivo, se usa el siguiente. Cada escondite: `anchor` (selector CSS), `x`/`y` (% dentro del ancla; pueden salir de 0–100), `size` (px), `rotate` (grados), `tuck` opcional (`top`/`bottom`/`left`/`right`: asoma por ese borde del ancla). El orden de las páginas es el número de fragmento. |
| `games.j1.rewardLink` | Opcional. El contenido exclusivo (video + fotos) se ve dentro del juego; con un destino aquí aparece además, debajo del carrusel, el botón "Ver contenido exclusivo de CHOLO". `'#'` = sin botón. Otro dominio = pestaña nueva. |

### Cómo editar los escondites de los fragmentos

En `config.js` → `games.j1.fragments`, cada página tiene su lista. Para mover un escondite cambia `x` / `y` (porcentaje
del ancho / alto del elemento `anchor`; valores cerca de 0 o 100 lo pegan a un borde, el fragmento nunca sale de la página)
o cambia `anchor` por otra sección (`.quote-band`, `.foot`…). Para añadir un escondite añade otra línea; para quitarlo,
bórrala. Repártelos a distintas alturas (incluido cerca del final) para que haya que hacer scroll. Pruébalos con
`debug: true` y `?j1stage=fragments` (cada partida nueva elige otro al azar). El juego nunca lo pone bajo el menú, fuera del documento ni
encima de enlaces, botones, formularios o controles de la tienda: si el escondite no sirve en una pantalla, usa el siguiente.

### Cómo fijar o cambiar el reparto de los objetos

Por defecto (`objectMode: 'random'`) el reparto cambia en cada partida. Para un reparto fijo pon `objectMode: 'fixed'` y
rellena `objects` con una página distinta para cada uno de los 5 objetos. Para sacar una página del sorteo, quítala de
`objectPages` (deben quedar al menos 5).

## Juego 1 · Los objetos del Cholo (`j1/`)

Flujo: la luna del logo parpadea → clic en la luna (no en el texto, que sigue llevando a Inicio) → HUD con 5 siluetas,
botón "El Cuarto del Cholo" en el menú, objetos repartidos por las páginas, caja en Inicio → 5.º objeto: secuencia 5/5 y se
abre el cuarto → hoja de la libreta y altar (orden en `j1/lib/level2-data.js`) → el cristal estalla → un fragmento escondido
en estudio, proyectos, talento, contacto y tienda → con 5, el botón pulsa → los fragmentos llegan desde los bordes y se
reúnen frente al cuadro → puzzle de sombras → llave → caja en Inicio → pantalla final. En cada etapa aparece una instrucción
corta (`lib/notice.js`, una vez por partida; un clic la cierra). Desde ahí el juego queda **completado hasta recargar**: la caja sigue abierta en Inicio
(un clic vuelve a mostrar la pantalla final), el botón del cuarto sigue y el cuarto muestra su estado final (cuadro
abierto, cristal entero). Recargar o volver a entrar al sitio lo reinicia todo.

| Archivo | Qué hace |
| --- | --- |
| `gate.js` | Antes de activar: luna que parpadea + botón accesible encima de la luna. Atajos de depuración (solo con `debug: true`). |
| `progress.js` | Progreso en `sessionStorage["lunaticos_j1_v2"]` (borra `v1`). Dura la visita: navegar lo conserva; recargar, volver a entrar o cerrar la pestaña lo reinicia. Sin checkpoints. |
| `main.js` | Orquesta una página: botón, HUD, reparto y objeto de la página, fragmento (escondite al azar), caja, preparación del cuarto, atrás/adelante. |
| `i18n.js` | Todos los textos ES/EN. Sigue `<html lang>` / `ltv:languagechange` del sitio. |
| `room-button.js` | Botón del cuarto: escritorio al final de los enlaces; ≤960 px junto a la hamburguesa (nunca dentro); nombre corto en 961–1040 px y ≤640 px; en <375 px cuelga bajo la barra. Pulsa cuando hay algo que hacer en el cuarto. Con los 5 fragmentos, hasta volver a entrar al cuarto, cuelga debajo la etiqueta "Vuelve al cuarto" con flecha (y en cada página aparece el aviso `tipRoom`). |
| `float.js` | Objeto flotante del nivel 1: se desliza (~2 s) a un punto libre nuevo cada 2.5–4.5 s; esquiva enlaces, botones, formularios y la tienda; si no hay hueco espera atenuado sin recibir clics. Lienzo con máscara radial: sin bordes visibles. |
| `complete.js` | Secuencia 5/5 → abre el cuarto. |
| `room-ui.js` | El cuarto a pantalla completa (X y Esc cierran) y sus estados según el progreso. |
| `fragments.js` | Fragmento de cristal escondido en la página (SVG 2D, sin WebGL). Solo se dibuja cerca de la pantalla. |
| `box.js` | Caja en Inicio y pantalla final. Abierta, se queda abierta hasta recargar; un clic vuelve a mostrar la pantalla final. |
| `reward.js` | Contenido exclusivo de la pantalla final: el video de Alonso Ortiz se reproduce solo (si el navegador no deja sonar, arranca en silencio con "Activar sonido"; "Saltar video" va a las fotos) y luego un carrusel de 5 fotos (deslizar, arrastrar, flechas, puntos, teclado). El video empieza a descargarse en el clic que abre la caja, nunca antes. |
| `game.css` | Todos los estilos, prefijo `.lj1-` (las `@font-face` las declara `main.js`, con `?v=`). Capas: fragmento 40, caja 44, objeto 45, HUD 85, instrucciones 86 (debajo del menú del sitio y del carrito 900); cuarto 1050, secuencia 5/5 1060, pantalla final 1070 (pantalla completa, debajo del fondo/cajón del carrito 1099/1100 y de la intro de video). |
| `lib/` | Modelos, cuarto, render, superficies, altar, bandeja, hoja, cristal, puzzle + reunión de fragmentos, llave, caja, HUDs, `notice.js` (instrucciones), `sfx.js` (efectos de sonido) y `debug.js` (interruptor de los atajos de prueba). |
| `vendor/` | `three-0.184.0/` (Three.js + addons de post-proceso) y `gsap-3.12.5/`, servidos desde el sitio, sin modificar (en los addons solo cambia la ruta del import de `three`). La carpeta lleva la versión de la librería. |
| `assets/` | Texturas WebP (1024 y 512 px), iconos del HUD, icono de la llave, fuentes WOFF2 recortadas. `reward/`: el contenido exclusivo (ver abajo). |

### Contenido exclusivo (`j1/assets/reward/`)

| Archivo | Formato |
| --- | --- |
| `video.mp4` | H.264 + AAC, 720×1280 (vertical), `faststart` (empieza a sonar antes de bajar entero), ~3 MB. |
| `poster.jpg` | Primer cuadro del video, mientras carga. |
| `foto-1…5-800.avif`, `foto-1…5-1200.avif` | Las fotos en AVIF (el navegador elige el tamaño según la pantalla). |
| `foto-1…5-1200.jpg` | Respaldo JPEG para navegadores sin AVIF. |

Para cambiar el video o las fotos, deja los originales **fuera** de la carpeta del sitio (si no, se publican) y genera los
archivos con los mismos nombres. Desde la raíz del proyecto (`ffmpeg` + `sips` de macOS):

```sh
# video (vertical): H.264 720×1280, sonido AAC
ffmpeg -i original.mp4 -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 24 -profile:v high -level 4.0 \
  -maxrate 2000k -bufsize 4000k -c:a aac -b:a 112k -ac 2 -movflags +faststart -tag:v avc1 juegos/j1/assets/reward/video.mp4
ffmpeg -ss 0.6 -i juegos/j1/assets/reward/video.mp4 -frames:v 1 -q:v 4 juegos/j1/assets/reward/poster.jpg
# cada foto N (ffmpeg endereza las fotos que la cámara guardó giradas)
for w in 1200 800; do ffmpeg -i original.jpg -vf "scale=$w:-2:flags=lanczos" -q:v 1 /tmp/foto-$w.jpg
  sips -s format avif -s formatOptions 55 /tmp/foto-$w.jpg --out juegos/j1/assets/reward/foto-N-$w.avif; done
sips -s format jpeg -s formatOptions 78 /tmp/foto-1200.jpg --out juegos/j1/assets/reward/foto-N-1200.jpg
```

Después cambia `version` en `config.js`.

### Sonido (`lib/sfx.js`)

Todos los efectos se sintetizan en vivo con Web Audio: no hay archivos de audio (todo el sonido son ~16 KB de código, ~6 KB comprimido) y
cada efecto se dispara desde la línea de tiempo de su animación, así que siempre va sincronizado. El navegador solo deja
sonar después de un gesto: el clic en la luna crea el audio, y en cada página nueva se enciende con el primer clic, toque o
tecla (un efecto pedido antes, como el "pop" de un objeto que aparece nada más entrar, no suena; nunca suenan atrasados).
En iPhone, Web Audio respeta el interruptor de silencio.

| Momento | Efecto | Dónde se dispara |
| --- | --- | --- |
| Clic en la luna (aparece el botón del cuarto) | `start`: brillo que sube + campanas | `gate.js` |
| Aparece un objeto flotante | `pop` | `float.js` → `onAppear` (`main.js`) |
| Recoger un objeto | `collect`: campana de dos notas, más aguda con cada objeto | `float.js` → `onTap` (`main.js`) |
| 5/5 | `chain` ×5, `whoosh`, `heartbeat` ×3 (latidos), `confirm` grande | `complete.js` |
| Apoyar un objeto en el altar | `place` | `lib/altar-order.js` |
| Altar incorrecto / correcto | `thunder` / `chain` ×5 + `confirm` | `lib/altar-order.js` |
| El cristal sube y estalla | `rise`, `shatter` | `lib/crystal-fx.js` |
| Recoger un fragmento | `fragment` | `main.js` |
| Los fragmentos se reúnen | `whoosh` + `arrive` por fragmento | `lib/shadow-puzzle.js` |
| Puzzle resuelto / el cristal se une | `confirm` grande / `fuse` | `lib/shadow-puzzle.js`, `lib/crystal-fx.js` |
| El cristal entra al cuadro, el cuadro se abre, aparece la llave | `whoosh`, `impact`, `creak` (puerta que rechina), `sparkle` | `room-ui.js` |
| Tomar la llave | `key` | `room-ui.js` |
| Caja sin llave / abrir la caja | `locked` / `whoosh`, `lock`, `creak`, `sparkle` | `lib/chest.js` |
| Pantalla final | `reveal` | `box.js` |

Para ajustar un efecto (volumen, tono, duración), cambia sus números en `SFX` dentro de `lib/sfx.js`.

### Rendimiento

- Antes de activar: solo la puerta. Three, GSAP, CSS, fuentes y texturas llegan al activar (en idle).
- El cuarto se prepara en segundo plano cuando se acerca su momento (falta el último objeto o fragmento, o ya hay algo que
  hacer dentro) y al pasar el puntero o enfocar su botón; si se abre antes de estar listo, aparece la vela de carga.
- Calidad adaptativa Alta / Baja / Mínima (sube y baja según los cuadros por segundo), texturas de 512 px en teléfonos y en
  Baja/Mínima, carga por etapas, shaders compilados antes de mostrar, GPU liberada al cerrar el cuarto.
- Nada se dibuja con la pestaña oculta, fuera de pantalla o tapado por el cuarto.
- Todo lo 3D sobre el sitio es transparente de verdad: lienzos con alfa y máscara radial (los halos se apagan antes del
  borde) y el bloom del cuarto suma luz sin sumar opacidad.

### Depuración (solo con `debug: true` en `config.js`)

Con `debug: false` (producción) ninguno de estos parámetros hace nada y el juego no escribe en la consola.


- `?j1reset` — borra el progreso.
- `?j1stage=room` — 5 objetos: abre el cuarto con los objetos listos para el altar.
- `?j1stage=altar` — abre el cuarto, coloca los objetos en orden y lanza la explosión del cristal.
- `?j1stage=fragments` — altar resuelto: aparecen los fragmentos en las páginas.
- `?j1stage=puzzle` — 5 fragmentos: abre el cuarto en el puzzle de sombras.
- `?j1stage=box` — con la llave: ve a Inicio y toca la caja.
- `?j1stage=done` — juego completado: caja abierta en Inicio (tócala para ver el video y las fotos), cuarto en su estado final.
- `?calidad=alta|baja|minima` — fuerza la calidad gráfica (cuarto, objeto flotante y caja).
- Los errores del juego se muestran en la consola.

`?j1stage` se aplica en la página donde se escribe; para seguir jugando, navega con los enlaces del sitio (recargar reinicia).

Plan e historial de la integración del nivel 2: `j1/INTEGRATION-N2.md`.
