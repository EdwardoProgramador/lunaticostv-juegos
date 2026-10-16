// Page shell for the room pages (10–17): header (label, extra controls, Repetir, Escritorio/Móvil),
// the stage (mock site behind + full-screen room overlay with title, close X, hint and big title).
//   const P = roomPage({ page: '10', controls: [el] });  P.onReplay(fn);  P.onView(fn);  P.hint(text)
import { TEXT } from './level2-text.js';
import { createSiteHeader } from './site-header.js';
import { keepGsapAlive } from './loop.js';

export function roomPage({ page, controls = [], room = true }) {
  keepGsapAlive();
  document.body.classList.add('room-page');
  const wrap = document.createElement('div'); wrap.className = 'ch-page';
  wrap.innerHTML = `
  <header class="ch-head">
    <div style="display:flex;flex-direction:column;gap:6px"><span class="ch-label">${TEXT.pages[page]}</span></div>
    <div class="ch-row" data-ctrl>
      <button class="ch-btn ch-btn--sm" data-replay>${TEXT.replay}</button>
      <div class="seg" data-view role="group" aria-label="${TEXT.view}"><button aria-pressed="true" data-v="desk">${TEXT.desktop}</button><button aria-pressed="false" data-v="mob">${TEXT.mobile}</button></div>
    </div>
  </header>
  <div class="shell"><div class="stage" data-stage>
    <div class="room-site" data-site><div class="bars" aria-hidden="true"><div class="bar" style="width:46%;height:40px"></div><div class="bar" style="width:64%"></div><div class="bar" style="width:52%"></div><div class="block"></div></div></div>
    ${room ? `<div class="room" data-room>
      <canvas class="room-gl"></canvas>
      <div class="room-ui" data-ui>
        <h1 class="ch-title room-title" data-text="${TEXT.roomTitle}">${TEXT.roomTitle}</h1>
        <button class="room-x" data-x aria-label="${TEXT.close}"></button>
        <p class="room-hint" data-hint role="status" aria-live="polite"></p>
        <div class="room-big"><h2 class="ch-title" data-big data-text=""></h2></div>
      </div>
    </div>` : ''}
  </div></div>`;
  document.body.appendChild(wrap);
  const q = s => wrap.querySelector(s);
  const stage = q('[data-stage]'), roomEl = q('[data-room]'), ui = q('[data-ui]') || stage, hintEl = q('[data-hint]'), bigEl = q('[data-big]'), ctrl = q('[data-ctrl]');
  controls.forEach(c => ctrl.insertBefore(c, ctrl.firstChild));
  const site = createSiteHeader({ mount: q('[data-site]'), onRoom: () => room && open() });
  q('[data-site]').prepend(site.el);

  const replayFns = [], viewFns = [], openFns = [];
  q('[data-replay]').onclick = () => { open(true); replayFns.forEach(f => f()); };
  const segs = wrap.querySelectorAll('[data-view] button');
  const setView = mob => {
    segs.forEach(x => x.setAttribute('aria-pressed', (x.dataset.v === 'mob') === mob));
    stage.classList.toggle('is-mobile', mob); viewFns.forEach(f => f(mob));
  };
  segs.forEach(b => b.onclick = () => setView(b.dataset.v === 'mob'));
  if (matchMedia('(max-width:640px)').matches) setView(true);

  function close() {
    if (!roomEl) return; gsap.to(roomEl, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: () => roomEl.classList.add('is-closed') }); }
  function open(instant) {
    if (!roomEl) return;
    roomEl.classList.remove('is-closed'); gsap.killTweensOf(roomEl);
    instant ? gsap.set(roomEl, { opacity: 1 }) : gsap.fromTo(roomEl, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    openFns.forEach(f => f());
  }
  if (room) q('[data-x]').onclick = close;

  let hintTw = null;
  return {
    wrap, shell: q('.shell'), stage, roomEl, ui, canvas: q('.room-gl'), hintEl, bigEl, site, ctrl,
    isMobile: () => stage.classList.contains('is-mobile') || stage.clientWidth <= 640,
    onReplay: f => replayFns.push(f), onView: f => viewFns.push(f), onOpen: f => openFns.push(f),
    open, close,
    hint(text, { delay = 0 } = {}) {
      if (hintTw) hintTw.kill();
      if (!text) { hintTw = gsap.to(hintEl, { opacity: 0, duration: 0.3 }); return; }
      hintTw = gsap.timeline({ delay })
        .to(hintEl, { opacity: 0, duration: hintEl.textContent && +getComputedStyle(hintEl).opacity > 0 ? 0.25 : 0 })
        .call(() => { hintEl.textContent = text; })
        .fromTo(hintEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    },
    setHintBottom(px) { ui.style.setProperty('--hint-b', px + 'px'); },
    // big brand-title line (e.g. "Encuentra los fragmentos"), added to a timeline
    big(text, tl, at = 0) {
      bigEl.textContent = text; bigEl.dataset.text = text;
      return tl.fromTo(bigEl, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, at);
    },
    hideBig() { gsap.killTweensOf(bigEl); gsap.set(bigEl, { opacity: 0 }); },
  };
}

// small helpers shared by the room pages
export function select(label, options, value, onChange) {
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  options.forEach((o, i) => s.add(new Option(o, i)));
  s.value = value; s.onchange = () => onChange(+s.value);
  return s;
}
export function button(text, onClick, ghost = true) {
  const b = document.createElement('button'); b.className = 'ch-btn ch-btn--sm' + (ghost ? ' ch-btn--ghost' : ''); b.textContent = text; b.onclick = onClick; return b;
}
export function sparks(parent, x, y, n = 16, spread = 90) {
  for (let k = 0; k < n; k++) {
    const s = document.createElement('span'); s.className = 'room-spark'; parent.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.6);
    gsap.fromTo(s, { x, y, scale: 0.6 + Math.random(), opacity: 1 }, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.55 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => s.remove() });
  }
}
// an icon flying on an arc between two points of `parent` (object back to the tray, key to the tray / keyhole)
export function flyIcon(parent, src, from, to, { dur = 0.7, size = 72, lift = 80, onComplete } = {}) {
  const img = document.createElement('img'); img.className = 'room-ghost'; img.src = src; img.alt = '';
  Object.assign(img.style, { width: size + 'px', height: size + 'px', margin: `${-size / 2}px 0 0 ${-size / 2}px` });
  parent.appendChild(img);
  const p = { t: 0 }, cx = (from.x + to.x) / 2, cy = Math.min(from.y, to.y) - lift;
  const place = t => { const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x, y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y; img.style.transform = `translate(${x}px,${y}px) scale(${1 - t * 0.25})`; };
  place(0);
  return gsap.to(p, { t: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => place(p.t), onComplete: () => { img.remove(); onComplete && onComplete(); } });
}
