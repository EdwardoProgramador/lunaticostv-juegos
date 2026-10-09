// Progreso de "Los objetos del Cholo" en localStorage ("lunaticos_j1_v1").
// Todo acceso va en try/catch: en modo privado o con almacenamiento bloqueado el juego sigue
// funcionando, solo que el progreso dura lo que dura la página.
export const ITEMS = ['cassette', 'microphone', 'candle', 'notebook', 'medallion'];
const KEY = 'lunaticos_j1_v1';
let memory = { collected: [] };

function clean(list) {
  return ITEMS.filter((k) => Array.isArray(list) && list.includes(k));
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = { collected: clean(JSON.parse(raw).collected) };
  } catch (e) { /* almacenamiento no disponible o dato corrupto: seguimos con lo que hay en memoria */ }
  return memory.collected.slice();
}

export function collect(key) {
  if (!ITEMS.includes(key)) return load();
  const list = clean(load().concat(key));
  memory = { collected: list };
  try { localStorage.setItem(KEY, JSON.stringify({ collected: list, updated: Date.now() })); } catch (e) { /* solo en memoria */ }
  return list.slice();
}

export function reset() {
  memory = { collected: [] };
  try { localStorage.removeItem(KEY); } catch (e) { /* nada que limpiar */ }
}

export const isComplete = (list) => ITEMS.every((k) => list.includes(k));
