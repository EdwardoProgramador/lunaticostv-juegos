// LunaticosTv · Los objetos del Cholo — collection HUD (DOM + GSAP, no framework)
// const hud = createHUD({ mount: document.body });  hud.collect(2);  hud.reset();
// holdMs: Infinity keeps the HUD on screen after a collect (used by 09).
// The HUD sits in a full-size overlay root (fixed by default). Its position switches
// from top-right to top-center when the root is ≤ 640px wide (container query).

export const HUD_ITEMS = [
  { key: 'cassette', name: 'Cassette' },
  { key: 'microphone', name: 'Micrófono' },
  { key: 'candle', name: 'Vela' },
  { key: 'notebook', name: 'Libreta' },
  { key: 'medallion', name: 'Medalla' },
];

const CSS = `
.chud-root{position:fixed;inset:0;pointer-events:none;z-index:60;container-type:inline-size;overflow:hidden}
.chud-root--abs{position:absolute}
.chud-root--static{position:relative;inset:auto;overflow:visible;container-type:normal;z-index:auto}
.chud{position:absolute;top:22px;right:22px;padding:12px 14px 14px;visibility:hidden;
  background:linear-gradient(180deg,rgba(28,20,36,.94),rgba(9,8,17,.94));
  border:1px solid rgba(184,121,106,.6);
  box-shadow:0 0 0 1px #1E1A22,0 14px 40px rgba(0,0,0,.65),inset 0 1px 0 rgba(242,210,188,.14),inset 0 0 0 3px rgba(10,8,16,.9),inset 0 0 0 4px rgba(184,121,106,.22)}
.chud-root--static .chud{position:relative;top:auto;right:auto;visibility:visible;display:inline-block}
.chud-head{display:flex;justify-content:space-between;align-items:baseline;gap:18px;margin:0 2px 10px}
.chud-label{font:600 12px/1 var(--f-ui);letter-spacing:.24em;text-transform:uppercase;color:#B8796A;white-space:nowrap}
.chud-count{display:inline-block;font:700 24px/1 var(--f-ui);letter-spacing:.02em;color:#F2D2BC;font-variant-numeric:tabular-nums;transform-origin:100% 70%}
.chud-count span{color:#8C7F8E;font-weight:600}
.chud-slots{display:flex;gap:8px;list-style:none;margin:0;padding:0}
.chud-slot{position:relative;width:64px;height:64px;border:2px solid transparent;
  background:
    radial-gradient(circle at 4px 4px,#F2D2BC 0 1.4px,transparent 2px),
    radial-gradient(circle at calc(100% - 4px) 4px,#F2D2BC 0 1.4px,transparent 2px),
    radial-gradient(circle at 4px calc(100% - 4px),#F2D2BC 0 1.4px,transparent 2px),
    radial-gradient(circle at calc(100% - 4px) calc(100% - 4px),#F2D2BC 0 1.4px,transparent 2px),
    radial-gradient(ellipse at 50% 42%,#4a3a58 0%,#251b30 55%,#0e0a14 100%) padding-box,
    linear-gradient(135deg,#F2D2BC,#B8796A 30%,#4f3029 52%,#B8796A 76%,#e7b9a0) border-box;
  box-shadow:0 0 0 1px #1E1A22,inset 0 0 0 1px #1E1A22,inset 0 0 0 3px rgba(184,121,106,.28);
  transition:box-shadow .4s}
.chud-slot img{position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px);object-fit:contain;display:block}
.chud-col{opacity:0}
.chud-slot.is-got .chud-col{opacity:1}
.chud-slot.is-got{box-shadow:0 0 0 1px #1E1A22,inset 0 0 0 1px #1E1A22,inset 0 0 0 3px rgba(184,121,106,.28),inset 0 0 18px rgba(255,154,60,.22),0 0 12px rgba(255,154,60,.18)}
@container (max-width:640px){
  .chud{right:auto;left:50%;top:12px;padding:10px 10px 11px}
  .chud-slot{width:52px;height:52px}
  .chud-slots{gap:6px}
  .chud-count{font-size:21px}
}`;

let cssDone = false;
export function injectCSS() { if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; } } // also used by tray.js (.chud-slot look)

// Shared by every HUD (objects here, fragments in fragment-hud.js): the full-size overlay root…
export function hudRoot(mount, mode) {
  injectCSS();
  const root = document.createElement('div');
  root.className = 'chud-root' + (mode === 'absolute' ? ' chud-root--abs' : mode === 'static' ? ' chud-root--static' : '');
  mount.appendChild(root);
  return root;
}
// …and the motion: slide in from the right (from the top when the root is ≤ 640px), hold, slide out.
// run(build) slides in if needed, lets build(timeline) add the collect effect, then schedules the hide.
export function hudMotion(root, panel, { mode = 'fixed', holdMs = 3000 } = {}) {
  let visible = mode === 'static', tl = null, hideCall = null;
  const isMobile = () => root.clientWidth <= 640;
  const offscreen = () => isMobile() ? { xPercent: -50, x: 0, y: -(panel.offsetHeight + 30) } : { xPercent: 0, y: 0, x: panel.offsetWidth + 40 };
  function show(t) {
    if (visible) return;
    visible = true;
    t.set(panel, { visibility: 'visible' }).fromTo(panel, offscreen(), { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
  }
  function hide() {
    if (!visible || mode === 'static') return;
    gsap.to(panel, { ...offscreen(), duration: 0.45, ease: 'power3.in', onComplete: () => { visible = false; gsap.set(panel, { visibility: 'hidden' }); } });
  }
  return {
    run(build) {
      if (tl) tl.progress(1).kill();
      if (hideCall) hideCall.kill();
      gsap.killTweensOf(panel);
      tl = gsap.timeline();
      if (!visible) { show(tl); tl.addLabel('in', '>-0.1'); } else tl.addLabel('in');
      tl.add(() => {}, 'in');
      build(tl);
      if (mode !== 'static' && holdMs !== Infinity) tl.call(() => { hideCall = gsap.delayedCall(holdMs / 1000, hide); });
      return tl;
    },
    hide,
    stop() { if (tl) tl.kill(); if (hideCall) hideCall.kill(); gsap.killTweensOf(panel); },
    reset() { if (mode !== 'static') { visible = false; gsap.set(panel, { visibility: 'hidden', x: 0, y: 0 }); } },
    get visible() { return visible; },
  };
}

export function createHUD({ mount = document.body, base = 'assets/hud/', mode = 'fixed', holdMs = 3000, collected = [] } = {}) {
  const root = hudRoot(mount, mode);
  root.innerHTML = `<div class="chud" role="status" aria-live="polite">
    <div class="chud-head"><span class="chud-label">Objetos del Cholo</span><span class="chud-count"><b>0</b><span>/5</span></span></div>
    <ol class="chud-slots">${HUD_ITEMS.map((it, i) => `<li class="chud-slot" data-i="${i}" aria-label="${it.name}"><img class="chud-sil" src="${base}${it.key}-sil.png" alt=""><img class="chud-col" src="${base}${it.key}.png" alt=""></li>`).join('')}</ol>
  </div>`;
  const panel = root.querySelector('.chud'), countEl = root.querySelector('.chud-count'), countN = countEl.querySelector('b');
  const slots = [...root.querySelectorAll('.chud-slot')];
  const got = HUD_ITEMS.map((_, i) => collected.includes(i));
  const motion = hudMotion(root, panel, { mode, holdMs });
  let last = -1;

  const paint = () => { slots.forEach((s, i) => s.classList.toggle('is-got', got[i])); countN.textContent = got.filter(Boolean).length; };
  paint();
  function flicker(t, i) {
    const s = slots[i], col = s.querySelector('.chud-col');
    s.classList.remove('is-got');
    t.call(() => { countN.textContent = got.filter(Boolean).length; })
      .fromTo(countEl, { scale: 1.4, color: '#FF9A3C' }, { scale: 1, color: '#F2D2BC', duration: 0.5, ease: 'power2.out' }, '<');
    const R = gsap.utils.random;
    for (let k = 0; k < 4; k++) {
      const a = R(0, 40) | 0, b = R(0, 40) | 0;
      t.set(col, { opacity: 1, x: R(-4, 4), clipPath: k < 3 ? `inset(${a}% 0 ${b}% 0)` : 'inset(0% 0 0% 0)', filter: 'brightness(1.9) contrast(1.3)' }, `>+${R(0.04, 0.09).toFixed(3)}`)
       .set(s, { x: R(-2, 2) }, '<')
       .set(col, { opacity: 0, x: 0, filter: 'none' }, `>+${R(0.05, 0.1).toFixed(3)}`)
       .set(s, { x: 0 }, '<');
    }
    t.set(col, { opacity: 1, clipPath: 'inset(0% 0 0% 0)', filter: 'brightness(1.6)' }, '>+0.06')
     .to(col, { filter: 'brightness(1)', duration: 0.5 })
     .call(() => { s.classList.add('is-got'); gsap.set(col, { clearProps: 'opacity,filter,clipPath,x' }); }, null, '<');
  }
  const run = i => motion.run(t => flicker(t, i));
  return {
    el: root,
    get collected() { return got.slice(); },
    collect(i) { if (i < 0 || i > 4) return; got[i] = true; last = i; run(i); },
    next() { const i = got.indexOf(false); if (i >= 0) this.collect(i); return i; },
    replay() { if (last >= 0) run(last); },
    reset() {
      motion.stop();
      got.fill(false); last = -1; paint();
      motion.reset();
    },
    set(list) { got.fill(false); list.forEach(i => (got[i] = true)); paint(); },
  };
}
