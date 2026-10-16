// Progreso de "Los objetos del Cholo" (niveles 1 y 2) en sessionStorage["lunaticos_j1_v2"]: dura lo que dura la visita.
//   · Navegar entre páginas del sitio (enlaces, atrás/adelante) lo conserva.
//   · Recargar, entrar de nuevo (escribir la dirección, venir de otro sitio, un favorito) o cerrar la pestaña lo reinicia:
//     la luna vuelve a parpadear y el juego empieza desde cero. No hay checkpoints.
// Todo acceso va en try/catch: con el almacenamiento bloqueado el juego sigue funcionando, solo que el progreso dura lo que
// dura la página. Sin dependencias (lo importa gate.js antes de activar el juego).
export const ITEMS = ['cassette', 'microphone', 'candle', 'notebook', 'medallion'];
const KEY = 'lunaticos_j1_v2';
const OLD = ['lunaticos_j1_v1', 'lunaticos_j1_last']; // versiones anteriores: se borran
const EMPTY = { active: false, objects: [], clue: false, altar: false, fragments: [], puzzle: false, key: false, done: false, tips: [], gathered: false, spots: {}, objMap: {} };
let memory = { ...EMPTY };

const dict = (o, ok) => (o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).filter(([k, v]) => /^[a-z0-9-]+$/.test(k) && ok(v))) : {});
const clean = (s) => ({
  active: !!s.active,
  objects: ITEMS.filter((k) => Array.isArray(s.objects) && s.objects.includes(k)),
  clue: !!s.clue,
  altar: !!s.altar,
  fragments: [0, 1, 2, 3, 4].filter((i) => Array.isArray(s.fragments) && s.fragments.includes(i)),
  objMap: dict(s.objMap, (v) => ITEMS.includes(v)), // página → objeto del nivel 1 (reparto al azar de esta partida)
  spots: dict(s.spots, (v) => Number.isInteger(v) && v >= 0 && v < 16), // página → escondite elegido para su fragmento
  gathered: !!s.gathered, // ya se vio la reunión de los fragmentos antes del puzzle
  puzzle: !!s.puzzle,
  key: !!s.key,
  done: !!s.done, // la caja ya se abrió: estado final hasta recargar
  tips: Array.isArray(s.tips) ? [...new Set(s.tips.filter((k) => typeof k === 'string'))].slice(0, 32) : [], // instrucciones ya mostradas (lib/notice.js)
});

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
    memory = raw ? clean(JSON.parse(raw)) : memory;
  } catch (e) { /* almacenamiento no disponible o dato corrupto: seguimos con lo que hay en memoria */ }
  return clean(memory);
}

export function save(patch) {
  const next = clean({ ...load(), ...patch });
  memory = next;
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...next, updated: Date.now() })); } catch (e) { /* solo en memoria */ }
  return clean(next);
}

export function collectObject(key) { const s = load(); return ITEMS.includes(key) ? save({ objects: s.objects.concat(key) }) : s; }
export function collectFragment(i) { const s = load(); return save({ fragments: s.fragments.concat(i) }); }

export function reset() {
  memory = { ...EMPTY };
  for (const k of [KEY, ...OLD]) {
    try { sessionStorage.removeItem(k); } catch (e) { /* nada que limpiar */ }
    try { localStorage.removeItem(k); } catch (e) { /* nada que limpiar */ }
  }
}

// Etapa actual: 'off' (sin activar) · 'objects' (nivel 1) · 'altar' (5 objetos, falta el altar) · 'fragments' (nivel 2) ·
// 'puzzle' (5 fragmentos, falta el puzzle de sombras) · 'key' (puzzle resuelto, falta tomar la llave) · 'box' (con la llave) ·
// 'done' (la caja ya se abrió: el juego queda completado hasta recargar la página o volver a entrar al sitio).
export function stage(s = load()) {
  if (!s.active) return 'off';
  if (s.objects.length < ITEMS.length) return 'objects';
  if (!s.altar) return 'altar';
  if (s.fragments.length < 5) return 'fragments';
  if (!s.puzzle) return 'puzzle';
  if (!s.key) return 'key';
  if (!s.done) return 'box';
  return 'done';
}

// Estados de depuración (?j1stage=…): lo mínimo necesario para empezar en esa etapa.
const ALL = ITEMS.slice(), FIVE = [0, 1, 2, 3, 4];
export const DEBUG_STAGES = {
  room: { active: true, objects: ALL },                                            // cuarto recién abierto: objetos listos
  altar: { active: true, objects: ALL, clue: true },                               // el altar armado: explosión del cristal
  fragments: { active: true, objects: ALL, clue: true, altar: true },              // buscar los 5 fragmentos
  puzzle: { active: true, objects: ALL, clue: true, altar: true, fragments: FIVE }, // puzzle de sombras
  box: { active: true, objects: ALL, clue: true, altar: true, fragments: FIVE, puzzle: true, key: true }, // ir a la caja
  done: { active: true, objects: ALL, clue: true, altar: true, fragments: FIVE, puzzle: true, key: true, done: true }, // completado
};
