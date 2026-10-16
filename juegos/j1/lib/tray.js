// Inventory tray (level 2): the objects HUD turned into a tray at the bottom of the room (port de juego1-v2/lib/tray.js).
// Same slot look as the HUD (.lj1-hud__slot: silhouette when empty, colour when held). Optional extra items (the key).
// With onRead: a hidden "page" slot (the torn clue page) after a separator; tray.showPage(true) reveals it, tapping it calls onRead.
//   const tray = createTray({ mount, has: ['candle', …], onRead });  tray.set('candle', false)
// Port: estilos en game.css (.lj1-tray*), iconos WebP, textos de ../i18n.js (relang() al cambiar de idioma).
import { gsap } from '../vendor/gsap.min.js';
import { t } from '../i18n.js';
import { ITEMS } from './level2-data.js';
import { hudIcon } from './paths.js';

const nameOf = (it) => (it.nameKey ? t()[it.nameKey] : t().names[it.key]);

export function createTray({ mount, items = ITEMS.map(key => ({ key })), extra = [], has = [], labelKey = 'trayLabel', onRead } = {}) {
  const el = document.createElement('div'); el.className = 'lj1-tray';
  const all = [...items, ...extra];
  const slot = it => `<button type="button" class="lj1-hud__slot" data-key="${it.key}"><img class="lj1-hud__sil" src="${it.sil || hudIcon(it.key, true)}" alt=""><img class="lj1-hud__col" src="${it.src || hudIcon(it.key)}" alt=""></button>`;
  el.innerHTML = `<div class="lj1-tray-head"><span class="lj1-hud__label"></span></div>
    <div class="lj1-tray-slots">${items.map(slot).join('')}${extra.length ? '<span class="lj1-tray-sep"></span>' + extra.map(slot).join('') : ''}${onRead ? `<span class="lj1-tray-sep lj1-tray-page-sep"></span><button type="button" class="lj1-hud__slot lj1-tray-page" data-key="page"><img class="lj1-hud__sil" alt=""><img class="lj1-hud__col" alt=""></button>` : ''}</div>`;
  mount.appendChild(el);
  gsap.set(el, { xPercent: -50 });
  const label = el.querySelector('.lj1-hud__label');
  const slots = {}; el.querySelectorAll('.lj1-hud__slot').forEach(s => (slots[s.dataset.key] = s));
  if (slots.page) slots.page.addEventListener('click', () => { if (tray.has('page')) onRead(); });
  const relang = () => {
    label.textContent = t()[labelKey];
    all.forEach(it => slots[it.key].setAttribute('aria-label', nameOf(it)));
    if (slots.page) slots.page.setAttribute('aria-label', t().clueTitle);
  };
  const tray = {
    el, slots, relang,
    has: k => slots[k] && slots[k].classList.contains('is-got'),
    set(k, v) { if (slots[k]) { slots[k].classList.toggle('is-got', !!v); slots[k].setAttribute('aria-disabled', v ? 'false' : 'true'); } },
    setAll(list) { Object.keys(slots).forEach(k => tray.set(k, list.includes(k))); },
    select(k) { Object.entries(slots).forEach(([key, s]) => { s.classList.toggle('is-sel', key === k); s.setAttribute('aria-pressed', key === k ? 'true' : 'false'); }); },
    // slot centre in mount coordinates
    center(k) { const r = slots[k].getBoundingClientRect(), m = mount.getBoundingClientRect(), z = m.width / mount.offsetWidth || 1; return { x: (r.left + r.width / 2 - m.left) / z, y: (r.top + r.height / 2 - m.top) / z }; },
    height() { return el.offsetHeight + 14; },
    get shown() { return el.style.visibility !== 'hidden'; },
    show(instant) { gsap.killTweensOf(el); el.style.visibility = 'visible'; instant ? gsap.set(el, { y: 0, opacity: 1 }) : gsap.fromTo(el, { y: el.offsetHeight + 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }); },
    hide(instant) { gsap.killTweensOf(el); instant ? (gsap.set(el, { y: el.offsetHeight + 40, opacity: 0 }), el.style.visibility = 'hidden') : gsap.to(el, { y: el.offsetHeight + 40, opacity: 0, duration: 0.45, ease: 'power3.in', onComplete: () => (el.style.visibility = 'hidden') }); },
    setPageIcon(src) { if (slots.page && src) slots.page.querySelectorAll('img').forEach(i => (i.src = src)); },
    showPage(v, got = v) { el.classList.toggle('has-page', !!v); tray.set('page', got); },
    flash(k) { const s = slots[k]; gsap.fromTo(s, { filter: 'brightness(2)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' }); },
  };
  relang();
  tray.setAll(has);
  return tray;
}
