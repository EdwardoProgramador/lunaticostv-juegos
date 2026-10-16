// Fragments HUD (level 2): the outline of the full crystal divided into its 5 fragment shapes.
// Missing = dark empty outline · collected = the piece fills its place (crystal texture) with a copper glow. Counter "2/5".
// Same behaviour as the objects HUD (shared hudRoot/hudMotion from hud.js): hidden, slides in on collect, out after ~3 s.
//   const hud = createFragmentHUD({ mount });  hud.collect(1);  hud.next();  hud.reset()
import { hudRoot, hudMotion } from './hud.js';
import { FRAGMENTS, svgPath, centroid } from './crystal-shape.js';
import { TEXT } from './level2-text.js';

const CSS = `
.cfhud{position:absolute;top:22px;right:22px;display:flex;align-items:center;gap:16px;padding:14px 20px 14px 16px;visibility:hidden;
  background:radial-gradient(120% 90% at 30% 40%,rgba(58,36,66,.96),rgba(14,10,22,.97) 70%);
  border:1px solid rgba(242,210,188,.55);
  box-shadow:0 0 0 1px #1E1A22,0 0 0 5px rgba(12,9,18,.96),0 0 0 6px rgba(184,121,106,.75),0 0 0 7px #1E1A22,0 18px 46px rgba(0,0,0,.7),0 0 34px rgba(255,154,60,.12),inset 0 1px 0 rgba(242,210,188,.18)}
.chud-root--static .cfhud{position:relative;top:auto;right:auto;visibility:visible;display:inline-flex}
.cfhud::before,.cfhud::after{content:"";position:absolute;left:50%;width:9px;height:9px;margin-left:-4.5px;transform:rotate(45deg);background:linear-gradient(135deg,#F2D2BC,#B8796A 55%,#5a3a33);box-shadow:0 0 0 1px #1E1A22,0 0 8px rgba(255,154,60,.45)}
.cfhud::before{top:-9px}.cfhud::after{bottom:-9px}
.cfhud-gem{position:relative;width:74px;height:124px;flex:none}
.cfhud-gem svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.cfhud-empty{fill:#0b0810;stroke:rgba(184,121,106,.6);stroke-width:7;stroke-linejoin:round}
.cfhud-edge{fill:none;stroke:#FFB676;stroke-width:9;stroke-linejoin:round;opacity:0}
.cfhud-piece{opacity:0}
.cfhud-piece.is-got{opacity:1}
.cfhud-piece.is-got + .cfhud-edge{opacity:.85}
.cfhud-gem.has-any svg{filter:drop-shadow(0 0 6px rgba(255,154,60,.35))}
.cfhud-info{display:flex;flex-direction:column;gap:6px;min-width:0}
.cfhud-label{font:700 19px/1 var(--f-title);color:transparent;background:linear-gradient(180deg,#FBEBDD 0%,#F2D2BC 38%,#D79C82 70%,#B8796A 100%);-webkit-background-clip:text;background-clip:text;max-width:9ch;text-wrap:balance}
.cfhud-count{display:inline-block;font:700 30px/1 var(--f-ui);letter-spacing:.02em;color:#F2D2BC;font-variant-numeric:tabular-nums;transform-origin:0 70%}
.cfhud-count span{color:#8C7F8E;font-weight:600}
.cfhud-pips{display:flex;gap:6px}
.cfhud-pips i{width:7px;height:7px;transform:rotate(45deg);border:1px solid rgba(184,121,106,.7);background:#0b0810}
.cfhud-pips i.is-got{background:#FF9A3C;border-color:#FFD6A0;box-shadow:0 0 6px rgba(255,154,60,.7)}
.cfhud-spark{position:absolute;left:0;top:0;width:5px;height:5px;margin:-2.5px;border-radius:50%;background:#FFD6A0;box-shadow:0 0 8px 2px rgba(255,154,60,.85);pointer-events:none}
@container (max-width:640px){
  .cfhud{right:auto;left:50%;top:14px;padding:11px 16px 11px 12px;gap:12px}
  .cfhud-gem{width:58px;height:97px}
  .cfhud-label{font-size:16px}
  .cfhud-count{font-size:25px}
}`;
let cssDone = false, uid = 0;
const VB = [250, 4, 640, 1072];

export function createFragmentHUD({ mount = document.body, mode = 'fixed', holdMs = 3000, collected = [], tex = 'assets/tex/512/crystal-face.webp' } = {}) {
  if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; }
  const root = hudRoot(mount, mode), id = `cf${++uid}`;
  const defs = FRAGMENTS.map((P, i) => `<clipPath id="${id}-${i}"><path d="${svgPath(P)}"/></clipPath>`).join('');
  const pieces = FRAGMENTS.map((P, i) => `<path class="cfhud-empty" d="${svgPath(P)}"/>
    <g class="cfhud-piece" data-i="${i}" clip-path="url(#${id}-${i})"><image href="${tex}" x="0" y="0" width="1092" height="1092"/><rect x="0" y="0" width="1092" height="1092" fill="#ff8a3c" opacity=".14"/></g>
    <path class="cfhud-edge" d="${svgPath(P)}"/>`).join('');
  root.innerHTML = `<div class="cfhud" role="status" aria-live="polite">
    <div class="cfhud-gem"><svg viewBox="${VB.join(' ')}" aria-hidden="true"><defs>${defs}</defs>${pieces}</svg></div>
    <div class="cfhud-info"><span class="cfhud-label">${TEXT.fragmentsHud}</span><span class="cfhud-count"><b>0</b><span>/5</span></span><span class="cfhud-pips">${'<i></i>'.repeat(5)}</span></div>
  </div>`;
  const panel = root.querySelector('.cfhud'), gem = root.querySelector('.cfhud-gem'), countEl = root.querySelector('.cfhud-count'), countN = countEl.querySelector('b');
  const piece = [...root.querySelectorAll('.cfhud-piece')], edge = [...root.querySelectorAll('.cfhud-edge')], pips = [...root.querySelectorAll('.cfhud-pips i')];
  const got = FRAGMENTS.map((_, i) => collected.includes(i));
  const motion = hudMotion(root, panel, { mode, holdMs });
  let last = -1;
  const paint = () => { piece.forEach((p, i) => p.classList.toggle('is-got', got[i])); pips.forEach((p, i) => p.classList.toggle('is-got', got[i])); gem.classList.toggle('has-any', got.some(Boolean)); countN.textContent = got.filter(Boolean).length; };
  paint();

  function glowIn(t, i) {
    const p = piece[i], e = edge[i], [cx, cy] = centroid(FRAGMENTS[i]);
    p.classList.remove('is-got'); pips[i].classList.remove('is-got');
    const sx = gem.clientWidth / VB[2], gx = (cx - VB[0]) * sx, gy = (cy - VB[1]) * sx;
    t.set(p, { opacity: 0 })
      .fromTo(e, { opacity: 0, strokeWidth: 22 }, { opacity: 1, strokeWidth: 9, duration: 0.35, ease: 'power2.out' })
      .fromTo(p, { opacity: 0, scale: 1.35, svgOrigin: `${cx} ${cy}`, filter: 'brightness(2.6)' }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }, '<0.1')
      .to(p, { filter: 'brightness(1)', duration: 0.6 }, '>-0.1')
      .call(() => {
        for (let k = 0; k < 12; k++) {
          const s = document.createElement('span'); s.className = 'cfhud-spark'; gem.appendChild(s);
          const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 30;
          gsap.fromTo(s, { x: gx, y: gy, opacity: 1, scale: 0.6 + Math.random() }, { x: gx + Math.cos(a) * d, y: gy + Math.sin(a) * d, opacity: 0, scale: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => s.remove() });
        }
      }, null, '<-0.5')
      .call(() => { countN.textContent = got.filter(Boolean).length; pips[i].classList.add('is-got'); gem.classList.add('has-any'); }, null, '<')
      .fromTo(countEl, { scale: 1.4, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, '<')
      .to(e, { opacity: 0.85, duration: 0.5 }, '>-0.2')
      .call(() => { p.classList.add('is-got'); gsap.set([p, e], { clearProps: 'opacity,filter,strokeWidth' }); }, null, '>');
  }
  const run = i => motion.run(t => glowIn(t, i));
  return {
    el: root,
    get collected() { return got.slice(); },
    collect(i) { if (i < 0 || i > 4) return; got[i] = true; last = i; run(i); },
    next() { const i = got.indexOf(false); if (i >= 0) this.collect(i); return i; },
    replay() { if (last >= 0) run(last); },
    reset() { motion.stop(); got.fill(false); last = -1; piece.forEach(p => gsap.set(p, { clearProps: 'all' })); paint(); motion.reset(); },
    set(list) { got.fill(false); list.forEach(i => (got[i] = true)); paint(); },
  };
}
