// URL absoluta de un archivo de assets/ (el juego se sirve desde /juegos/j1/ y cualquier página lo puede cargar), con la
// versión del juego (?v=…, de config.js → version) para que una versión nueva nunca use texturas, iconos o fuentes viejos
// de la caché. Sin dependencias: lo usan también las piezas 2D (HUD, fragmentos) que no cargan Three.js.
const ASSETS = new URL('../assets/', import.meta.url).href;
const V = new URL(import.meta.url).search;
export const asset = (p) => (/^[a-z][a-z0-9+.-]*:/i.test(p) ? p : ASSETS + p + V);
export const hudIcon = (key, sil = false) => asset(`hud/${key}${sil ? '-sil' : ''}.webp`);
