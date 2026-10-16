// HUD de fragmentos (nivel 2, port de juego1-v2/lib/fragment-hud.js): el contorno del cristal dividido en sus 5 piezas.
// Falta = contorno oscuro vacío · recogido = la pieza llena su lugar (textura del cristal) con brillo de cobre. Contador "2/5".
// Mismo comportamiento que el HUD de objetos (lib/hud.js): oculto, entra al recoger, sale a los ~3 s; debajo del nav del
// sitio, centrado arriba en ≤ 640 px. Sin Three.js (SVG + GSAP). Estilos en game.css (.lj1-fhud*).
//   const hud = createFragmentHUD({ collected: [0, 2], reduced });  hud.collect(1);
import { gsap } from '../vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ FRAGMENTS, svgPath, centroid }, { asset }, { navBottom }, { t }] = await Promise.all([
  import(`./crystal-shape.js${V}`),
  import(`./paths.js${V}`),
  import(`./hud.js${V}`),
  import(`../i18n.js${V}`),
]);

let uid = 0;
const VB = [250, 4, 640, 1072];

export function createFragmentHUD({ mount = document.body, holdMs = 3000, collected = [], reduced = false } = {}) {
  const root = document.createElement('div'), id = `lj1f${++uid}`, tex = asset('tex/512/crystal-face.webp');
  root.className = 'lj1-scope lj1-hud-root';
  const defs = FRAGMENTS.map((P, i) => `<clipPath id="${id}-${i}"><path d="${svgPath(P)}"/></clipPath>`).join('');
  const pieces = FRAGMENTS.map((P, i) => `<path class="lj1-fhud__empty" d="${svgPath(P)}"/>
    <g class="lj1-fhud__piece" data-i="${i}" clip-path="url(#${id}-${i})"><image href="${tex}" x="0" y="0" width="1092" height="1092"/><rect x="0" y="0" width="1092" height="1092" fill="#ff8a3c" opacity=".14"/></g>
    <path class="lj1-fhud__edge" d="${svgPath(P)}"/>`).join('');
  root.innerHTML = `<div class="lj1-fhud" role="status" aria-live="polite">
    <div class="lj1-fhud__gem"><svg viewBox="${VB.join(' ')}" aria-hidden="true" focusable="false"><defs>${defs}</defs>${pieces}</svg></div>
    <div class="lj1-fhud__info"><span class="lj1-fhud__label"></span><span class="lj1-fhud__count"><b>0</b><span>/5</span></span><span class="lj1-fhud__pips">${'<i></i>'.repeat(5)}</span></div>
  </div>`;
  mount.appendChild(root);
  const panel = root.querySelector('.lj1-fhud'), gem = root.querySelector('.lj1-fhud__gem'), label = root.querySelector('.lj1-fhud__label');
  const countEl = root.querySelector('.lj1-fhud__count'), countN = countEl.querySelector('b');
  const piece = [...root.querySelectorAll('.lj1-fhud__piece')], edge = [...root.querySelectorAll('.lj1-fhud__edge')], pips = [...root.querySelectorAll('.lj1-fhud__pips i')];
  const got = FRAGMENTS.map((_, i) => collected.includes(i));
  let visible = false, tl = null, hideCall = null;

  const paint = () => {
    piece.forEach((p, i) => p.classList.toggle('is-got', got[i])); pips.forEach((p, i) => p.classList.toggle('is-got', got[i]));
    gem.classList.toggle('has-any', got.some(Boolean)); countN.textContent = got.filter(Boolean).length;
  };
  const setText = () => { label.textContent = t().fragmentsHud; };
  paint(); setText();

  const isMobile = () => root.clientWidth <= 640;
  const offscreen = () => (isMobile() ? { xPercent: -50, x: 0, y: -(panel.offsetHeight + panel.offsetTop + 30) } : { xPercent: 0, y: 0, x: panel.offsetWidth + 40 });
  const place = () => root.style.setProperty('--lj1-hud-top', `${Math.round(navBottom() + 14)}px`);
  function show(tt) {
    if (visible) return;
    visible = true; place();
    if (reduced) tt.set(panel, { visibility: 'visible', x: 0, y: 0, xPercent: isMobile() ? -50 : 0 }).fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
    else tt.set(panel, { visibility: 'visible', opacity: 1 }).fromTo(panel, offscreen(), { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
  }
  function hide() {
    if (!visible) return;
    const done = () => { visible = false; gsap.set(panel, { visibility: 'hidden' }); };
    if (reduced) gsap.to(panel, { opacity: 0, duration: 0.35, ease: 'power1.in', onComplete: done });
    else gsap.to(panel, { ...offscreen(), duration: 0.45, ease: 'power3.in', onComplete: done });
  }

  function glowIn(tt, i) {
    const p = piece[i], e = edge[i], [cx, cy] = centroid(FRAGMENTS[i]);
    p.classList.remove('is-got'); pips[i].classList.remove('is-got');
    if (reduced) {
      tt.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.5 })
        .call(() => { countN.textContent = got.filter(Boolean).length; pips[i].classList.add('is-got'); gem.classList.add('has-any'); p.classList.add('is-got'); gsap.set(p, { clearProps: 'opacity' }); });
      return;
    }
    const sx = gem.clientWidth / VB[2], gx = (cx - VB[0]) * sx, gy = (cy - VB[1]) * sx;
    tt.set(p, { opacity: 0 })
      .fromTo(e, { opacity: 0, strokeWidth: 22 }, { opacity: 1, strokeWidth: 9, duration: 0.35, ease: 'power2.out' })
      .fromTo(p, { opacity: 0, scale: 1.35, svgOrigin: `${cx} ${cy}`, filter: 'brightness(2.6)' }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }, '<0.1')
      .to(p, { filter: 'brightness(1)', duration: 0.6 }, '>-0.1')
      .call(() => {
        for (let k = 0; k < 12; k++) {
          const s = document.createElement('span'); s.className = 'lj1-fhud__spark'; gem.appendChild(s);
          const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 30;
          gsap.fromTo(s, { x: gx, y: gy, opacity: 1, scale: 0.6 + Math.random() }, { x: gx + Math.cos(a) * d, y: gy + Math.sin(a) * d, opacity: 0, scale: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => s.remove() });
        }
      }, null, '<-0.5')
      .call(() => { countN.textContent = got.filter(Boolean).length; pips[i].classList.add('is-got'); gem.classList.add('has-any'); }, null, '<')
      .fromTo(countEl, { scale: 1.4, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, '<')
      .to(e, { opacity: 0.85, duration: 0.5 }, '>-0.2')
      .call(() => { p.classList.add('is-got'); gsap.set([p, e], { clearProps: 'opacity,filter,strokeWidth' }); }, null, '>');
  }
  function run(i) {
    if (tl) tl.progress(1).kill();
    if (hideCall) hideCall.kill();
    gsap.killTweensOf(panel);
    tl = gsap.timeline();
    if (!visible) { show(tl); tl.addLabel('in', '>-0.1'); } else tl.addLabel('in');
    tl.add(() => {}, 'in');
    glowIn(tl, i);
    if (holdMs !== Infinity) tl.call(() => { hideCall = gsap.delayedCall(holdMs / 1000, hide); });
    return tl;
  }
  return {
    el: root,
    get collected() { return got.slice(); },
    collect(i) { if (i < 0 || i > 4) return null; got[i] = true; return run(i); },
    setText,
    destroy() {
      if (tl) tl.kill(); if (hideCall) hideCall.kill();
      gsap.killTweensOf([panel, countEl, ...piece, ...edge]);
      root.remove();
    },
  };
}
