// Recompensa 5/5 (la parte reutilizable de "09 Completado 5/5" + "08 Altar"): el HUD se ilumina
// ranura por ranura, va al centro, respira tres veces y un destello de vela da paso al altar.
// Una sola capa a pantalla completa con un solo oscurecido: la cadena lo sube a 0.97 y el altar
// arranca "desde oscuro", así que nunca se oscurece dos veces.
import { gsap } from './vendor/gsap.min.js';
import { buildAltarGraph, createAltarScene } from './lib/altar-scene.js';

const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

const idle = () => new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 400 }) : setTimeout(r, 30)));
// Construye el altar por partes en tiempo ocioso (se llama mientras flota el último objeto).
export const prepareGraph = () => buildAltarGraph(idle);

// hud: HUD ya en pantalla con el 5.º objeto recién recolectado (null en ?j1complete).
// graph: promesa de prepareGraph() si ya se adelantó; si no, se construye aquí.
// before: promesa que se cumple cuando el objeto flotante liberó su renderer (un solo renderer por página).
export function openReward({ text, link, reduced = false, hud = null, graph = null, before = null, onClose }) {
  const returnFocus = document.activeElement;
  const root = document.createElement('div');
  root.className = 'lj1-scope lj1-reward';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'lj1-reward-title');
  root.innerHTML = `<div class="lj1-reward__dim"></div>
    <canvas class="lj1-reward__gl"></canvas>
    <div class="lj1-reward__glow"></div>
    <div class="lj1-reward__final"><h2 class="lj1-title" id="lj1-reward-title"></h2></div>
    <div class="lj1-reward__cta"><a class="lj1-btn"></a></div>
    <div class="lj1-reward__flash"></div>
    <button type="button" class="lj1-reward__close">${CLOSE_ICON}</button>`;
  const $ = (s) => root.querySelector(s);
  const dim = $('.lj1-reward__dim'), canvas = $('.lj1-reward__gl'), glow = $('.lj1-reward__glow'), flash = $('.lj1-reward__flash');
  const title = $('.lj1-title'), cta = $('.lj1-reward__cta'), btn = $('.lj1-btn'), close = $('.lj1-reward__close');

  btn.href = link || '#';
  try {
    const u = new URL(btn.href, location.href);
    if (u.origin !== location.origin) { btn.target = '_blank'; btn.rel = 'noopener'; }
  } catch (e) { /* href relativo raro: se queda como está */ }
  btn.addEventListener('click', (e) => { if (!link || link === '#') e.preventDefault(); });

  let altar = null, chain = null, closed = false, live = false;
  function setText(tx) {
    title.textContent = tx.title; title.setAttribute('data-text', tx.title);
    btn.textContent = tx.cta;
    close.setAttribute('aria-label', tx.close);
    if (hud) hud.setText(tx);
    if (altar) altar.frame(); // en móvil el encuadre depende del alto del título
  }
  setText(text);
  document.body.appendChild(root);

  // ── bloqueo de scroll (se restaura tal cual al cerrar) ──
  const html = document.documentElement;
  const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
  const hasBar = innerWidth > html.clientWidth;
  html.style.overflow = 'hidden';
  if (hasBar) html.style.scrollbarGutter = 'stable';
  const block = (e) => e.preventDefault();
  root.addEventListener('wheel', block, { passive: false });
  root.addEventListener('touchmove', block, { passive: false });

  // ── teclado: Esc cierra, Tab se queda dentro ──
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeReward(); return; }
    if (e.key === 'Tab') {
      const f = [close, btn].filter((n) => getComputedStyle(n).visibility !== 'hidden');
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  };
  document.addEventListener('keydown', onKey, true);
  close.addEventListener('click', () => closeReward());

  const altarReady = Promise.all([graph || buildAltarGraph(idle), before]).then(([g]) => {
    if (closed) return null;
    altar = createAltarScene({ graph: g, stage: root, canvas, title, cta, dim, reduced });
    return altar.ready.then(() => { live = true; return altar; });
  });

  function showClose(delay = 0) {
    gsap.to(close, { opacity: 1, duration: 0.5, delay, ease: 'power2.out' });
    close.focus({ preventScroll: true });
  }

  function startAltar(fromDark) {
    const tl = altar.play({ fromDark });
    showClose(reduced ? 0 : 0.6);
    return tl;
  }

  if (reduced || !hud) {
    // sin cadena: el altar entra con su propio oscurecido (o, con movimiento reducido, como un fundido simple)
    if (hud) gsap.to(hud.el, { opacity: 0, duration: 0.3 });
    if (reduced) gsap.set(root, { opacity: 0 });
    altarReady.then((a) => {
      if (!a || closed) return;
      startAltar(false);
      if (reduced) gsap.to(root, { opacity: 1, duration: 0.6, ease: 'power1.out' });
    });
  } else {
    // el HUD pasa a esta capa (encima del oscurecido, debajo del destello) sin moverse en pantalla
    root.insertBefore(hud.el, flash);
    const panel = hud.panel, countEl = hud.countEl, slots = hud.slots;
    slots.forEach((s) => { const f = document.createElement('span'); f.className = 'lj1-hud__sflash'; s.appendChild(f); });
    const sflash = slots.map((s) => s.querySelector('.lj1-hud__sflash')), imgs = slots.map((s) => s.querySelector('.lj1-hud__col'));
    gsap.set(flash, { opacity: 0, scale: 0.15 });
    let dx = 0, dy = 0, S = 1.5;
    const tl = chain = gsap.timeline();

    // cadena: las ranuras se encienden una por una (tras el parpadeo del 5.º objeto)
    const start = 1.05;
    slots.forEach((s, i) => {
      const at = start + i * 0.15;
      tl.fromTo(sflash[i], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.15, duration: 0.12, ease: 'power2.out' }, at)
        .to(sflash[i], { opacity: 0, scale: 0.8, duration: 0.32, ease: 'power2.in' }, at + 0.12)
        .fromTo(imgs[i], { filter: 'brightness(2.1)' }, { filter: 'brightness(1)', duration: 0.45, ease: 'power2.out' }, at);
    });
    const chainEnd = start + 4 * 0.15;
    tl.fromTo(countEl, { scale: 1.45, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, chainEnd);

    // al centro y más grande
    const mv = chainEnd + 0.12;
    tl.call(() => {
      const sr = root.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      dx = sr.left + sr.width / 2 - (pr.left + pr.width / 2);
      dy = sr.top + sr.height / 2 - (pr.top + pr.height / 2);
      S = Math.min(1.8, Math.max(1.12, (sr.width * 0.86) / pr.width), (sr.width * 0.94) / (1.14 * pr.width)); // el pico de la respiración cabe en pantalla
      const rr = hud.el.getBoundingClientRect();
      gsap.set(hud.el, { transformOrigin: `${pr.left + pr.width / 2 - rr.left}px ${pr.top + pr.height / 2 - rr.top}px` });
    }, null, mv - 0.01)
      .to(hud.el, { x: () => dx, y: () => dy, scale: () => S, duration: 0.5, ease: 'power3.inOut' }, mv)
      .to(dim, { opacity: 0.45, duration: 0.5, ease: 'power1.out' }, mv)
      .fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 0.35, scale: 0.8, duration: 0.5 }, mv);

    // respira ×3, el brillo crece cada vez
    const br = mv + 0.5, P = 0.36;
    [[1.07, 0.6, 1.1], [1.1, 0.8, 1.45], [1.14, 1, 1.9]].forEach(([k, go, gs], i) => {
      const at = br + i * P;
      tl.to(hud.el, { scale: () => S * k, filter: `brightness(${1 + i * 0.12})`, duration: P * 0.45, ease: 'sine.out' }, at)
        .to(glow, { opacity: go, scale: gs, duration: P * 0.45, ease: 'sine.out' }, at);
      if (i < 2) tl.to(hud.el, { scale: () => S, filter: 'brightness(1)', duration: P * 0.55, ease: 'sine.in' }, at + P * 0.45)
        .to(glow, { opacity: go * 0.55, scale: gs * 0.85, duration: P * 0.55, ease: 'sine.in' }, at + P * 0.45);
    });

    // último pulso: casi negro, destello de vela y entra el altar (si un equipo lento aún compila, espera aquí)
    const last = br + 2 * P;
    tl.to(dim, { opacity: 0.97, duration: 0.3, ease: 'power2.in' }, last)
      .call(() => { if (!live) { tl.pause(); altarReady.then((a) => { if (a && !closed) tl.resume(); }); } }, null, last + 0.07)
      .to(flash, { opacity: 1, scale: 1.6, duration: 0.24, ease: 'power2.out' }, last + 0.08)
      .call(() => altar.warm(), null, last + 0.2) // bajo el destello: el calentamiento de GPU no se nota
      .to([hud.el, glow], { opacity: 0, duration: 0.18 }, last + 0.2)
      .call(() => startAltar(true), null, last + 0.3)
      .to(flash, { opacity: 0, scale: 2.4, duration: 0.7, ease: 'power2.in' }, last + 0.32);
  }

  function closeReward() {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey, true);
    if (chain) chain.kill();
    gsap.to(root, {
      opacity: 0, duration: reduced ? 0.3 : 0.45, ease: 'power2.inOut', overwrite: true,
      onComplete: () => {
        if (altar) altar.dispose();
        else altarReady.then((a) => a && a.dispose());
        if (hud) hud.destroy();
        gsap.killTweensOf([dim, glow, flash, close, root]);
        root.remove();
        html.style.overflow = prev.overflow; html.style.scrollbarGutter = prev.gutter;
        if (returnFocus && returnFocus.isConnected && returnFocus.focus) returnFocus.focus({ preventScroll: true });
        onClose && onClose();
      },
    });
  }

  if (/[?&]j1debug\b/.test(location.search)) root.lj1Debug = { get altar() { return altar; }, get chain() { return chain; } };
  return { setText, close: closeReward, el: root };
}
