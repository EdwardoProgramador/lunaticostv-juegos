// Ayudas DOM compartidas por el cuarto y la caja (de juego1-v2/lib/room-page.js, sin la cabecera de demo).
import { gsap } from '../vendor/gsap.min.js';
export { hudIcon } from './paths.js';

export function sparks(parent, x, y, n = 16, spread = 90) {
  for (let k = 0; k < n; k++) {
    const s = document.createElement('span'); s.className = 'lj1-room-spark'; parent.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.6);
    gsap.fromTo(s, { x, y, scale: 0.6 + Math.random(), opacity: 1 }, { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.55 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => s.remove() });
  }
}
// an icon flying on an arc between two points of `parent` (object back to the tray, key to the tray / keyhole)
export function flyIcon(parent, src, from, to, { dur = 0.7, size = 72, lift = 80, onComplete } = {}) {
  const img = document.createElement('img'); img.className = 'lj1-room-ghost'; img.src = src; img.alt = '';
  Object.assign(img.style, { width: size + 'px', height: size + 'px', margin: `${-size / 2}px 0 0 ${-size / 2}px` });
  parent.appendChild(img);
  const p = { t: 0 }, cx = (from.x + to.x) / 2, cy = Math.min(from.y, to.y) - lift;
  const place = t => { const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x, y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y; img.style.transform = `translate(${x}px,${y}px) scale(${1 - t * 0.25})`; };
  place(0);
  return gsap.to(p, { t: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => place(p.t), onComplete: () => { img.remove(); onComplete && onComplete(); } });
}

export const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
