// HUD de objetos (port de juego1-v2/lib/hud.js): DOM + GSAP, sin framework.
//   const hud = createHUD({ collected: ['cassette'], text }); hud.collect('microphone');
// Entra deslizando, el objeto nuevo aparece con un parpadeo "glitch" y sale a los holdMs.
// holdMs: Infinity lo deja en pantalla (secuencia 5/5). Arriba a la derecha, debajo del nav del sitio;
// centrado arriba cuando el contenedor mide ≤ 640 px (container query en game.css).
import { gsap } from '../vendor/gsap.min.js';
import { ITEMS } from './level2-data.js';
import { hudIcon } from './paths.js';

export function navBottom() {
  const nav = document.querySelector('.nav, .site-header');
  const b = nav ? nav.getBoundingClientRect().bottom : 0;
  return b > 0 && b < innerHeight / 2 ? b : 0;
}

export function createHUD({ mount = document.body, holdMs = 3000, collected = [], reduced = false, text, onHidden }) {
  const root = document.createElement('div');
  root.className = 'lj1-scope lj1-hud-root';
  root.innerHTML = `<div class="lj1-hud" role="status" aria-live="polite">
    <div class="lj1-hud__head"><span class="lj1-hud__label"></span><span class="lj1-hud__count"><b>0</b><span>/5</span></span></div>
    <ol class="lj1-hud__slots">${ITEMS.map((k, i) => `<li class="lj1-hud__slot" data-i="${i}"><img class="lj1-hud__sil" src="${hudIcon(k, true)}" alt="" decoding="async"><img class="lj1-hud__col" src="${hudIcon(k)}" alt="" decoding="async"></li>`).join('')}</ol>
  </div>`;
  mount.appendChild(root);
  const panel = root.querySelector('.lj1-hud'), countEl = root.querySelector('.lj1-hud__count'), countN = countEl.querySelector('b');
  const label = root.querySelector('.lj1-hud__label');
  const slots = [...root.querySelectorAll('.lj1-hud__slot')];
  const got = ITEMS.map((k) => collected.includes(k));
  let visible = false, tl = null, hideCall = null;

  const paint = () => { slots.forEach((s, i) => s.classList.toggle('is-got', got[i])); countN.textContent = got.filter(Boolean).length; };
  const setText = (tx) => {
    label.textContent = tx.hudLabel;
    slots.forEach((s, i) => s.setAttribute('aria-label', `${tx.names[ITEMS[i]]}${got[i] ? `, ${tx.got}` : ''}`));
  };
  let tx = text;
  paint(); setText(tx);

  const isMobile = () => root.clientWidth <= 640;
  const offscreen = () => (isMobile() ? { xPercent: -50, x: 0, y: -(panel.offsetHeight + panel.offsetTop + 30) } : { xPercent: 0, y: 0, x: panel.offsetWidth + 40 });
  const place = () => { if (root.parentNode === document.body) root.style.setProperty('--lj1-hud-top', `${Math.round(navBottom() + 14)}px`); };

  function show(t) {
    if (visible) return;
    visible = true; place();
    if (reduced) t.set(panel, { visibility: 'visible', x: 0, y: 0, xPercent: isMobile() ? -50 : 0 }).fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
    else t.set(panel, { visibility: 'visible', opacity: 1 }).fromTo(panel, offscreen(), { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
  }
  function hide() {
    if (!visible) return;
    const done = () => { visible = false; gsap.set(panel, { visibility: 'hidden' }); if (onHidden) onHidden(); };
    if (reduced) gsap.to(panel, { opacity: 0, duration: 0.35, ease: 'power1.in', onComplete: done });
    else gsap.to(panel, { ...offscreen(), duration: 0.45, ease: 'power3.in', onComplete: done });
  }
  function flicker(t, i) {
    const s = slots[i], col = s.querySelector('.lj1-hud__col');
    s.classList.remove('is-got');
    t.call(() => { countN.textContent = got.filter(Boolean).length; });
    if (reduced) {
      t.fromTo(col, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .call(() => { s.classList.add('is-got'); gsap.set(col, { clearProps: 'opacity' }); });
      return;
    }
    t.fromTo(countEl, { scale: 1.4, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, '<');
    const R = gsap.utils.random;
    for (let k = 0; k < 4; k++) {
      const a = R(0, 40) | 0, b = R(0, 40) | 0;
      t.set(col, { opacity: 1, x: R(-4, 4), clipPath: k < 3 ? `inset(${a}% 0 ${b}% 0)` : 'inset(0% 0 0% 0)', filter: 'brightness(1.9) contrast(1.3)' }, `>+${R(0.04, 0.09).toFixed(3)}`)
        .set(s, { x: R(-2, 2) }, '<')
        .set(col, { opacity: 0, x: 0, filter: 'none' }, `>+${R(0.05, 0.1).toFixed(3)}`)
        .set(s, { x: 0 }, '<');
    }
    t.set(col, { opacity: 1, clipPath: 'inset(0% 0 0% 0)', filter: 'brightness(1.6)' }, '>+0.06')
      .to(col, { filter: 'brightness(1)', duration: 0.5 })
      .call(() => { s.classList.add('is-got'); gsap.set(col, { clearProps: 'opacity,filter,clipPath,x' }); }, null, '<');
  }
  function run(i) {
    if (tl) tl.progress(1).kill();
    if (hideCall) hideCall.kill();
    gsap.killTweensOf(panel);
    tl = gsap.timeline();
    if (!visible) { show(tl); tl.addLabel('in', '>-0.1'); } else tl.addLabel('in');
    tl.add(() => {}, 'in');
    flicker(tl, i);
    if (holdMs !== Infinity) tl.call(() => { hideCall = gsap.delayedCall(holdMs / 1000, hide); });
    return tl;
  }
  return {
    el: root, panel, slots, countEl,
    get visible() { return visible; },
    set holdMs(v) { holdMs = v; if (v === Infinity && hideCall) hideCall.kill(); },
    collect(key) { const i = ITEMS.indexOf(key); if (i < 0) return null; got[i] = true; setText(tx); return run(i); },
    // entra sin recolectar nada (al activar el juego: las 5 siluetas) y sale a los holdMs
    reveal() {
      if (tl) tl.progress(1).kill(); if (hideCall) hideCall.kill(); gsap.killTweensOf(panel);
      tl = gsap.timeline(); show(tl);
      if (holdMs !== Infinity) tl.call(() => { hideCall = gsap.delayedCall(holdMs / 1000, hide); });
      return tl;
    },
    hide,
    setText(next) { tx = next; setText(tx); },
    destroy() {
      if (tl) tl.kill(); if (hideCall) hideCall.kill();
      gsap.killTweensOf([panel, countEl, ...slots, ...root.querySelectorAll('img')]);
      root.remove();
    },
  };
}
