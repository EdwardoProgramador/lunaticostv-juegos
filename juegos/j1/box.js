// La caja del Cholo en Inicio (nivel 2, de "18 La caja y el final") y la pantalla final.
// · Aparece solo en Inicio, al activar el juego: pequeña, debajo del extremo derecho del menú, nunca encima de sus botones.
// · Sin la llave: tiembla y dice "Cerrada". Con la llave: sale la bandeja con la llave, la llave vuela a la cerradura, gira,
//   la tapa se abre con luz cálida y se muestra la pantalla final con "Ver contenido exclusivo de CHOLO" (config.rewardLink).
// · Al cerrar la pantalla final (X, Esc) se llama onFinalClose: main.js reinicia el juego.
import { gsap } from './vendor/gsap.min.js';
import { createChest } from './lib/chest.js';
import { createTray } from './lib/tray.js';
import { navBottom } from './lib/hud.js';
import { asset } from './lib/paths.js';
import { bindText } from './i18n.js';

const KEY_ICON = asset('hud/key.webp');

function lockScroll(root) {
  const html = document.documentElement, prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
  const hasBar = innerWidth > html.clientWidth;
  html.style.overflow = 'hidden'; if (hasBar) html.style.scrollbarGutter = 'stable';
  const block = (e) => e.preventDefault();
  root.addEventListener('wheel', block, { passive: false }); root.addEventListener('touchmove', block, { passive: false });
  return () => { html.style.overflow = prev.overflow; html.style.scrollbarGutter = prev.gutter; root.removeEventListener('wheel', block); root.removeEventListener('touchmove', block); };
}

function createReveal({ link, reduced, onClose }) {
  const el = document.createElement('div');
  el.className = 'lj1-scope lj1-reveal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'lj1-reveal-title');
  el.innerHTML = '<div class="lj1-reveal__inner"><h2 class="lj1-title lj1-reveal__title" id="lj1-reveal-title" data-text=""></h2><a class="lj1-btn lj1-reveal__cta"></a></div><button type="button" class="lj1-room-x"></button>';
  const h = el.querySelector('h2'), b = el.querySelector('a'), x = el.querySelector('.lj1-room-x');
  bindText(h, 'revealTitle'); bindText(b, 'revealButton'); bindText(x, 'close', 'aria-label');
  b.href = link || '#';
  try { const u = new URL(b.href, location.href); if (u.origin !== location.origin) { b.target = '_blank'; b.rel = 'noopener'; } } catch (e) { /* href relativo raro: se queda */ }
  b.addEventListener('click', (e) => { if (!link || link === '#') e.preventDefault(); });
  let unlock = null, returnFocus = null, open = false;
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'Tab') { const f = [b, x], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  };
  function hide() {
    if (!open) return; open = false;
    document.removeEventListener('keydown', onKey, true);
    gsap.to(el, { opacity: 0, duration: reduced ? 0.3 : 0.45, onComplete: () => { el.remove(); if (unlock) unlock(); if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true }); onClose && onClose(); } });
  }
  x.addEventListener('click', hide);
  return {
    show() {
      open = true; returnFocus = document.activeElement;
      document.body.appendChild(el); unlock = lockScroll(el);
      document.addEventListener('keydown', onKey, true);
      x.focus({ preventScroll: true });
      if (reduced) return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 });
      return gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' })
        .fromTo(h, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 0.3)
        .fromTo(b, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 1.0);
    },
    hide,
    destroy() { if (open) { document.removeEventListener('keydown', onKey, true); if (unlock) unlock(); } el.remove(); },
  };
}

export function createBox({ link, reduced = false, hasKey = () => false, onOpened, onFinalClose }) {
  const layer = document.createElement('div'); layer.className = 'lj1-scope lj1-box-layer';
  document.body.appendChild(layer);
  const chest = createChest({ mount: layer, reduced });
  // capa fija a pantalla completa para el vuelo de la llave y su bandeja
  const fly = document.createElement('div'); fly.className = 'lj1-scope lj1-fly-layer';
  document.body.appendChild(fly);
  let tray = null, reveal = null;
  // la caja vive en el documento (se va con el scroll), justo debajo del menú fijo cuando la página está arriba; en
  // < 375 px deja sitio al botón del cuarto, que ahí cuelga debajo de la barra. La franja (.lj1-box-layer) empieza
  // 0.45 cajas más arriba para que el halo no se recorte.
  const place = () => {
    const mob = innerWidth <= 640, tab = innerWidth < 375, h = tab ? 84 : mob ? 100 : 130;
    layer.style.top = `${Math.round(navBottom() + (tab ? 50 : mob ? 4 : 8) - h * 0.45)}px`;
    layer.style.setProperty('--lj1-box-right', mob ? '6px' : 'max(16px, calc((100vw - 1440px) / 2 + 16px))');
  };
  place(); addEventListener('resize', place, { passive: true });
  if (hasKey()) chest.armKey();

  chest.hit.addEventListener('click', () => {
    if (chest.busy || chest.open) return;
    if (!hasKey()) { chest.shake(); return; }
    if (!tray) {
      tray = createTray({ mount: fly, items: [{ key: 'key', nameKey: 'keyName', src: KEY_ICON, sil: KEY_ICON }], labelKey: 'inventoryLabel' });
      tray.el.classList.add('lj1-tray--key'); tray.hide(true);
    }
    tray.set('key', true); tray.show(reduced);
    gsap.delayedCall(reduced ? 0.1 : 0.55, () => {
      const r = tray.slots.key.getBoundingClientRect();
      tray.set('key', false);
      chest.unlock({
        from: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, keySrc: KEY_ICON, layer: fly,
        onOpen: () => {
          tray.hide(); if (onOpened) onOpened();
          reveal = createReveal({ link, reduced, onClose: () => { reveal = null; if (onFinalClose) onFinalClose(); } });
          reveal.show();
        },
      });
    });
  });

  return {
    el: layer,
    appear() {
      if (reduced) return gsap.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: 0.6 });
      return gsap.fromTo(layer, { opacity: 0, scale: 0.6, y: -10 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.7)', transformOrigin: '50% 60%' });
    },
    armKey: () => chest.armKey(),
    relang() { chest.relang(); if (tray) tray.relang(); },
    pause: (r) => chest.pause(r), resume: (r) => chest.resume(r),
    destroy() {
      removeEventListener('resize', place);
      if (reveal) reveal.destroy();
      gsap.killTweensOf(layer);
      chest.dispose(); layer.remove(); fly.remove();
    },
  };
}
