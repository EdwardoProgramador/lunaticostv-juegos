// Nivel 1 completo (de "09 Completado 5-5"): el HUD recolecta el 5.º objeto, las ranuras se encienden una por una, el HUD va
// al centro, respira tres veces y un destello de vela abre El Cuarto del Cholo en "objetos listos". Sustituye a la vieja
// recompensa automática del altar. Una sola capa a pantalla completa, por encima del cuarto: el cuarto se abre detrás del
// destello y esta capa se desvanece. Con movimiento reducido: fundidos, sin desplazamientos.
// Sonido: una campanita por ranura, los objetos laten como corazón (tres latidos, cada uno más fuerte) y el destello suena
// a acierto grande.
//   playComplete({ hud, reduced, openRoom, onDone })
import { gsap } from './vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const sfx = await import(`./lib/sfx.js${V}`);

export function playComplete({ hud, reduced = false, openRoom, onDone }) {
  const root = document.createElement('div');
  root.className = 'lj1-complete'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<div class="lj1-complete__dim"></div><div class="lj1-complete__glow"></div><div class="lj1-complete__flash"></div>';
  document.body.appendChild(root);
  const dim = root.children[0], glow = root.children[1], flash = root.children[2];
  // el HUD pasa a esta capa (encima del oscurecido, debajo del destello) sin moverse en pantalla
  root.insertBefore(hud.el, flash);
  const finish = () => { root.remove(); if (onDone) onDone(); };

  if (reduced) {
    return gsap.timeline()
      .call(() => sfx.play('confirm', { big: true }), null, 1.4)
      .to(dim, { opacity: 0.9, duration: 0.6, ease: 'power1.inOut' }, 1.4)
      .to(hud.el, { opacity: 0, duration: 0.4 }, 1.8)
      .call(openRoom, null, 2.1)
      .to(dim, { opacity: 0, duration: 0.7, ease: 'power1.out' }, 2.3)
      .call(finish, null, 3.05);
  }

  const panel = hud.panel, countEl = hud.countEl, slots = hud.slots;
  slots.forEach((s) => { const f = document.createElement('span'); f.className = 'lj1-hud__sflash'; s.appendChild(f); });
  const sflash = slots.map((s) => s.querySelector('.lj1-hud__sflash')), imgs = slots.map((s) => s.querySelector('.lj1-hud__col'));
  gsap.set(flash, { opacity: 0, scale: 0.15 });
  let dx = 0, dy = 0, S = 1.5;
  const tl = gsap.timeline();

  // cadena: las ranuras se encienden una por una (tras el parpadeo del 5.º objeto)
  const start = 1.05;
  slots.forEach((s, i) => {
    const at = start + i * 0.15;
    tl.call(() => sfx.play('chain', { i }), null, at)
      .fromTo(sflash[i], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.15, duration: 0.12, ease: 'power2.out' }, at)
      .to(sflash[i], { opacity: 0, scale: 0.8, duration: 0.32, ease: 'power2.in' }, at + 0.12)
      .fromTo(imgs[i], { filter: 'brightness(2.1)' }, { filter: 'brightness(1)', duration: 0.45, ease: 'power2.out' }, at);
  });
  const chainEnd = start + 4 * 0.15;
  tl.fromTo(countEl, { scale: 1.45, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, chainEnd);

  // al centro y más grande
  const mv = chainEnd + 0.12;
  tl.call(() => {
    const sr = root.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    dx = sr.left + sr.width / 2 - (pr.left + pr.width / 2);
    dy = sr.top + sr.height / 2 - (pr.top + pr.height / 2);
    S = Math.min(1.8, Math.max(1.12, (sr.width * 0.86) / pr.width), (sr.width * 0.94) / (1.14 * pr.width)); // el pico de la respiración cabe en pantalla
    const rr = hud.el.getBoundingClientRect();
    gsap.set(hud.el, { transformOrigin: `${pr.left + pr.width / 2 - rr.left}px ${pr.top + pr.height / 2 - rr.top}px` });
  }, null, mv - 0.01)
    .call(() => sfx.play('whoosh', { dur: 0.5, vol: 0.07 }), null, mv)
    .to(hud.el, { x: () => dx, y: () => dy, scale: () => S, duration: 0.5, ease: 'power3.inOut' }, mv)
    .to(dim, { opacity: 0.45, duration: 0.5, ease: 'power1.out' }, mv)
    .fromTo(glow, { opacity: 0, scale: 0.5 }, { opacity: 0.35, scale: 0.8, duration: 0.5 }, mv);

  // respira ×3, el brillo crece cada vez
  const br = mv + 0.5, P = 0.36;
  [[1.07, 0.6, 1.1], [1.1, 0.8, 1.45], [1.14, 1, 1.9]].forEach(([k, go, gs], i) => {
    const at = br + i * P;
    tl.call(() => sfx.play('heartbeat', { k: i }), null, at)
      .to(hud.el, { scale: () => S * k, filter: `brightness(${1 + i * 0.12})`, duration: P * 0.45, ease: 'sine.out' }, at)
      .to(glow, { opacity: go, scale: gs, duration: P * 0.45, ease: 'sine.out' }, at);
    if (i < 2) tl.to(hud.el, { scale: () => S, filter: 'brightness(1)', duration: P * 0.55, ease: 'sine.in' }, at + P * 0.45)
      .to(glow, { opacity: go * 0.55, scale: gs * 0.85, duration: P * 0.55, ease: 'sine.in' }, at + P * 0.45);
  });

  // último pulso: casi negro, destello de vela, el cuarto se abre detrás
  const last = br + 2 * P;
  tl.to(dim, { opacity: 0.97, duration: 0.3, ease: 'power2.in' }, last)
    .call(() => sfx.play('confirm', { big: true }), null, last + 0.08)
    .to(flash, { opacity: 1, scale: 1.6, duration: 0.24, ease: 'power2.out' }, last + 0.08)
    .to([hud.el, glow], { opacity: 0, duration: 0.18 }, last + 0.2)
    .call(openRoom, null, last + 0.3)
    .to(flash, { opacity: 0, scale: 2.4, duration: 0.7, ease: 'power2.in' }, last + 0.32)
    .to(dim, { opacity: 0, duration: 0.9, ease: 'power2.out' }, last + 0.45)
    .call(finish, null, last + 1.4);
  return tl;
}
