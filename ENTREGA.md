# Entrega · Juego 1 "Los objetos del Cholo" (niveles 1 y 2)

> **No publicar este archivo.** Ni este `ENTREGA.md`, ni `juegos/README.md`, ni `juegos/j1/INTEGRATION-N2.md`: explican el
> juego paso a paso y revelan la solución. Ver [el punto 4](#4-archivos-que-no-se-publican).

El juego vive entero en la carpeta `juegos/`. Para integrarlo en el proyecto original del sitio hay que hacer dos cosas:
copiar esa carpeta y añadir una línea a cada página.

## 1. Qué copiar

Copia la carpeta **`juegos/`** completa a la raíz del proyecto del sitio, al lado de `index.html`:

```
index.html
estudio.html
…
juegos/
  boot.js
  config.js
  j1/            ← todo el juego (código, estilos, texturas, fuentes, Three.js y GSAP locales)
```

Después **borra de la copia** `juegos/README.md` y `juegos/j1/INTEGRATION-N2.md` (o no los subas al servidor). El
juego no los necesita.

No hacen falta dependencias, build, `npm` ni reglas nuevas en `vercel.json` / `_redirects`: son archivos estáticos.
Las páginas tienen que servirse por `http(s)://` (los módulos JS no funcionan abriendo el HTML como archivo local).

## 2. La línea que se añade a cada página

En cada página va **una sola línea**, justo antes de `</body>` y después de `<script src="script.js"></script>`:

```html
<script type="module" src="juegos/boot.js"></script>
```

| Página | Dónde va | El juego en esa página |
| --- | --- | --- |
| `index.html` | después de `<script src="season-config.js"></script>` y `<script src="script.js"></script>`, antes de `</body>` | Sí: luna, HUD, botón del cuarto, objeto flotante (si le toca) y la caja final. Sin fragmento. |
| `estudio.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Sí: objeto (si le toca) + fragmento 1 |
| `proyectos.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Sí: objeto (si le toca) + fragmento 2 |
| `talento.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Sí: objeto (si le toca) + fragmento 3 |
| `contacto.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Sí: objeto (si le toca) + fragmento 4 |
| `tienda.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Sí: objeto (si le toca) + fragmento 5. Siempre por debajo del carrito de Shopify. |
| `alonso-ortiz.html` | después de `<script src="script.js"></script>`, antes de `</body>` | Solo luna, HUD y botón del cuarto (sin objeto ni fragmento). |
| `catalogo.html` | después de `<script src="script.js"></script>`, antes de `</body>` | **No.** El catálogo está excluido en `config.js`: solo se descargan `boot.js` y `config.js` (unos KB) y no pasa nada. Puedes omitir la línea aquí si prefieres. |

Así quedan, por ejemplo, las últimas líneas de `estudio.html`:

```html
<script src="script.js"></script>
<script type="module" src="juegos/boot.js"></script>
</body>
```

La ruta `juegos/boot.js` es relativa: funciona porque todas las páginas están en la raíz. Si alguna página nueva vive
en una subcarpeta, usa `/juegos/boot.js`.

### Nada más del sitio cambió

Comparado con el sitio original, **lo único distinto es esa línea en esas 8 páginas** (verificado con git contra el
commit "Base: sitio original"). `styles.css`, `script.js`, `shop.js`, `season-config.js`, `vercel.json`,
`_redirects`, las imágenes y la estructura de las páginas están exactamente igual. Todos los estilos del juego llevan
el prefijo `.lj1-` y el juego no crea variables globales.

## 3. Ajustes en `juegos/config.js`

Todo se controla desde `juegos/config.js`. Cada campo tiene su explicación en los comentarios del archivo.

### Encender / apagar el juego

```js
export const activeGame = 'j1';   // juego encendido
export const activeGame = null;   // juego apagado: el sitio queda como el original (solo se descargan boot.js y config.js)
```

Para quitar el juego de una página concreta sin tocar el HTML, sácala de `games.j1.pages`.

### Cambiar la versión en cada publicación

```js
export const version = '2026-10-16.2';
```

**Cada vez que publiques cualquier cambio dentro de `juegos/`, cambia este valor** (cualquier texto distinto vale;
por costumbre la fecha + un número: `'2026-10-17.1'`). Se añade como `?v=…` a todos los archivos del juego, así los
visitantes nunca se quedan con una versión vieja en la caché. `config.js` se descarga siempre fresco, así que no
hace falta nada más.

### Modo de prueba (debug)

```js
export const debug = false;   // producción: SIEMPRE así al publicar
```

Con `debug: false` el juego no lee ningún parámetro de la URL ni escribe nada en la consola. Para probar en local,
pon `true` y recarga. Así se activan:

- `?j1reset`: borra el progreso.
- `?j1stage=room | altar | fragments | puzzle | box | done`: empieza en esa etapa (cuarto con los objetos, explosión
  del cristal, buscar fragmentos, puzzle de sombras, ir a la caja, juego completado).
- `?calidad=alta | baja | minima`: fuerza la calidad gráfica.
- Los errores del juego se muestran en la consola.

Ejemplo: `http://localhost:8080/?j1stage=box`. Para seguir jugando desde ahí navega con los enlaces del sitio
(recargar reinicia el juego). **Vuelve a `false` antes de publicar.**

### Editar los escondites de los fragmentos

En `games.j1.fragments`, cada página tiene una lista de 3–4 escondites. Cada partida elige uno al azar por página.

```js
estudio: [
  { anchor: '.def-grid',    x: 96, y: 93, size: 50, rotate: 18 },
  { anchor: '.home-closer', x: 6,  y: 90, size: 52, rotate: -22 },
],
```

- `anchor`: selector CSS de una sección real de la página. El fragmento se coloca relativo a ella, así funciona en
  cualquier tamaño de pantalla.
- `x`, `y`: posición dentro de esa sección, en % de su ancho y alto (0 = izquierda/arriba, 100 = derecha/abajo).
- `size`: tamaño en px. `rotate`: giro en grados. `tuck` (opcional): `'top' | 'bottom' | 'left' | 'right'`, el
  fragmento se asoma por ese borde, como metido detrás.
- Para mover un escondite cambia `x`/`y` o el `anchor`. Para añadir uno, añade una línea; para quitarlo, bórrala.
- Repártelos a distintas alturas (incluido cerca del final) para que haya que hacer scroll.
- El juego nunca pone un fragmento bajo el menú, fuera de la página ni encima de enlaces, botones, formularios o
  controles de la tienda. Si el escondite elegido no sirve en esa pantalla, usa el siguiente de la lista.
- **Si el proyecto original tiene otras clases CSS** que las de esta copia (`.def-grid`, `.quote-band`, `.foot`…),
  revisa que los `anchor` existan. Si no existe ninguno, esa página se queda sin fragmento y el juego no se puede
  terminar.
- Para comprobarlos: `debug: true` y `?j1stage=fragments`.

### Cambiar el reparto de los objetos flotantes

Por defecto (`objectMode: 'random'`), cada partida reparte los 5 objetos al azar entre las páginas de `objectPages`
(index, estudio, proyectos, talento, contacto, tienda), como máximo uno por página. Para un reparto fijo:

```js
objectMode: 'fixed',
objects: {
  index: 'cassette',
  estudio: 'microphone',
  proyectos: 'notebook',
  talento: 'medallion',
  contacto: 'candle',
},
```

Objetos: `cassette`, `microphone`, `candle`, `notebook`, `medallion`, cada uno en una página distinta. Para sacar
una página del sorteo, quítala de `objectPages` (tienen que quedar al menos 5).

### Pendiente: el enlace del premio

```js
rewardLink: '#',
```

Es el destino del botón final "Ver contenido exclusivo de CHOLO". **Hoy es `'#'` (no hace nada): pon la URL real
antes de publicar.** Si es de otro dominio, se abre en una pestaña nueva.

## 4. Archivos que no se publican

Estos archivos son solo para quien mantiene el juego. **No deben subirse al servidor**, porque cualquiera podría
abrirlos en el navegador y ver la solución completa (orden del altar, escondites, atajos):

- `ENTREGA.md` (este archivo)
- `juegos/README.md`
- `juegos/j1/INTEGRATION-N2.md`

Guárdalos fuera de la carpeta que se publica (o en el repositorio, pero excluidos del deploy).

## Verificación hecha antes de la entrega

Con `debug: false`, en Chrome (sin ventana, caché desactivada) a 1440 px y 390 px, en las 8 páginas:

- Cero errores del juego en consola y red. El único aviso que da Chrome es del propio sitio (las imágenes del hero
  con `<link rel="preload">` en estudio, proyectos, contacto y tienda) y sale igual con el juego apagado.
- `?j1stage`, `?j1reset`, `?calidad` y `?j1debug` no hacen nada, ni al cargar ni navegando entre páginas.
- La luna activa el juego en todas las páginas del juego. En el catálogo el juego no carga.
- Prueba de control con `debug: true`: los atajos sí funcionan.
