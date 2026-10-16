// URL absoluta de un archivo de assets/ (el juego se sirve desde /juegos/j1/ y cualquier página lo puede cargar).
// Sin dependencias: lo usan también las piezas 2D (HUD, fragmentos) que no cargan Three.js.
const ASSETS = new URL('../assets/', import.meta.url).href;
export const asset = (p) => (/^[a-z][a-z0-9+.-]*:/i.test(p) ? p : ASSETS + p);
export const hudIcon = (key, sil = false) => asset(`hud/${key}${sil ? '-sil' : ''}.webp`);
