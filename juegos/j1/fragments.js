// Nivel 2 · el fragmento de cristal escondido en la página. Estático, pequeño, metido en el diseño (config.fragments), con un
// destello ocasional como pista. 2D: SVG con la textura del cristal recortada por la forma del fragmento y el borde de cobre
// en los lados exteriores (sin WebGL: no añade un renderer a la página).
// Se usa el primer lugar de la lista cuyo ancla exista y cuyo área de toque (mín. 48 px) no pise nada interactivo; si ninguno
// sirve, busca un hueco libre alrededor del primer ancla visible. Se recoloca al cambiar el diseño (resize, imágenes, fuentes).
//   const f = createSiteFragment({ index, spots, reduced, onCollect });  f.collect() → Promise;  f.destroy()
import { gsap } from './vendor/gsap.min.js';
import { FRAGMENTS } from './lib/crystal-shape.js';
import { asset } from './lib/paths.js';
import { t } from './i18n.js';

const AVOID = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'label', 'summary', 'iframe', 'video[controls]', 'audio[controls]',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])', 'form', '.nav', '.site-header', '.lang-switch',
].join(',');
const HIT = 48;

// SVG del fragmento i: la textura del cristal (512 px) recortada por su polígono, borde de cobre y destello
function art(i, reduced) {
  const P = FRAGMENTS[i];
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  const pad = Math.max(w, h) * 0.06, S = Math.max(w, h) + pad * 2;
  const vb = [x0 + w / 2 - S / 2, y0 + h / 2 - S / 2, S, S].map((v) => v.toFixed(1)).join(' ');
  const poly = P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const n = P.length, outer = [], inner = [];
  for (let k = 0; k < n; k++) {
    const a = P[k], b = P[(k + 1) % n], seg = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    (a.outer && b.outer ? outer : inner).push(seg);
  }
  const id = `lj1fr${i}`, sw = S / 34, dur = 7 + i * 0.7, begin = (1.5 + i * 1.3).toFixed(1);
  const sweep = reduced ? ''
    : `<animateTransform attributeName="transform" type="translate" values="${-S} 0;${-S} 0;${S} 0;${S} 0" keyTimes="0;0.8;0.93;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;
  return `<svg viewBox="${vb}" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="${id}c"><polygon points="${poly}"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0.35"><stop offset="0.35" stop-color="#fff2e0" stop-opacity="0"/><stop offset="0.5" stop-color="#fff2e0" stop-opacity="0.85"/><stop offset="0.65" stop-color="#fff2e0" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2D2BC"/><stop offset="0.4" stop-color="#B8796A"/><stop offset="0.6" stop-color="#5a3a33"/><stop offset="1" stop-color="#B8796A"/></linearGradient>
    </defs>
    <polygon points="${poly}" fill="#0b0810"/>
    <g clip-path="url(#${id}c)">
      <image href="${asset('tex/512/crystal-face.webp')}" x="0" y="0" width="1092" height="1092"/>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#ff8a3c" opacity=".1"/>
      <g class="lj1-frag__glint"><rect x="${x0 - S * 0.2}" y="${y0 - S * 0.2}" width="${S * 1.4}" height="${S * 1.4}" fill="url(#${id}g)">${sweep}</rect></g>
    </g>
    <path d="${inner.join('')}" fill="none" stroke="#2a120b" stroke-width="${(sw * 0.9).toFixed(1)}" stroke-linecap="round" opacity=".85"/>
    <path d="${inner.join('')}" fill="none" stroke="#ffb676" stroke-width="${(sw * 0.3).toFixed(1)}" stroke-linecap="round" opacity=".7"/>
    <path d="${outer.join('')}" fill="none" stroke="url(#${id}r)" stroke-width="${(sw * 1.3).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function createSiteFragment({ index, spots = [], reduced = false, onCollect }) {
  const el = document.createElement('div');
  el.className = 'lj1-scope lj1-frag';
  el.innerHTML = `<div class="lj1-frag__clip"><div class="lj1-frag__art">${art(index, reduced)}</div></div><button type="button" class="lj1-frag__hit"></button>`;
  const clip = el.querySelector('.lj1-frag__clip'), artEl = el.querySelector('.lj1-frag__art'), hit = el.querySelector('.lj1-frag__hit');
  const glint = el.querySelector('.lj1-frag__glint');
  const relang = () => hit.setAttribute('aria-label', t().pickFragment);
  relang();
  document.body.appendChild(el);
  if (reduced) gsap.fromTo(glint, { opacity: 0 }, { opacity: 0.55, duration: 2.2, repeat: -1, yoyo: true, repeatDelay: 3, ease: 'sine.inOut' });
  else glint.style.opacity = '1';

  // ── colocación ──
  const obstacles = () => [...document.querySelectorAll(AVOID)].filter((n) => !el.contains(n) && !n.closest('.lj1-scope')).map((n) => {
    const r = n.getBoundingClientRect(); return r.width < 1 || r.height < 1 ? null : [r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY];
  }).filter(Boolean);
  // centro (documento), tamaño y recorte de un lugar; null si el ancla no está visible
  function resolve(spot, override) {
    const a = document.querySelector(spot.anchor); if (!a) return null;
    const r = a.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || getComputedStyle(a).visibility === 'hidden') return null;
    const size = spot.size || 64, x = override ? override.x : spot.x, y = override ? override.y : spot.y;
    const docW = document.documentElement.clientWidth;
    const cx = Math.min(docW - size / 2 - 4, Math.max(size / 2 + 4, r.left + scrollX + (r.width * x) / 100));
    const cy = r.top + scrollY + (r.height * y) / 100;
    // parte visible (asomado detrás de un borde del ancla): caja en coordenadas del documento
    const L = cx - size / 2, T = cy - size / 2, box = { l: L, t: T, r: L + size, b: T + size };
    const A = { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY };
    if (spot.tuck === 'bottom') box.t = Math.max(box.t, A.b);
    else if (spot.tuck === 'top') box.b = Math.min(box.b, A.t);
    else if (spot.tuck === 'left') box.r = Math.min(box.r, A.l);
    else if (spot.tuck === 'right') box.l = Math.max(box.l, A.r);
    if (box.r - box.l < size * 0.3 || box.b - box.t < size * 0.3) return null; // casi todo escondido: no se encontraría
    const hx = (box.l + box.r) / 2, hy = (box.t + box.b) / 2, hw = Math.max(HIT, box.r - box.l), hh = Math.max(HIT, box.b - box.t);
    return { cx, cy, size, rot: spot.rotate || 0, box, hit: [hx - hw / 2, hy - hh / 2, hx + hw / 2, hy + hh / 2] };
  }
  const free = (q, obs) => !obs.some((o) => q.hit[0] < o[2] + 6 && q.hit[2] > o[0] - 6 && q.hit[1] < o[3] + 6 && q.hit[3] > o[1] - 6);
  function choose() {
    const obs = obstacles();
    for (const s of spots) { const q = resolve(s); if (q && free(q, obs)) return q; }
    // ninguno libre: barrer alrededor del primer ancla visible
    for (const s of spots) {
      if (!resolve(s)) continue;
      for (const y of [s.y, 8, 50, 92, -4, 104]) for (const x of [s.x, 6, 94, 20, 80, 35, 65, 50]) {
        const q = resolve({ ...s, tuck: null }, { x, y }); if (q && free(q, obs)) return q;
      }
    }
    return null;
  }
  let placed = null;
  function place() {
    const q = choose(); placed = q;
    el.style.display = q ? '' : 'none';
    if (!q) return;
    el.style.setProperty('--lj1-fs', `${q.size}px`); el.style.setProperty('--lj1-fr', `${q.rot}deg`);
    el.style.transform = `translate(${q.cx.toFixed(1)}px,${q.cy.toFixed(1)}px)`;
    const L = q.cx - q.size / 2, T = q.cy - q.size / 2;
    const ins = [q.box.t - T, L + q.size - q.box.r, T + q.size - q.box.b, q.box.l - L].map((v) => `${Math.max(0, v).toFixed(1)}px`);
    clip.style.clipPath = `inset(${ins.join(' ')})`;
    Object.assign(hit.style, { left: `${(q.hit[0] - L).toFixed(1)}px`, top: `${(q.hit[1] - T).toFixed(1)}px`, width: `${(q.hit[2] - q.hit[0]).toFixed(1)}px`, height: `${(q.hit[3] - q.hit[1]).toFixed(1)}px` });
  }
  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); };
  place();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(schedule) : null;
  if (ro) ro.observe(document.body);
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

  // ── recoger ──
  let taken = false;
  hit.addEventListener('click', () => { if (!taken && placed && onCollect) onCollect(); });
  function burst() {
    for (let k = 0; k < 16; k++) {
      const s = document.createElement('span'); s.className = 'lj1-spark'; el.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
      gsap.fromTo(s, { x: 0, y: 0, scale: 0.6 + Math.random(), opacity: 1 }, { x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.55 + Math.random() * 0.35, ease: 'power2.out', onComplete: () => s.remove() });
    }
  }
  return {
    el, relang,
    collect() {
      taken = true; hit.disabled = true;
      return new Promise((resolveP) => {
        if (reduced) { gsap.to(el, { opacity: 0, duration: 0.45, onComplete: resolveP }); return; }
        burst();
        gsap.timeline({ onComplete: resolveP })
          .to(artEl, { scale: 1.3, filter: 'brightness(2)', duration: 0.16, ease: 'back.out(3)' })
          .to(artEl, { scale: 0, rotation: '+=140', duration: 0.42, ease: 'power3.in' })
          .to(el, { opacity: 0, duration: 0.2 }, '-=0.15');
      });
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      removeEventListener('resize', schedule); removeEventListener('load', schedule);
      gsap.killTweensOf([el, artEl, glint]);
      el.remove();
    },
  };
}
