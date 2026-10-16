// Loop de render del juego (adaptado de juego1-v2/lib/loop.js para el sitio).
// Diferencias con el Design: con la pestaña oculta el loop se detiene (en el sitio no hay secuencia que deba avanzar en
// segundo plano; GSAP también se pausa y retoma donde iba) y se puede pausar por motivos propios ('offscreen', 'closed'…).
// Al volver, dt se limita a 50 ms para que nada salte.
//   const loop = runLoop((t, dt) => { … });  loop.pause('offscreen');  loop.resume('offscreen');  loop.dispose();
export function runLoop(fn, { autostart = true } = {}) {
  let raf = 0, last = 0, running = false, wanted = false, dead = false;
  const reasons = new Set();
  const step = (now) => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    fn(now / 1000, dt);
    if (running) raf = requestAnimationFrame(step);
  };
  const sync = () => {
    const on = !dead && wanted && !document.hidden && reasons.size === 0;
    if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(step); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); raf = 0; }
  };
  document.addEventListener('visibilitychange', sync);
  const loop = {
    get running() { return running; },
    start() { wanted = true; sync(); },
    stop() { wanted = false; sync(); },
    pause(reason) { reasons.add(reason); sync(); },
    resume(reason) { reasons.delete(reason); sync(); },
    dispose() { dead = true; sync(); document.removeEventListener('visibilitychange', sync); },
  };
  if (autostart) loop.start();
  return loop;
}
