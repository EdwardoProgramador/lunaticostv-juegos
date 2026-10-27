// La caja del Cholo en Inicio (nivel 2, de "18 La caja y el final") y la pantalla final.
// · Aparece solo en Inicio, al activar el juego: pequeña, debajo del extremo derecho del menú, nunca encima de sus botones.
// · Sin la llave: tiembla y dice "Cerrada". Con la llave: sale la bandeja con la llave, la llave vuela a la cerradura, gira,
//   la tapa se abre con luz cálida y se muestra la pantalla final: "Abriste la caja del Cholo" y, enseguida, el contenido
//   exclusivo (reward.js): el video de Alonso Ortiz se reproduce solo y después el carrusel de fotos. Si config.rewardLink
//   tiene destino, debajo del carrusel aparece además "Ver contenido exclusivo de CHOLO".
// · Abierta, la caja se queda abierta (hasta recargar): un clic en ella vuelve a mostrar la pantalla final (y el video).
//   Cerrar la pantalla final (X, Esc) ya no reinicia nada.
import { gsap } from './vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ createChest }, { createTray }, { navBottom }, { asset }, { bindText }, { createReward }] = await Promise.all([
  import(`./lib/chest.js${V}`),
  import(`./lib/tray.js${V}`),
  import(`./lib/hud.js${V}`),
  import(`./lib/paths.js${V}`),
  import(`./i18n.js${V}`),
  import(`./reward.js${V}`),
]);
const sfx = await import(`./lib/sfx.js${V}`);

const KEY_ICON = asset('hud/key.webp');

function lockScroll(root) {
  const html = document.documentElement, prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
  const hasBar = innerWidth > html.clientWidth;
  html.style.overflow = 'hidden'; if (hasBar) html.style.scrollbarGutter = 'stable';
  const block = (e) => { if (!e.target.closest('.lj1-reward__track')) e.preventDefault(); }; // el carrusel sí se desliza
  root.addEventListener('wheel', block, { passive: false }); root.addEventListener('touchmove', block, { passive: false });
  return () => { html.style.overflow = prev.overflow; html.style.scrollbarGutter = prev.gutter; root.removeEventListener('wheel', block); root.removeEventListener('touchmove', block); };
}

function createReveal({ link, reduced, onClose }) {
  const el = document.createElement('div');
  el.className = 'lj1-scope lj1-reveal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'lj1-reveal-title');
  el.innerHTML = '<div class="lj1-reveal__inner"><h2 class="lj1-title lj1-reveal__title" id="lj1-reveal-title" data-text=""></h2></div><button type="button" class="lj1-room-x"></button>';
  const inner = el.querySelector('.lj1-reveal__inner'), h = el.querySelector('h2'), x = el.querySelector('.lj1-room-x');
  bindText(h, 'revealTitle'); bindText(x, 'close', 'aria-label');
  const reward = createReward({ link, reduced });
  el.insertBefore(reward.el, x);
  let unlock = null, returnFocus = null, open = false, tl = null;
  // botones y enlaces a la vista (el foco no sale de la pantalla final)
  const focusables = () => [...el.querySelectorAll('button, a[href], [tabindex="0"]')].filter((n) => !n.disabled && n.getClientRects().length);
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'Tab') { const f = focusables(), i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); return; }
    if (reward.onKey(e)) e.preventDefault();
  };
  function hide() {
    if (!open) return; open = false;
    if (tl) tl.kill();
    document.removeEventListener('keydown', onKey, true);
    gsap.to(el, { opacity: 0, duration: reduced ? 0.3 : 0.45, onComplete: () => { reward.destroy(); el.remove(); if (unlock) unlock(); if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true }); onClose && onClose(); } });
  }
  x.addEventListener('click', hide);
  return {
    get open() { return open; },
    prime: () => reward.prime(), // en el clic que abre la caja: el video empieza a descargarse y podrá sonar
    show() {
      open = true; returnFocus = document.activeElement;
      reward.prime();
      document.body.appendChild(el); unlock = lockScroll(el);
      document.addEventListener('keydown', onKey, true);
      x.focus({ preventScroll: true });
      // "Abriste la caja del Cholo" unos segundos y, enseguida, el video
      const toReward = () => { inner.hidden = true; reward.play(); };
      sfx.play('reveal'); // acorde de acierto con el título (antes de que empiece el video)
      if (reduced) {
        tl = gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 }).to(inner, { opacity: 0, duration: 0.3 }, 2.2).call(toReward);
        return tl;
      }
      tl = gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' })
        .fromTo(h, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 0.3)
        .to(inner, { opacity: 0, y: -16, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, 2.5)
        .call(toReward);
      return tl;
    },
    hide,
    destroy() { if (tl) tl.kill(); if (open) { document.removeEventListener('keydown', onKey, true); if (unlock) unlock(); } reward.destroy(); el.remove(); },
  };
}

export function createBox({ link, reduced = false, hasKey = () => false, isDone = () => false, onOpened, onFinalClose }) {
  const layer = document.createElement('div'); layer.className = 'lj1-scope lj1-box-layer';
  document.body.appendChild(layer);
  const chest = createChest({ mount: layer, reduced });
  // capa fija a pantalla completa para el vuelo de la llave y su bandeja
  const fly = document.createElement('div'); fly.className = 'lj1-scope lj1-fly-layer';
  document.body.appendChild(fly);
  let tray = null, reveal = null; // reveal se crea en el clic que abre la caja (prime) y se muestra al abrirse la tapa
  // la caja vive en el documento (se va con el scroll), justo debajo del menú fijo cuando la página está arriba; en
  // < 375 px deja sitio al botón del cuarto, que ahí cuelga debajo de la barra. La franja (.lj1-box-layer) empieza
  // 0.45 cajas más arriba para que el halo no se recorte.
  const place = () => {
    const mob = innerWidth <= 640, tab = innerWidth < 375, h = tab ? 84 : mob ? 100 : 130;
    layer.style.top = `${Math.round(navBottom() + (tab ? 50 : mob ? 4 : 8) - h * 0.45)}px`;
    layer.style.setProperty('--lj1-box-right', mob ? '6px' : 'max(16px, calc((100vw - 1440px) / 2 + 16px))');
  };
  place(); addEventListener('resize', place, { passive: true });
  if (isDone()) chest.setOpen(); else if (hasKey()) chest.armKey();
  const getReveal = () => reveal || (reveal = createReveal({ link, reduced, onClose: () => { reveal = null; if (onFinalClose) onFinalClose(); } }));
  const showReveal = () => { const r = getReveal(); if (!r.open) r.show(); };

  chest.hit.addEventListener('click', () => {
    if (chest.open) { showReveal(); return; } // ya abierta: vuelve la pantalla final
    if (chest.busy) return;
    if (!hasKey()) { chest.shake(); return; }
    if (!tray) {
      tray = createTray({ mount: fly, items: [{ key: 'key', nameKey: 'keyName', src: KEY_ICON, sil: KEY_ICON }], labelKey: 'inventoryLabel' });
      tray.el.classList.add('lj1-tray--key'); tray.hide(true);
    }
    getReveal().prime();
    tray.set('key', true); tray.show(reduced);
    gsap.delayedCall(reduced ? 0.1 : 0.55, () => {
      const r = tray.slots.key.getBoundingClientRect();
      tray.set('key', false);
      chest.unlock({
        from: { x: r.left + r.width / 2, y: r.top + r.height / 2 }, keySrc: KEY_ICON, layer: fly,
        onOpen: () => {
          tray.hide(); if (onOpened) onOpened();
          showReveal();
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
    setOpen: () => chest.setOpen(),
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
