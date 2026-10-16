// The clue: one aged notebook page (2D), pencil-and-ink sketches of the 5 objects scattered (not in order),
// each with a small drawn moon phase, and one handwritten line. Opens over the room with a page turn.
//   const clue = createClue({ mount });  clue.open({ tear });  clue.close();  clue.reset()
// First read (open({ tear: true })): the page lands on the notebook, tugs, and tears out along a jagged edge (stub stays in
// the notebook, paper shreds fly). From then on the page is its own item: clue.bind({ target, onTorn, onStashed }) lets
// altar-order.js send it to the tray (closing flies the page into its slot, reopening flies it out from there).
// Sketches are traced at runtime from the HUD renders (assets/hud/*.webp): edges → ink lines, shadows → pencil hatching.
// Port: textos de ../i18n.js (la línea manuscrita se redibuja al cambiar de idioma: relang()), estilos en game.css (.lj1-clue*),
// Esc lo maneja el cuarto (room-ui.js), la fuente manuscrita se registra con un nombre propio del juego.
import { gsap } from '../vendor/gsap.min.js';
import { t } from '../i18n.js';
import { MOON_PHASE, ITEMS } from './level2-data.js';
import { hudIcon } from './paths.js';

// Lit part of a waxing moon (lit side on the right), f = 0 new … 1 full. Also used by room.js for the carved altar moons.
export function moonLitPath(g, cx, cy, R, f) {
  g.beginPath();
  if (f <= 0) return;
  if (f >= 1) { g.arc(cx, cy, R, 0, Math.PI * 2); return; }
  g.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, false);
  const rx = R * Math.abs(1 - 2 * f);
  if (f < 0.5) g.ellipse(cx, cy, rx, R, 0, Math.PI / 2, -Math.PI / 2, true);
  else g.ellipse(cx, cy, rx, R, 0, Math.PI / 2, Math.PI * 1.5, false);
  g.closePath();
}

const FONT = "'lj1 La Belle Aurore', 'Segoe Script', cursive";
let fontLoad = null;
// the handwriting face is registered and downloaded only here, when the clue page is drawn (self-hosted, Spanish + English subset)
function fontReady() {
  if (!fontLoad) fontLoad = (async () => {
    if (typeof FontFace !== 'function' || !document.fonts) return;
    const f = new FontFace('lj1 La Belle Aurore', `url(${new URL('../assets/fonts/la-belle-aurore-400.woff2', import.meta.url).href}) format('woff2')`, { display: 'swap' });
    document.fonts.add(f);
    await Promise.race([f.load(), new Promise(r => setTimeout(r, 3000))]).catch(() => {});
  })();
  return fontLoad;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);

function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }

// HUD render → pencil sketch (transparent canvas, ink only)
function sketch(img, S) {
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d', { willReadFrequently: true });
  const k = Math.min(S / img.width, S / img.height); g.drawImage(img, (S - img.width * k) / 2, (S - img.height * k) / 2, img.width * k, img.height * k);
  const d = g.getImageData(0, 0, S, S), p = d.data, L = new Float32Array(S * S), A = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) { const a = p[i * 4 + 3] / 255; A[i] = a; L[i] = ((0.3 * p[i * 4] + 0.59 * p[i * 4 + 1] + 0.11 * p[i * 4 + 2]) / 255) * a + (1 - a); }
  const at = (x, y) => L[Math.min(S - 1, Math.max(0, y)) * S + Math.min(S - 1, Math.max(0, x))];
  const aa = (x, y) => A[Math.min(S - 1, Math.max(0, y)) * S + Math.min(S - 1, Math.max(0, x))];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
    const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
    const ex = aa(x + 1, y) - aa(x - 1, y), ey = aa(x, y + 1) - aa(x, y - 1);
    let ink = Math.min(1, Math.max(0, Math.hypot(gx, gy) * 1.6 - 0.18)) * 0.8 + Math.min(1, Math.hypot(ex, ey) * 1.4) * 0.9;
    if (A[i] > 0.2) {
      const dark = Math.max(0, 0.8 - L[i]);
      if ((x + y) % 7 < 1.5) ink += dark * 0.75;
      if (dark > 0.42 && (x - y + 1000) % 6 < 1.3) ink += dark * 0.6;
    }
    ink = Math.min(1, ink) * (0.72 + rnd() * 0.28);
    p[i * 4] = 44; p[i * 4 + 1] = 28; p[i * 4 + 2] = 34; p[i * 4 + 3] = ink * 235;
  }
  g.putImageData(d, 0, 0);
  return c;
}
function wobbleCircle(g, x, y, R, passes = 2) {
  for (let k = 0; k < passes; k++) {
    g.beginPath(); const n = 40, j = R * 0.035, ph = rnd() * 6;
    for (let i = 0; i <= n + 2; i++) { const a = ph + i / n * Math.PI * 2, r = R + (rnd() - 0.5) * j * 2; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
  }
}
function inkMoon(g, x, y, R, f) {
  const S = Math.ceil(R * 2 + 12), t = document.createElement('canvas'); t.width = t.height = S; const h = t.getContext('2d'), c = S / 2;
  h.save(); h.beginPath(); h.arc(c, c, R - 1, 0, Math.PI * 2); h.clip();
  h.strokeStyle = 'rgba(40,24,30,.85)'; h.lineWidth = 1.3;
  for (let i = -S; i < S * 2; i += 4.2) { h.beginPath(); h.moveTo(i, 0); h.lineTo(i - S, S); h.stroke(); }
  for (let i = -S; i < S * 2; i += 6) { h.beginPath(); h.moveTo(i, 0); h.lineTo(i + S, S); h.stroke(); }
  h.restore();
  h.globalCompositeOperation = 'destination-out'; moonLitPath(h, c, c, R + 1, f); if (f > 0) h.fill();
  h.globalCompositeOperation = 'source-over'; h.fillStyle = 'rgba(40,24,30,.35)';
  if (f > 0) for (let i = 0; i < 26 * f; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * R * 0.85; const px = c + Math.cos(a) * r, py = c + Math.sin(a) * r; h.save(); moonLitPath(h, c, c, R, f); h.clip(); h.beginPath(); h.arc(px, py, 1 + rnd() * 1.6, 0, 7); h.fill(); h.restore(); }
  g.drawImage(t, x - c, y - c);
  g.strokeStyle = 'rgba(36,22,28,.9)'; g.lineWidth = 1.8; wobbleCircle(g, x, y, R);
}

async function drawPage(W, H) {
  await fontReady();
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // torn edge (spine side straighter)
  g.beginPath();
  const edge = []; const step = 18;
  for (let x = 6; x <= W - 10; x += step) edge.push([x, 10 + rnd() * 12]);
  for (let y = 10; y <= H - 10; y += step) edge.push([W - 10 - rnd() * 14, y]);
  for (let x = W - 10; x >= 6; x -= step) edge.push([x, H - 10 - rnd() * 12]);
  for (let y = H - 10; y >= 10; y -= step) edge.push([4 + rnd() * 3, y]);
  edge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
  const base = g.createRadialGradient(W * 0.45, H * 0.42, 40, W / 2, H / 2, W * 0.85); base.addColorStop(0, '#e8cfab'); base.addColorStop(0.6, '#d6b48d'); base.addColorStop(1, '#a8805c');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const blot = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; };
  for (let i = 0; i < 40; i++) blot(rnd() * W, rnd() * H, 40 + rnd() * 160, rnd() < 0.5 ? '#8a6478' : '#8a5a3a', 0.05 + rnd() * 0.12);
  for (let i = 0; i < 5; i++) { const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 60; g.strokeStyle = 'rgba(120,80,56,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); blot(x, y, r, '#a07050', 0.08); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(110,70,44,${0.1 + rnd() * 0.3})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, rnd() * 2.2, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(255,240,220,.18)'; g.lineWidth = 0.7;
  for (let i = 0; i < 300; i++) { const x = rnd() * W, y = rnd() * H, a = rnd() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); g.stroke(); }
  g.strokeStyle = 'rgba(80,60,70,.12)'; g.lineWidth = 1;
  for (let y = 120; y < H - 60; y += 48) { g.beginPath(); g.moveTo(40, y + (rnd() - 0.5) * 2); g.lineTo(W - 40, y + (rnd() - 0.5) * 2); g.stroke(); }
  // burnt / aged edges
  const edgeShade = (x0, y0, x1, y1, len) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(70,36,20,.7)'); gr.addColorStop(len, 'rgba(70,36,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  edgeShade(0, 0, W, 0, 0.12); edgeShade(W, 0, 0, 0, 0.1); edgeShade(0, 0, 0, H, 0.08); edgeShade(0, H, 0, 0, 0.1);

  // sketches, scattered on purpose (reading order is NOT the altar order)
  const LAYOUT = {
    cassette: { x: 0.29, y: 0.21, s: 0.3, r: -0.08, mx: 0.13, my: 0.07 },
    medallion: { x: 0.72, y: 0.2, s: 0.26, r: 0.06, mx: -0.13, my: 0.1 },
    candle: { x: 0.7, y: 0.5, s: 0.26, r: -0.05, mx: -0.17, my: -0.05 },
    microphone: { x: 0.29, y: 0.53, s: 0.3, r: 0.12, mx: 0.15, my: 0.07 },
    notebook: { x: 0.56, y: 0.77, s: 0.31, r: -0.05, mx: -0.2, my: -0.02 },
  };
  const imgs = await Promise.all(ITEMS.map(key => loadImg(hudIcon(key))));
  ITEMS.map(key => ({ key })).forEach((it, i) => {
    const Lc = LAYOUT[it.key], img = imgs[i]; if (!img) return;
    const S = Math.round(Lc.s * W), sk = sketch(img, S);
    g.save(); g.translate(Lc.x * W, Lc.y * H); g.rotate(Lc.r); g.drawImage(sk, -S / 2, -S / 2); g.restore();
    inkMoon(g, (Lc.x + Lc.mx) * W, (Lc.y + Lc.my) * H, W * 0.048, MOON_PHASE[it.key]);
  });
  // the handwritten line
  g.save(); g.translate(W * 0.5, H * 0.93); g.rotate(-0.035);
  g.font = `${Math.round(W * 0.062)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(38,22,30,.88)'; g.fillText(t().clueLine, 0, 0);
  g.globalAlpha = 0.25; g.fillText(t().clueLine, 0.8, 0.6); g.restore();
  return c;
}

// the tear line (percent of the page): shared by the page and the stub so they fit exactly before the rip
const JAG = (() => { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const p = []; for (let i = 0; i <= 30; i++) p.push([5.2 + r() * 3.4 + (i % 2) * 0.8, i === 30 ? 100 : i / 30 * 100 + (i ? (r() - 0.5) * 2 : 0)]); return p; })();
const jagStr = JAG.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',');
const PAGE_CLIP = `polygon(${jagStr},100% 100%,100% 0%)`, STUB_CLIP = `polygon(0% 0%,${jagStr},0% 100%)`;

export function createClue({ mount, onClose } = {}) {
  const el = document.createElement('div'); el.className = 'lj1-clue'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', t().clueTitle);
  el.innerHTML = `<div class="lj1-clue-dim"></div><div class="lj1-clue-book"><div class="lj1-clue-cover"></div><div class="lj1-clue-stub"></div><div class="lj1-clue-page"><div class="lj1-clue-shade"></div></div></div>
    <button type="button" class="lj1-room-x" aria-label="${t().close}"></button>`;
  mount.appendChild(el);
  const book = el.querySelector('.lj1-clue-book'), pageEl = el.querySelector('.lj1-clue-page'), shade = el.querySelector('.lj1-clue-shade'), dim = el.querySelector('.lj1-clue-dim');
  const cover = el.querySelector('.lj1-clue-cover'), stub = el.querySelector('.lj1-clue-stub'), xBtn = el.querySelector('.lj1-room-x');
  let pageCv = null, icon = null, gen = 0;
  const render = () => { const my = ++gen; return drawPage(900, 1200).then(cv => {
    if (my !== gen) return pageCv; // otro cambio de idioma llegó antes
    if (pageCv) pageCv.remove(); stub.textContent = '';
    pageEl.insertBefore(cv, shade); pageCv = cv; if (torn) cv.style.clipPath = PAGE_CLIP;
    const sc = document.createElement('canvas'); sc.width = cv.width; sc.height = cv.height; sc.getContext('2d').drawImage(cv, 0, 0); sc.style.clipPath = STUB_CLIP; stub.appendChild(sc);
    // tray icon: the torn page, slightly turned
    const ic = document.createElement('canvas'); ic.width = ic.height = 128; const g = ic.getContext('2d');
    g.translate(64, 64); g.rotate(-0.14); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
    const h = 112, w = h * 0.75; g.beginPath(); JAG.forEach(([x, y], i) => { const px = -w / 2 + x / 100 * w, py = -h / 2 + y / 100 * h; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.lineTo(w / 2, h / 2); g.lineTo(w / 2, -h / 2); g.closePath();
    g.fillStyle = '#c9a47d'; g.fill(); g.save(); g.clip(); g.shadowColor = 'transparent'; g.drawImage(cv, -w / 2, -h / 2, w, h); g.restore();
    icon = ic.toDataURL('image/png');
    if (hooks.onIcon) hooks.onIcon(icon);
    return cv;
  }); };
  let tl = null, isOpen = false, torn = false, hooks = {};
  const ready = render();
  function size() {
    const W = mount.clientWidth, H = mount.clientHeight;
    const h = Math.max(200, Math.min(H - 110, (W * 0.84) * 4 / 3)), w = h * 3 / 4;
    Object.assign(book.style, { width: w + 'px', height: h + 'px', marginLeft: -w / 2 + 'px', marginTop: (-h / 2 + 4) + 'px' });
  }
  new ResizeObserver(size).observe(mount);
  const setTorn = v => { torn = v; if (pageCv) pageCv.style.clipPath = v ? PAGE_CLIP : ''; };
  // offset + scale from the book's centre to the tray slot (null if there is no target)
  function toTarget() {
    const t = hooks.target && hooks.target(); if (!t) return null;
    const r = book.getBoundingClientRect(), m = mount.getBoundingClientRect(), z = m.width / mount.offsetWidth || 1;
    gsap.set(book, { clearProps: 'transform' });
    const b = book.getBoundingClientRect();
    return { x: t.x - (b.left + b.width / 2 - m.left) / z, y: t.y - (b.top + b.height / 2 - m.top) / z, scale: 46 / (b.width / z || 1) };
  }
  function shreds() {
    for (let i = 0; i < 16; i++) {
      const [x, y] = JAG[Math.floor(Math.random() * JAG.length)], s = document.createElement('span'); s.className = 'lj1-clue-shred';
      Object.assign(s.style, { left: x + '%', top: y + '%' }); book.appendChild(s);
      gsap.fromTo(s, { x: 0, y: 0, rotation: Math.random() * 180, opacity: 1, scale: 0.6 + Math.random() }, { x: 20 + Math.random() * 70, y: 30 + Math.random() * 90, rotation: '+=' + (200 + Math.random() * 300), opacity: 0, duration: 0.9 + Math.random() * 0.6, ease: 'power1.in', onComplete: () => s.remove() });
    }
  }
  async function open({ tear = false } = {}) {
    await ready; size();
    if (tl) tl.kill(); isOpen = true; el.classList.add('is-open');
    gsap.set(book, { clearProps: 'transform' }); gsap.set(pageEl, { x: 0, y: 0, rotation: 0, scale: 1, rotateY: 0 });
    tear = tear && !torn;
    tl = gsap.timeline().fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0).fromTo(xBtn, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.6);
    if (tear) {
      cover.style.display = 'block'; stub.style.display = 'none'; setTorn(false);
      gsap.set([cover, stub], { x: 0, rotation: 0, opacity: 1 });
      tl.fromTo(cover, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, 0)
        .fromTo(pageEl, { rotateY: -118, x: -30, scale: 0.94 }, { rotateY: 0, x: 0, scale: 1, duration: 1.0, ease: 'power3.out' }, 0.05)
        .fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.15)
        // the page resists twice, then rips along the jagged line
        .call(() => { stub.style.display = 'block'; setTorn(true); hooks.onTorn && hooks.onTorn(); }, null, 1.15)
        .to(pageEl, { x: 7, rotation: 1.2, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.2)
        .to(pageEl, { x: 11, rotation: 1.8, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.48)
        .call(shreds, null, 1.8)
        .to(pageEl, { x: 70, y: -18, rotation: 5, duration: 0.32, ease: 'power3.out' }, 1.8)
        .to([cover, stub], { x: -90, rotation: -4, opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.95)
        .to(pageEl, { x: 0, y: 0, rotation: -1, duration: 0.7, ease: 'power3.inOut' }, 2.15)
        .set([cover, stub], { display: 'none' }, 2.6);
    } else {
      cover.style.display = stub.style.display = 'none';
      const f = torn && toTarget();
      if (f) tl.fromTo(book, { x: f.x, y: f.y, scale: f.scale, rotation: -8 }, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.6, ease: 'power3.out' }, 0).set(shade, { opacity: 0 }, 0).set(pageEl, { rotation: -1 }, 0);
      else tl.fromTo(pageEl, { rotateY: -118, x: -30, scale: 0.94 }, { rotateY: 0, x: 0, scale: 1, duration: 1.0, ease: 'power3.out' }, 0.05).fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.15);
    }
    return tl;
  }
  function close() {
    if (!isOpen) return; isOpen = false;
    if (tl) tl.kill();
    const f = torn && toTarget();
    tl = gsap.timeline({ onComplete: () => { el.classList.remove('is-open'); cover.style.display = stub.style.display = 'none'; gsap.set(book, { clearProps: 'transform' }); if (f) hooks.onStashed && hooks.onStashed(); onClose && onClose(); } })
      .to(xBtn, { opacity: 0, duration: 0.2 }, 0);
    if (f) tl.to(book, { x: f.x, y: f.y, scale: f.scale, rotation: -8, duration: 0.55, ease: 'power2.in' }, 0).to(dim, { opacity: 0, duration: 0.45 }, 0.1);
    else tl.to(pageEl, { rotateY: -105, x: -20, duration: 0.6, ease: 'power2.in' }, 0).to(shade, { opacity: 1, duration: 0.5 }, 0).to(cover, { opacity: 0, duration: 0.4 }, 0).to(dim, { opacity: 0, duration: 0.4 }, 0.3);
  }
  xBtn.onclick = close;
  // el fondo cierra solo si el toque empezó en él: al abrir la hoja con un toque, el click que sigue cae sobre el fondo
  // recién mostrado y la cerraría al instante (pasaba en pantallas táctiles)
  let dimDown = false;
  dim.addEventListener('pointerdown', () => { dimDown = true; });
  dim.onclick = () => { if (dimDown) close(); dimDown = false; };
  return {
    el, open, close, ready,
    bind(h) { hooks = h; },
    // idioma nuevo: la línea manuscrita y las etiquetas
    relang() { el.setAttribute('aria-label', t().clueTitle); xBtn.setAttribute('aria-label', t().close); return render(); },
    restoreTorn() { setTorn(true); },
    reset() { if (tl) tl.kill(); isOpen = false; el.classList.remove('is-open'); setTorn(false); cover.style.display = stub.style.display = 'none'; gsap.set(book, { clearProps: 'transform' }); },
    get icon() { return icon; }, get torn() { return torn; }, get isOpen() { return isOpen; },
  };
}
