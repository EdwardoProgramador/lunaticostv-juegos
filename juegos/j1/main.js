// Juego 1 · Los objetos del Cholo — punto de entrada (lo importa juegos/boot.js cuando la página
// ya cargó y el navegador está libre).
// Rotación: en cada página puede salir cualquier objeto que falte. Uno a la vez; si nadie lo recolecta,
// se despide y, tras una pausa, llega otro distinto. Al cambiar de página se evita repetir el último visto.
// Three.js, GSAP, el CSS y las fuentes solo se descargan cuando de verdad va a aparecer un objeto.
// Progreso: dura la visita (ver progress.js). Recargar o volver a entrar reinicia el juego.
// Depuración: ?j1reset borra el progreso · ?j1complete abre directo la recompensa (no cambia el progreso).
import * as progress from './progress.js';
import { t, onLangChange } from './i18n.js';

const CSS_URL = new URL('./game.css', import.meta.url).href;
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Grenze+Gotisch:wght@700&display=swap';
const LAST_KEY = 'lunaticos_j1_last'; // último objeto mostrado (sessionStorage): la siguiente página empieza con otro
const DEFAULT_TIMING = { firstAppear: [3, 6], visibleFor: [25, 35], pauseBetween: [8, 14], afterCollect: [12, 20] };

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
const between = ([a, b]) => (a + Math.random() * Math.max(0, b - a)) * 1000;

// Espera ms de tiempo "útil": solo corre con la pestaña visible y mientras counts() sea verdadero.
// .cancel() la corta (resuelve false).
function wait(ms, counts = () => true) {
  let left = ms, last = performance.now(), id = 0, done;
  const p = new Promise((r) => { done = r; });
  id = setInterval(() => {
    const now = performance.now();
    if (!document.hidden && counts()) left -= now - last;
    last = now;
    if (left <= 0) { clearInterval(id); done(true); }
  }, 200);
  p.cancel = () => { clearInterval(id); done(false); };
  return p;
}

const readLast = () => { try { return sessionStorage.getItem(LAST_KEY); } catch (e) { return null; } };
const writeLast = (k) => { try { sessionStorage.setItem(LAST_KEY, k); } catch (e) { /* sin sessionStorage: solo se pierde la variedad entre páginas */ } };

// Three.js y GSAP dejan una marca en window para detectar copias duplicadas (__THREE__, gsapVersions).
// El juego no deja globales: se quitan en cuanto las librerías ya se registraron (si no existían antes).
const LIB_MARKS = ['__THREE__', 'gsapVersions'];
const preexisting = LIB_MARKS.filter((k) => k in window);
function tidyGlobals() {
  for (const k of LIB_MARKS) if (!preexisting.includes(k) && k in window) { try { delete window[k]; } catch (e) { /* no configurable: se deja */ } }
}

export async function start({ config }) {
  const q = new URLSearchParams(location.search);
  // recargar o entrar de nuevo al sitio = juego nuevo; pasar de una página a otra conserva el progreso
  if (q.has('j1reset') || progress.isFreshVisit()) progress.reset();
  const forceReward = q.has('j1complete');
  if (!forceReward && progress.isComplete(progress.load())) return; // nada que mostrar: no se descarga nada más

  const timing = { ...DEFAULT_TIMING, ...(config.timing || {}) };
  const link = config.rewardLink || '#';
  await afterIntro();

  if (forceReward) {
    await Promise.all([addStylesheet(CSS_URL), addStylesheet(FONTS_URL)]);
    const { openReward } = await import('./reward.js');
    const r = openReward({ text: t(), link, reduced: prefersReduced(), onClose: () => off() });
    const off = onLangChange((tx) => r.setText(tx));
    requestAnimationFrame(tidyGlobals);
    return;
  }

  // primera aparición: unos segundos después de que la página está lista
  if (!(await wait(between(timing.firstAppear)))) return;
  if (progress.isComplete(progress.load())) return; // se completó en otra pestaña mientras tanto
  await Promise.all([addStylesheet(CSS_URL), addStylesheet(FONTS_URL)]);
  const [{ createFloat }, { createHUD }] = await Promise.all([import('./float.js'), import('./lib/hud.js')]);
  const reduced = prefersReduced();

  let fl = null, key = null, hud = null, reward = null, graph = null, timer = null, finished = false;
  const label = (tx) => tx.collect(tx.names[key]);
  onLangChange((tx) => {
    if (fl) fl.setLabel(label(tx));
    if (hud) hud.setText(tx);
    if (reward) reward.setText(tx);
  });

  // siguiente objeto: cualquiera que falte, evitando repetir el último mostrado (en esta u otra página)
  function pickNext() {
    const left = progress.ITEMS.filter((k) => !progress.load().includes(k));
    if (!left.length) return null;
    const last = key || readLast();
    const pool = left.length > 1 ? left.filter((k) => k !== last) : left;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function show() {
    if (finished) return;
    key = pickNext();
    if (!key) return;
    writeLast(key);
    const isLast = progress.ITEMS.every((k) => k === key || progress.load().includes(k));
    fl = await createFloat({ key, label: label(t()), reduced, onCollect });
    requestAnimationFrame(tidyGlobals);
    // si es el último que falta, el altar se va armando en tiempo ocioso mientras flota
    if (isLast && !graph) {
      const later = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));
      later(() => { if (fl && !graph) graph = import('./reward.js').then((m) => m.prepareGraph()); });
    }
    // tiempo en pantalla: solo cuenta mientras se le ve flotando
    const current = fl;
    timer = wait(between(timing.visibleFor), () => current.shown);
    if (!(await timer) || fl !== current) return;
    // nadie lo recolectó: se despide y, tras una pausa, llega otro
    await current.leave();
    current.destroy({ keepShared: !!graph });
    if (fl === current) fl = null;
    timer = wait(between(timing.pauseBetween));
    if (await timer) show();
  }

  async function onCollect() {
    if (timer) timer.cancel();
    const current = fl, got = key;
    const before = progress.load().filter((k) => k !== got);
    const collected = progress.collect(got);
    const done = progress.isComplete(collected);
    const h = hud = createHUD({
      collected: before, text: t(), reduced, holdMs: done ? Infinity : 3000,
      onHidden: () => { if (!done) { h.destroy(); if (hud === h) hud = null; } },
    });
    h.collect(got);
    // el efecto de recolección termina ~0.35 s después; luego se libera el renderer del objeto
    const released = new Promise((resolve) => setTimeout(() => { current.destroy({ keepShared: done && !!graph }); if (fl === current) fl = null; resolve(); }, 400));
    if (done) {
      finished = true;
      const { openReward } = await import('./reward.js');
      reward = openReward({
        text: t(), link, reduced, hud: h, graph, before: released,
        onClose: () => { hud = null; reward = null; },
      });
      return;
    }
    await released;
    timer = wait(between(timing.afterCollect));
    if (await timer) show();
  }

  show();
}
