// Juego 1 · Los objetos del Cholo — punto de entrada (lo importa juegos/boot.js cuando la página
// ya cargó y el navegador está libre).
// Three.js, GSAP, el CSS y las fuentes solo se descargan si en esta página hay algo que mostrar.
// Depuración: ?j1reset borra el progreso · ?j1complete abre directo la recompensa (no cambia el progreso).
import * as progress from './progress.js';
import { t, onLangChange } from './i18n.js';

const CSS_URL = new URL('./game.css', import.meta.url).href;
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Grenze+Gotisch:wght@700&display=swap';

function addStylesheet(href) {
  const found = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href === href);
  if (found) return Promise.resolve();
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = l.onerror = () => resolve();
    document.head.appendChild(l);
  });
}

// En el inicio, la intro de video tapa todo (html.has-intro): el juego espera a que termine y se desvanezca.
function afterIntro() {
  const html = document.documentElement;
  if (!html.classList.contains('has-intro')) return Promise.resolve();
  return new Promise((resolve) => {
    const mo = new MutationObserver(() => {
      if (!html.classList.contains('has-intro')) { mo.disconnect(); setTimeout(resolve, 1400); }
    });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
  });
}

const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Three.js y GSAP dejan una marca en window para detectar copias duplicadas (__THREE__, gsapVersions).
// El juego no deja globales: se quitan en cuanto las librerías ya se registraron (si no existían antes).
const LIB_MARKS = ['__THREE__', 'gsapVersions'];
const preexisting = LIB_MARKS.filter((k) => k in window);
function tidyGlobals() {
  for (const k of LIB_MARKS) if (!preexisting.includes(k) && k in window) { try { delete window[k]; } catch (e) { /* no configurable: se deja */ } }
}

export async function start({ objectKey, config }) {
  const q = new URLSearchParams(location.search);
  if (q.has('j1reset')) progress.reset();
  const forceReward = q.has('j1complete');
  let collected = progress.load();
  if (!forceReward && (collected.includes(objectKey) || progress.isComplete(collected))) return; // nada que mostrar: no se descarga nada más

  await afterIntro();
  await Promise.all([addStylesheet(CSS_URL), addStylesheet(FONTS_URL)]);
  const reduced = prefersReduced();
  const link = config.rewardLink || '#';

  if (forceReward) {
    const { openReward } = await import('./reward.js');
    const r = openReward({ text: t(), link, reduced, onClose: () => off() });
    const off = onLangChange((tx) => r.setText(tx));
    requestAnimationFrame(tidyGlobals);
    return;
  }

  const [{ createFloat }, { createHUD }] = await Promise.all([import('./float.js'), import('./lib/hud.js')]);
  const isLast = progress.ITEMS.every((k) => k === objectKey || collected.includes(k));
  let graph = null, hud = null, reward = null, fl = null;

  const label = (tx) => tx.collect(tx.names[objectKey]);
  const off = onLangChange((tx) => {
    if (fl) fl.setLabel(label(tx));
    if (hud) hud.setText(tx);
    if (reward) reward.setText(tx);
  });

  async function onCollect() {
    const before = collected.slice();
    collected = progress.collect(objectKey);
    const done = progress.isComplete(collected);
    hud = createHUD({
      collected: before, text: t(), reduced, holdMs: done ? Infinity : 3000,
      onHidden: () => { if (!done && hud) { hud.destroy(); hud = null; off(); } },
    });
    hud.collect(objectKey);
    // el efecto de recolección termina ~0.35 s después; luego se libera el renderer del objeto
    const released = new Promise((resolve) => setTimeout(() => { fl.destroy({ keepShared: done && !!graph }); fl = null; resolve(); }, 400));
    if (!done) return;
    const { openReward } = await import('./reward.js');
    reward = openReward({
      text: t(), link, reduced, hud, graph, before: released,
      onClose: () => { hud = null; reward = null; off(); },
    });
  }

  fl = await createFloat({ key: objectKey, label: label(t()), reduced, onCollect });
  requestAnimationFrame(tidyGlobals);

  // Si este es el último objeto que falta, el altar se va armando en tiempo ocioso mientras flota.
  if (isLast) {
    const later = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));
    later(() => { if (fl) graph = import('./reward.js').then((m) => m.prepareGraph()); });
  }
}
