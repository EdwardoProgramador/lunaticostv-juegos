// "El Cuarto del Cholo" menu button (level 2). States: hidden · appear (materializes with candlelight) · normal · new (soft pulse).
//   const b = createRoomButton({ mount, onClick });  b.setState('appear');
// Desktop shows the full name; ≤ 640px (container or viewport) shows the short one — next to the hamburger, never inside it.
import { TEXT } from './level2-text.js';

const CSS = `
.crb{position:relative;display:inline-flex;align-items:center;min-height:44px;padding:4px 8px;border:0;background:none;cursor:pointer;isolation:isolate;white-space:nowrap}
.crb .ch-title{font-size:21px;line-height:1;-webkit-text-stroke-width:.16em}
.crb-short{display:none}
.crb-glow{position:absolute;left:-14px;right:-14px;top:-4px;bottom:-4px;z-index:-1;border-radius:50%;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse at 50% 55%,rgba(255,176,96,.55) 0%,rgba(255,120,50,.22) 42%,rgba(255,120,50,0) 70%)}
.crb-dot{position:absolute;top:7px;right:1px;width:7px;height:7px;border-radius:50%;background:#FF9A3C;box-shadow:0 0 8px 2px rgba(255,154,60,.75);opacity:0;pointer-events:none}
.crb:hover .ch-title{filter:brightness(1.12)}
.crb:focus-visible{outline:2px solid var(--c-candle);outline-offset:2px}
.crb[hidden]{display:none}
.crb-ember{position:absolute;left:50%;top:60%;width:4px;height:4px;margin:-2px;border-radius:50%;background:#FFD6A0;box-shadow:0 0 6px 2px rgba(255,154,60,.8);pointer-events:none}
@container (max-width:640px){.crb-full{display:none}.crb-short{display:inline}.crb .ch-title{font-size:20px}}
@media (max-width:640px){.crb-full{display:none}.crb-short{display:inline}}
`;
let cssDone = false;

export function createRoomButton({ mount, onClick, state = 'normal' } = {}) {
  if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; }
  const el = document.createElement('button');
  el.className = 'crb'; el.type = 'button'; el.setAttribute('aria-label', TEXT.roomButton);
  el.innerHTML = `<span class="crb-glow"></span><span class="ch-title crb-full" data-text="${TEXT.roomButton}">${TEXT.roomButton}</span><span class="ch-title crb-short" data-text="${TEXT.roomButtonShort}">${TEXT.roomButtonShort}</span><span class="crb-dot"></span>`;
  mount.appendChild(el);
  if (onClick) el.addEventListener('click', onClick);
  const glow = el.querySelector('.crb-glow'), dot = el.querySelector('.crb-dot'), texts = el.querySelectorAll('.ch-title');
  let tl = null, cur = null;
  const stop = () => { if (tl) tl.kill(); tl = null; gsap.killTweensOf([el, glow, dot, ...texts]); el.querySelectorAll('.crb-ember').forEach(e => e.remove()); gsap.set([el, glow, dot, ...texts], { clearProps: 'all' }); };
  function embers(t, at) {
    for (let k = 0; k < 12; k++) {
      const e = document.createElement('span'); e.className = 'crb-ember'; el.appendChild(e);
      const x = gsap.utils.random(-60, 60), d = gsap.utils.random(0.7, 1.3);
      t.fromTo(e, { x: x * 0.5, y: 6, opacity: 0, scale: gsap.utils.random(0.5, 1.1) }, { x, y: gsap.utils.random(-34, -14), opacity: 1, duration: d * 0.35, ease: 'power1.out' }, at + k * 0.04)
        .to(e, { y: '-=16', opacity: 0, duration: d * 0.65, ease: 'power1.in', onComplete: () => e.remove() }, '>');
    }
  }
  function setState(s) {
    stop(); cur = s;
    el.hidden = s === 'hidden';
    if (s === 'appear') {
      tl = gsap.timeline({ onComplete: () => { cur = 'normal'; } });
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0)
        .fromTo(texts, { opacity: 0, filter: 'blur(10px) brightness(2.2)', y: 6 }, { opacity: 1, filter: 'blur(0px) brightness(1)', y: 0, duration: 1.1, ease: 'power2.out' }, 0.15)
        .fromTo(glow, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.15, duration: 0.5, ease: 'power2.out' }, 0)
        .to(glow, { opacity: 0.55, duration: 0.07, yoyo: true, repeat: 5, ease: 'steps(1)' }, 0.5)
        .to(glow, { opacity: 0, scale: 0.9, duration: 0.9, ease: 'power2.in' }, 1.0);
      embers(tl, 0.2);
    } else if (s === 'new') {
      tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.fromTo(glow, { opacity: 0.25, scale: 0.9 }, { opacity: 0.9, scale: 1.12, duration: 1.3, ease: 'sine.inOut' }, 0)
        .fromTo(texts, { filter: 'brightness(1)' }, { filter: 'brightness(1.22)', duration: 1.3, ease: 'sine.inOut' }, 0)
        .fromTo(dot, { opacity: 0.6, scale: 0.85 }, { opacity: 1, scale: 1.15, duration: 1.3, ease: 'sine.inOut' }, 0);
    }
  }
  setState(state);
  return { el, setState, get state() { return cur; } };
}
