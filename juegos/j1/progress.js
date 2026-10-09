// Progreso de "Los objetos del Cholo" en sessionStorage ("lunaticos_j1_v1"): dura lo que dura la visita.
//   · Navegar entre páginas del sitio (enlaces, atrás/adelante) conserva el progreso: lo recolectado no reaparece.
//   · Recargar, entrar de nuevo (escribir la dirección, venir de otro sitio, un favorito) o cerrar la
//     pestaña lo reinicia: el juego vuelve a empezar en 0/5.
// Todo acceso va en try/catch: con el almacenamiento bloqueado el juego sigue funcionando, solo que el
// progreso dura lo que dura la página.
export const ITEMS = ['cassette', 'microphone', 'candle', 'notebook', 'medallion'];
const KEY = 'lunaticos_j1_v1';
let memory = { collected: [] };

function clean(list) {
  return ITEMS.filter((k) => Array.isArray(list) && list.includes(k));
}

// ¿Esta carga es una entrada nueva al sitio (o una recarga) y no un paso de una página a otra?
export function isFreshVisit() {
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const type = nav ? nav.type : 'navigate';
  if (type === 'reload') return true;
  if (type === 'back_forward') return false;
  try { return !document.referrer || new URL(document.referrer).origin !== location.origin; } catch (e) { return true; }
}

export function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    memory = { collected: raw ? clean(JSON.parse(raw).collected) : memory.collected };
  } catch (e) { /* almacenamiento no disponible o dato corrupto: seguimos con lo que hay en memoria */ }
  return memory.collected.slice();
}

export function collect(key) {
  if (!ITEMS.includes(key)) return load();
  const list = clean(load().concat(key));
  memory = { collected: list };
  try { sessionStorage.setItem(KEY, JSON.stringify({ collected: list, updated: Date.now() })); } catch (e) { /* solo en memoria */ }
  return list.slice();
}

export function reset() {
  memory = { collected: [] };
  try { sessionStorage.removeItem(KEY); } catch (e) { /* nada que limpiar */ }
  // la versión anterior guardaba el progreso para siempre en localStorage: se limpia para que no quede rastro
  try { localStorage.removeItem(KEY); } catch (e) { /* nada que limpiar */ }
}

export const isComplete = (list) => ITEMS.every((k) => list.includes(k));
