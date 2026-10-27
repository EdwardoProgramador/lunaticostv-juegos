// Botón "El Cuarto del Cholo" en el menú del sitio.
// Estados: hidden · appear (se materializa con luz de vela) · normal · new (pulso suave: hay algo nuevo que hacer en el cuarto).
// callout(true): además cuelga debajo una etiqueta "Vuelve al cuarto" con flecha (con los 5 fragmentos, hasta entrar al cuarto).
// Escritorio (> 960 px): al final de los enlaces del menú. Móvil (≤ 960 px, cuando el sitio muestra la hamburguesa): junto a
// la hamburguesa, nunca dentro del menú desplegable. Nombre corto ("El Cuarto" / "Room") en ≤ 640 px.
//   const b = createRoomButton({ onClick, onIntent });  b.setState('appear');  b.destroy()
import { gsap } from './vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const { t } = await import(`./i18n.js${V}`);

const MOBILE = '(max-width: 960px)';

export function createRoomButton({ onClick, onIntent, reduced = false } = {}) {
  const nav = document.querySelector('nav.nav, .site-header');
  if (!nav) return null;
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'lj1-scope lj1-rbtn'; el.hidden = true;
  el.innerHTML = '<span class="lj1-rbtn__glow" aria-hidden="true"></span><span class="lj1-title lj1-rbtn__full" aria-hidden="true"></span><span class="lj1-title lj1-rbtn__short" aria-hidden="true"></span><span class="lj1-rbtn__dot" aria-hidden="true"></span><span class="lj1-rbtn__callout" aria-hidden="true" hidden></span>';
  const glow = el.querySelector('.lj1-rbtn__glow'), dot = el.querySelector('.lj1-rbtn__dot'), full = el.querySelector('.lj1-rbtn__full'), short = el.querySelector('.lj1-rbtn__short');
  const texts = [full, short], tag = el.querySelector('.lj1-rbtn__callout');
  let tl = null, cur = 'hidden', bounce = null;

  const relang = () => {
    const tx = t();
    full.textContent = tx.roomButton; full.dataset.text = tx.roomButton;
    short.textContent = tx.roomButtonShort; short.dataset.text = tx.roomButtonShort;
    tag.textContent = tx.roomCallout;
    el.setAttribute('aria-label', cur === 'new' ? `${tx.roomButton}, ${tx.roomNew}` : tx.roomButton);
  };
  relang();

  // dónde va según el ancho
  const mq = matchMedia(MOBILE);
  const place = () => {
    const links = nav.querySelector('.nav__links, .site-nav'), right = nav.querySelector('.nav__right, .header-tools');
    const menuBtn = right && right.querySelector('.nav__menu-btn, .nav-toggle');
    if (mq.matches && right) right.insertBefore(el, menuBtn && menuBtn.parentNode === right ? menuBtn : null);
    else if (links) links.appendChild(el);
    else if (right) right.insertBefore(el, right.firstChild);
  };
  place();
  mq.addEventListener('change', place);

  if (onClick) el.addEventListener('click', onClick);
  const intent = () => onIntent && onIntent();
  ['pointerenter', 'focus', 'touchstart'].forEach((ev) => el.addEventListener(ev, intent, { passive: true }));
  const offLang = (() => { const h = () => relang(); document.addEventListener('ltv:languagechange', h); return () => document.removeEventListener('ltv:languagechange', h); })();

  const stop = () => {
    if (tl) tl.kill(); tl = null;
    gsap.killTweensOf([el, glow, dot, ...texts]);
    el.querySelectorAll('.lj1-rbtn__ember').forEach((e) => e.remove());
    gsap.set([el, glow, dot, ...texts], { clearProps: 'opacity,transform,filter,scale' });
  };
  function embers(tt, at) {
    for (let k = 0; k < 12; k++) {
      const e = document.createElement('span'); e.className = 'lj1-rbtn__ember'; el.appendChild(e);
      const x = gsap.utils.random(-60, 60), d = gsap.utils.random(0.7, 1.3);
      tt.fromTo(e, { x: x * 0.5, y: 6, opacity: 0, scale: gsap.utils.random(0.5, 1.1) }, { x, y: gsap.utils.random(-34, -14), opacity: 1, duration: d * 0.35, ease: 'power1.out' }, at + k * 0.04)
        .to(e, { y: '-=16', opacity: 0, duration: d * 0.65, ease: 'power1.in', onComplete: () => e.remove() }, '>');
    }
  }
  function setState(s) {
    if (s === cur && s !== 'appear') return;
    stop(); cur = s;
    el.hidden = s === 'hidden';
    el.classList.toggle('is-new', s === 'new');
    relang();
    if (s === 'appear') {
      tl = gsap.timeline({ onComplete: () => { cur = 'normal'; tl = null; } });
      if (reduced) { tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }); return; }
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0)
        .fromTo(texts, { opacity: 0, filter: 'blur(10px) brightness(2.2)', y: 6 }, { opacity: 1, filter: 'blur(0px) brightness(1)', y: 0, duration: 1.1, ease: 'power2.out' }, 0.15)
        .fromTo(glow, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.15, duration: 0.5, ease: 'power2.out' }, 0)
        .to(glow, { opacity: 0.55, duration: 0.07, yoyo: true, repeat: 5, ease: 'steps(1)' }, 0.5)
        .to(glow, { opacity: 0, scale: 0.9, duration: 0.9, ease: 'power2.in' }, 1.0);
      embers(tl, 0.2);
    } else if (s === 'new') {
      tl = gsap.timeline({ repeat: -1, yoyo: true });
      if (reduced) { tl.fromTo([glow, dot], { opacity: 0.25 }, { opacity: 0.9, duration: 1.6, ease: 'sine.inOut' }); return; }
      tl.fromTo(glow, { opacity: 0.25, scale: 0.9 }, { opacity: 0.9, scale: 1.12, duration: 1.3, ease: 'sine.inOut' }, 0)
        .fromTo(texts, { filter: 'brightness(1)' }, { filter: 'brightness(1.22)', duration: 1.3, ease: 'sine.inOut' }, 0)
        .fromTo(dot, { opacity: 0.6, scale: 0.85 }, { opacity: 1, scale: 1.15, duration: 1.3, ease: 'sine.inOut' }, 0);
    }
  }
  function callout(on) {
    if (on === !tag.hidden) return;
    if (bounce) { bounce.kill(); bounce = null; }
    gsap.killTweensOf(tag);
    tag.hidden = !on;
    if (!on) return;
    if (reduced) { gsap.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.5 }); return; }
    gsap.fromTo(tag, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2)' });
    bounce = gsap.to(tag, { y: 5, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
  }
  return {
    el, setState, callout,
    get state() { return cur; },
    // 'normal' o 'new' sin interrumpir la materialización si está en curso
    settle(s) { if (cur === 'appear' && tl) tl.eventCallback('onComplete', () => { cur = 'normal'; tl = null; setState(s); }); else setState(s); },
    destroy() { stop(); callout(false); mq.removeEventListener('change', place); offLang(); el.remove(); },
  };
}
