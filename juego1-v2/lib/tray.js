// Inventory tray (level 2): the objects HUD turned into a tray at the bottom of the room.
// Same slot look as hud.js (.chud-slot: silhouette when empty, colour when held). Optional extra items (the key).
// With onRead: a hidden "page" slot (the torn clue page) after a separator; tray.showPage(true) reveals it, tapping it calls onRead.
//   const tray = createTray({ mount, items: HUD_ITEMS, has: ['candle', …], onRead });  tray.set('candle', false)
import { injectCSS, HUD_ITEMS } from './hud.js';
import { TEXT } from './level2-text.js';

const CSS = `
.ctray{position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:5;pointer-events:auto;padding:9px 12px 11px;
  background:linear-gradient(180deg,rgba(28,20,36,.95),rgba(9,8,17,.95));border:1px solid rgba(184,121,106,.6);
  box-shadow:0 0 0 1px #1E1A22,0 14px 40px rgba(0,0,0,.65),inset 0 1px 0 rgba(242,210,188,.14),inset 0 0 0 3px rgba(10,8,16,.9),inset 0 0 0 4px rgba(184,121,106,.22)}
.ctray-head{display:flex;justify-content:space-between;align-items:baseline;gap:14px;margin:0 2px 8px}
.ctray-slots{display:flex;gap:8px;align-items:center}
.ctray .chud-slot{appearance:none;padding:0;cursor:grab;touch-action:none;transition:box-shadow .3s,transform .2s}
.ctray .chud-slot:not(.is-got){cursor:default}
.ctray .chud-slot.is-sel{transform:translateY(-6px);box-shadow:0 0 0 1px #1E1A22,inset 0 0 18px rgba(255,154,60,.35),0 0 0 2px #FF9A3C,0 0 18px rgba(255,154,60,.5)}
.ctray .chud-slot:focus-visible{outline:2px solid var(--c-candle);outline-offset:2px}
.ctray-sep{align-self:stretch;width:1px;margin:2px 3px;background:linear-gradient(transparent,rgba(184,121,106,.55),transparent)}
.ctray:not(.has-page) .ctray-page,.ctray:not(.has-page) .ctray-page-sep{display:none}
.ctray .ctray-page.is-got{cursor:pointer}
.ctray .ctray-page img{inset:3px;width:calc(100% - 6px);height:calc(100% - 6px)}
.ctray .ctray-page .chud-sil{filter:brightness(0) opacity(.35)}
@container (max-width:640px){
  .ctray .chud-slot{width:52px;height:52px}
  .ctray-slots{gap:6px}
  .ctray{padding:8px 9px 9px}
  .ctray.has-page .chud-slot{width:47px;height:47px}
  .ctray.has-page .ctray-slots{gap:5px}
}`;
let cssDone = false;

export function createTray({ mount, items = HUD_ITEMS, extra = [], has = [], label = TEXT.trayLabel, base = 'assets/hud/', onRead } = {}) {
  injectCSS();
  if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; }
  const el = document.createElement('div'); el.className = 'ctray';
  const slot = it => `<button class="chud-slot" data-key="${it.key}" aria-label="${it.name}"><img class="chud-sil" src="${it.sil || base + it.key + '-sil.png'}" alt=""><img class="chud-col" src="${it.src || base + it.key + '.png'}" alt=""></button>`;
  el.innerHTML = `<div class="ctray-head"><span class="chud-label">${label}</span></div>
    <div class="ctray-slots">${items.map(slot).join('')}${extra.length ? '<span class="ctray-sep"></span>' + extra.map(slot).join('') : ''}${onRead ? `<span class="ctray-sep ctray-page-sep"></span><button class="chud-slot ctray-page" data-key="page" aria-label="${TEXT.clueTitle}"><img class="chud-sil" alt=""><img class="chud-col" alt=""></button>` : ''}</div>`;
  mount.appendChild(el);
  gsap.set(el, { xPercent: -50 });
  const slots = {}; el.querySelectorAll('.chud-slot').forEach(s => (slots[s.dataset.key] = s));
  if (slots.page) slots.page.addEventListener('click', () => { if (tray.has('page')) onRead(); });
  const tray = {
    el, slots,
    has: k => slots[k] && slots[k].classList.contains('is-got'),
    set(k, v) { if (slots[k]) slots[k].classList.toggle('is-got', !!v); },
    setAll(list) { Object.keys(slots).forEach(k => tray.set(k, list.includes(k))); },
    select(k) { Object.entries(slots).forEach(([key, s]) => s.classList.toggle('is-sel', key === k)); },
    // slot centre in mount coordinates
    center(k) { const r = slots[k].getBoundingClientRect(), m = mount.getBoundingClientRect(), z = m.width / mount.offsetWidth || 1; return { x: (r.left + r.width / 2 - m.left) / z, y: (r.top + r.height / 2 - m.top) / z }; },
    height() { return el.offsetHeight + 14; },
    show(instant) { gsap.killTweensOf(el); el.style.visibility = 'visible'; instant ? gsap.set(el, { y: 0, opacity: 1 }) : gsap.fromTo(el, { y: el.offsetHeight + 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }); },
    hide(instant) { gsap.killTweensOf(el); instant ? gsap.set(el, { y: el.offsetHeight + 40, opacity: 0, onComplete: () => (el.style.visibility = 'hidden') }) : gsap.to(el, { y: el.offsetHeight + 40, opacity: 0, duration: 0.45, ease: 'power3.in', onComplete: () => (el.style.visibility = 'hidden') }); },
    setPageIcon(src) { if (slots.page && src) slots.page.querySelectorAll('img').forEach(i => (i.src = src)); },
    showPage(v, got = v) { el.classList.toggle('has-page', !!v); tray.set('page', got); },
    flash(k) { const s = slots[k]; gsap.fromTo(s, { filter: 'brightness(2)' }, { filter: 'brightness(1)', duration: 0.6, ease: 'power2.out' }); },
  };
  tray.setAll(has);
  return tray;
}
