# Juegos de LunáticosTv

Cada página con juego incluye una sola línea, antes de `</body>`:

```html
<script type="module" src="juegos/boot.js"></script>
```

`boot.js` lee `config.js` y, si hay juego activo para esa página, lo carga cuando la página ya terminó de cargar y el navegador está libre. Hoy la incluyen las 8 páginas: index, estudio, proyectos, talento, contacto, alonso-ortiz, tienda y catálogo.

## config.js

| Campo | Qué hace |
| --- | --- |
| `activeGame` | `'j1'` activa "Los objetos del Cholo". `null` apaga todo: solo se descargan `boot.js` y `config.js` (~2 KB) y el sitio queda igual al original. |
| `games.j1.pages` | Páginas donde aparecen objetos. En cualquiera puede salir cualquier objeto que falte. |
| `games.j1.timing` | Segundos `[mín, máx]`: `firstAppear` (primera aparición), `visibleFor` (cuánto se queda si nadie lo recolecta), `pauseBetween` (pausa hasta el siguiente), `afterCollect` (pausa tras recolectar). Solo cuenta el tiempo con la pestaña visible. |
| `games.j1.rewardLink` | Destino del botón "Ver contenido exclusivo". `'#'` = sin destino (el botón no hace nada). Si es de otro dominio, abre en pestaña nueva. |

## Juego 1 · Los objetos del Cholo (`j1/`)

- `main.js`: orquesta (rotación de objetos, progreso, intro de video del inicio, carga diferida, idioma). Un objeto a la vez; al cambiar de página evita repetir el último visto.
- `float.js`: objeto flotante y recolección. `reward.js`: secuencia 5/5 → altar.
- `lib/`: port de `Juego-1-lunaticos/lib` (modelos, materiales, luces, HUD, altar, loop).
- `game.css`: todo con prefijo `.lj1-`. Capas: objeto 45 (debajo de los menús del catálogo), HUD 85, recompensa 1050.
- `vendor/`: Three.js 0.184.0 (`three.module.min.js` + `three.core.min.js`, sin modificar) y GSAP 3.12.5 (empaquetado como un ESM, sin modificar). Se sirven desde el propio sitio y solo se descargan cuando va a aparecer un objeto (nunca después de completar 5/5).
- `assets/`: texturas e iconos del HUD en WebP.

Progreso: `sessionStorage["lunaticos_j1_v1"]`, dura la visita. Pasar de una página a otra del sitio (menú, enlaces, atrás) lo conserva; recargar, volver a entrar (escribir la dirección, un favorito, venir de otro sitio) o cerrar la pestaña reinicia el juego en 0/5. Idioma: sigue el selector del sitio (`ltv-lang` / evento `ltv:languagechange`).

Depuración (en cualquier página con juego):

- `?j1reset`: borra el progreso.
- `?j1complete`: abre directamente la recompensa (no cambia el progreso).
- `?j1debug`: muestra en consola cualquier error del juego.
