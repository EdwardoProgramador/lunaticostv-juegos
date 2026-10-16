// Juego 1 · Los objetos del Cholo (niveles 1 y 2) — orquesta el juego en cada página una vez activado (lo carga gate.js).
//   · Botón "El Cuarto del Cholo" en el menú, HUD de objetos, caja en Inicio.
//   · Nivel 1: el objeto de esta página (objectFor: reparto al azar de la partida o config.objects) flota hasta que se recolecta. El 5.º abre la secuencia 5/5 y el cuarto.
//   · Nivel 2: el fragmento de esta página (config.fragments) espera escondido; el cuarto se abre con el botón.
//   · El cuarto se prepara en segundo plano cuando se acerca su momento, para que abra al instante.
// Progreso: progress.js (dura la visita). Idioma: i18n.js. Al abrir la caja el juego queda completado (caja abierta en Inicio,
// botón del cuarto, cuarto en su estado final) hasta recargar la página o volver a entrar al sitio: cerrar la pantalla final
// ya no reinicia nada.
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [progress, { t, onLangChange }, { arm, disarm }, { createRoomButton }, { createHUD }, { prefersReduced }, { asset }] = await Promise.all([
  import(`./progress.js${V}`),
  import(`./i18n.js${V}`),
  import(`./gate.js${V}`),
  import(`./room-button.js${V}`),
  import(`./lib/hud.js${V}`),
  import(`./lib/dom.js${V}`),
  import(`./lib/paths.js${V}`),
]);

const CSS_URL = new URL(`./game.css${V}`, import.meta.url).href;
const PREFETCH_KEY = 'lunaticos_j1_prefetch';
let G = null; // el juego en marcha en esta página
let noticeMod = null;
const notice = () => (noticeMod = noticeMod || import(`./lib/notice.js${V}`)); // instrucciones de cada etapa

// Las fuentes del juego se declaran aquí (no en game.css) para que su URL lleve la versión, igual que todo lo demás.
const FONTS = [['lj1 Grenze Gotisch', 700, 'grenze-gotisch-700'], ['lj1 Barlow Condensed', 600, 'barlow-condensed-600'], ['lj1 Barlow Condensed', 700, 'barlow-condensed-700']];
function addFonts() {
  if (document.getElementById('lj1-fonts')) return;
  const st = document.createElement('style'); st.id = 'lj1-fonts';
  st.textContent = FONTS.map(([family, weight, file]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('${asset(`fonts/${file}.woff2`)}') format('woff2')}`).join('\n');
  document.head.appendChild(st);
}

function addStylesheet(href) {
  addFonts();
  const found = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href === href);
  if (found) return Promise.resolve();
  return new Promise((resolve) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = l.onerror = () => resolve();
    document.head.appendChild(l);
  });
}

// En Inicio, la intro de video tapa todo (html.has-intro): el juego espera a que termine y se desvanezca.
function afterIntro() {
  const html = document.documentElement;
  if (!html.classList.contains('has-intro')) return Promise.resolve();
  return new Promise((resolve) => {
    const mo = new MutationObserver(() => {
      if (!html.classList.contains('has-intro')) { mo.disconnect(); setTimeout(resolve, 1200); }
    });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
  });
}

const between = ([a, b]) => (a + Math.random() * Math.max(0, b - a)) * 1000;
const idle = (fn, timeout = 2000) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 300));

// Espera ms de tiempo "útil" (solo con la pestaña visible). .cancel() la corta (resuelve false).
function wait(ms) {
  let left = ms, last = performance.now(), done;
  const p = new Promise((r) => { done = r; });
  const id = setInterval(() => {
    const now = performance.now();
    if (!document.hidden) left -= now - last;
    last = now;
    if (left <= 0) { clearInterval(id); done(true); }
  }, 200);
  p.cancel = () => { clearInterval(id); done(false); };
  return p;
}

// Three.js y GSAP dejan una marca en window para detectar copias duplicadas (__THREE__, gsapVersions).
// El juego no deja globales: se quitan en cuanto las librerías ya se registraron (si no existían antes).
const LIB_MARKS = ['__THREE__', 'gsapVersions'];
const preexisting = LIB_MARKS.filter((k) => k in window);
function tidyGlobals() {
  for (const k of LIB_MARKS) if (!preexisting.includes(k) && k in window) { try { delete window[k]; } catch (e) { /* no configurable: se deja */ } }
}

// ───────────────────────────────────────────── arranque ─────────────────────────────────────────────
export async function start(ctx) {
  if (G) { sync(); return; }
  disarm();
  const g = G = { ...ctx, reduced: prefersReduced(), timers: [], offs: [] };
  const alive = () => G === g;
  await addStylesheet(CSS_URL);
  if (!alive()) return;
  await afterIntro();
  if (!alive()) return;

  g.button = createRoomButton({ onClick: () => openRoom(), onIntent: () => prepareRoom(), reduced: g.reduced });
  requestAnimationFrame(tidyGlobals);
  if (ctx.activated) {
    if (g.button) { g.button.setState('appear'); g.button.settle(buttonState()); }
    hud().reveal();
    notice().then((m) => { if (G === g) m.tip('tipObjects', { delay: 1.6 }); }).catch(g.log);
  } else if (g.button) g.button.settle(buttonState());

  if (g.page === 'index') mountBox(ctx.activated).catch(g.log);
  scheduleObject(ctx.activated).catch(g.log);
  mountFragment().catch(g.log);
  maybePrepare();
  handleHomeLinks();
  g.offs.push(onLangChange(relang));

  if (ctx.debugStage === 'room' || ctx.debugStage === 'puzzle') openRoom();
  else if (ctx.debugStage === 'altar') openRoom({ autoSolve: true });
}

function buttonState() {
  const st = progress.stage();
  return st === 'altar' || st === 'puzzle' || st === 'key' ? 'new' : 'normal';
}
function refreshButton() { if (G && G.button) G.button.settle(buttonState()); }

function hud() {
  const g = G;
  if (!g.hud) g.hud = createHUD({ collected: progress.load().objects, text: t(), reduced: g.reduced, holdMs: 3500 });
  return g.hud;
}

function relang(tx) {
  const g = G; if (!g) return;
  if (g.float) g.float.setLabel(tx.collect(tx.names[g.float.key]));
  if (g.hud) g.hud.setText(tx);
  if (g.fhud) g.fhud.setText();
  if (g.fragment) g.fragment.relang();
  if (g.box) g.box.relang();
  if (g.room) g.room.relang();
}

// ───────────────────────────────────────────── nivel 1 ─────────────────────────────────────────────
// Qué objeto flota en una página. objectMode 'random': la primera página de la partida reparte los 5 objetos entre 5 de
// objectPages (máx. uno por página; la que sobra se queda sin objeto) y el reparto se guarda en el progreso de la visita.
// 'fixed': config.objects.
function objectFor(page) {
  const c = G.config;
  if (c.objectMode !== 'random' || !Array.isArray(c.objectPages) || c.objectPages.length < progress.ITEMS.length) return (c.objects && c.objects[page]) || null;
  let map = progress.load().objMap;
  if (!Object.keys(map).length) {
    const pages = c.objectPages.slice();
    for (let i = pages.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pages[i], pages[j]] = [pages[j], pages[i]]; }
    map = Object.fromEntries(progress.ITEMS.map((k, i) => [pages[i], k]).filter(([p]) => p));
    progress.save({ objMap: map });
  }
  return map[page] || null;
}

async function scheduleObject(activatedNow) {
  const g = G, key = objectFor(g.page);
  if (!key || progress.stage() !== 'objects' || progress.load().objects.includes(key) || g.float || g.floatWait) return;
  g.floatWait = wait(activatedNow ? 1400 : between(g.config.objectDelay || [2, 4]));
  const ok = await g.floatWait; g.floatWait = null;
  if (!ok || G !== g || progress.load().objects.includes(key) || progress.stage() !== 'objects') return;
  const { createFloat } = await import(`./float.js${V}`);
  if (G !== g) return;
  const tx = t();
  const fl = await createFloat({ key, label: tx.collect(tx.names[key]), reduced: g.reduced, onCollect: () => collectObject(fl).catch(g.log) });
  fl.key = key;
  if (G !== g) { fl.destroy(); return; }
  g.float = fl;
  requestAnimationFrame(tidyGlobals);
}

async function collectObject(fl) {
  const g = G; if (!g || g.float !== fl) return;
  const key = fl.key, before = progress.load().objects.filter((k) => k !== key);
  const s = progress.collectObject(key), done = s.objects.length === progress.ITEMS.length;
  if (g.hud) g.hud.destroy();
  g.hud = createHUD({ collected: before, text: t(), reduced: g.reduced, holdMs: done ? Infinity : 3000 });
  g.hud.collect(key);
  // el efecto de recolección termina ~0.35 s después; luego se libera el renderer del objeto (uno por vista)
  setTimeout(() => { fl.destroy(); if (g.float === fl) g.float = null; }, 400);
  refreshButton();
  if (!done) { maybePrepare(); return; }
  prepareRoom();
  const { playComplete } = await import(`./complete.js${V}`);
  if (G !== g) return;
  const h = g.hud;
  playComplete({ hud: h, reduced: g.reduced, openRoom: () => openRoom({ instant: true }), onDone: () => { if (g.hud === h) g.hud = null; h.destroy(); } });
}

// ───────────────────────────────────────────── nivel 2 ─────────────────────────────────────────────
async function mountFragment() {
  const g = G, spots = g.config.fragments && g.config.fragments[g.page];
  const idx = Object.keys(g.config.fragments || {}).indexOf(g.page);
  if (!spots || !spots.length || idx < 0 || g.fragment || progress.stage() !== 'fragments' || progress.load().fragments.includes(idx)) return;
  // un escondite al azar por página y partida (se recuerda al volver a la página); los demás quedan de reserva
  let pick = progress.load().spots[g.page];
  if (!(pick < spots.length)) { pick = Math.floor(Math.random() * spots.length); progress.save({ spots: { ...progress.load().spots, [g.page]: pick } }); }
  const ordered = [spots[pick], ...spots.filter((_, i) => i !== pick)];
  const { createSiteFragment } = await import(`./fragments.js${V}`);
  if (G !== g || g.fragment || progress.load().fragments.includes(idx)) return;
  g.fragment = createSiteFragment({ index: idx, spots: ordered, reduced: g.reduced, onCollect: () => collectFragment(idx).catch(g.log) });
}

async function collectFragment(idx) {
  const g = G; if (!g) return;
  const before = progress.load().fragments.filter((i) => i !== idx);
  const s = progress.collectFragment(idx);
  const frag = g.fragment; g.fragment = null;
  if (frag) frag.collect().then(() => frag.destroy());
  const { createFragmentHUD } = await import(`./lib/fragment-hud.js${V}`);
  if (G !== g) return;
  if (g.fhud) g.fhud.destroy();
  g.fhud = createFragmentHUD({ collected: before, reduced: g.reduced });
  g.fhud.collect(idx);
  refreshButton();
  if (s.fragments.length === 5) prepareRoom(); else maybePrepare();
}

// ───────────────────────────────────────────── cuarto ─────────────────────────────────────────────
let roomMod = null;
function loadRoom() { return roomMod || (roomMod = import(`./room-ui.js${V}`)); }

function ensureRoom() {
  const g = G;
  return loadRoom().then((m) => {
    if (G !== g) return null;
    if (!g.room) {
      g.room = m.createRoomUI({
        reduced: g.reduced,
        onProgress: () => { refreshButton(); if (g.box && progress.load().key) g.box.armKey(); },
        onOpen: () => { if (g.box) g.box.pause('room'); if (g.float) g.float.pause(); },
        onClose: () => { if (g.box) g.box.resume('room'); if (g.float) g.float.resume(); mountFragment().catch(g.log); refreshButton(); },
      });
      requestAnimationFrame(tidyGlobals);
    }
    return g.room;
  });
}

// prepara el cuarto en segundo plano (modelos, texturas, shaders) para que abra al instante
function prepareRoom() {
  const g = G; if (!g || progress.stage() === 'off') return;
  ensureRoom().then((r) => r && r.prepare()).catch(g.log);
}

function openRoom(opts = {}) {
  const g = G; if (!g) return;
  ensureRoom().then((r) => r && r.open(opts)).catch(g.log);
}

// ¿se acerca el momento del cuarto? entonces se prepara ya; si no, solo se precalienta la caché HTTP (una vez por visita)
function maybePrepare() {
  const g = G, s = progress.load(), st = progress.stage(s);
  const myObj = objectFor(g.page);
  const myFrag = Object.keys(g.config.fragments || {}).indexOf(g.page);
  const soon = (st === 'objects' && s.objects.length === progress.ITEMS.length - 1 && myObj && !s.objects.includes(myObj))
    || st === 'altar' || st === 'puzzle' || st === 'key'
    || (st === 'fragments' && s.fragments.length === 4 && myFrag >= 0 && !s.fragments.includes(myFrag));
  if (soon) { idle(() => prepareRoom(), 3000); return; }
  if (st === 'box' || st === 'done') return;
  let done = false;
  try { done = sessionStorage.getItem(PREFETCH_KEY) === '1'; } catch (e) { /* sin almacenamiento */ }
  if (done) return;
  idle(() => {
    if (G !== g) return;
    loadRoom().then((m) => { m.prefetch(); try { sessionStorage.setItem(PREFETCH_KEY, '1'); } catch (e) { /* sin almacenamiento */ } }).catch(g.log);
  }, 6000);
}

// ───────────────────────────────────────────── caja (Inicio) ─────────────────────────────────────────────
async function mountBox(activatedNow) {
  const g = G;
  const { createBox } = await import(`./box.js${V}`);
  if (G !== g || g.box) return;
  g.box = createBox({
    link: g.config.rewardLink || '#', reduced: g.reduced,
    hasKey: () => progress.load().key,
    isDone: () => progress.load().done,
    onOpened: () => { progress.save({ done: true }); refreshButton(); if (g.room) g.room.sync(); },
  });
  if (activatedNow) g.box.appear();
  requestAnimationFrame(tidyGlobals);
}

// En Inicio, el logo (y cualquier enlace a "/") sube al principio sin recargar: recargar reiniciaría el juego.
function handleHomeLinks() {
  const g = G; if (g.page !== 'index') return;
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !/^\/(index(\.html)?)?$/.test(u.pathname) || u.hash || u.search) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: g.reduced ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', onClick);
  g.offs.push(() => document.removeEventListener('click', onClick));
}

// ───────────────────────────────────────────── sincronizar / reiniciar ─────────────────────────────────────────────
// Vuelta con atrás/adelante desde la caché del navegador: el progreso pudo cambiar en otra página.
export function sync() {
  const g = G; if (!g) return;
  const s = progress.load();
  if (!s.active) { teardown(); arm(); return; }
  if (g.float && s.objects.includes(g.float.key)) { g.float.destroy(); g.float = null; }
  if (g.fragment) {
    const idx = Object.keys(g.config.fragments || {}).indexOf(g.page);
    if (s.fragments.includes(idx) || progress.stage(s) !== 'fragments') { g.fragment.destroy(); g.fragment = null; }
  }
  if (g.hud) { g.hud.destroy(); g.hud = null; }
  if (g.box && s.done) g.box.setOpen(); else if (g.box && s.key) g.box.armKey();
  if (g.room) g.room.sync();
  refreshButton();
  scheduleObject(false).catch(g.log);
  mountFragment().catch(g.log);
  maybePrepare();
}

function teardown() {
  const g = G; if (!g) return;
  G = null;
  if (g.floatWait) g.floatWait.cancel();
  g.offs.forEach((off) => off());
  if (noticeMod) noticeMod.then((m) => m.hideTip()).catch(() => {});
  for (const k of ['float', 'fragment', 'hud', 'fhud', 'box', 'room', 'button']) {
    if (g[k]) { try { g[k].destroy(); } catch (e) { g.log(e); } g[k] = null; }
  }
}
