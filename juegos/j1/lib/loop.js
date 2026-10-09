// Render loop (port de Juego-1-lunaticos/lib/loop.js).
// Diferencia con el original: aquí el loop se detiene con la pestaña oculta (en el sitio no hay
// secuencia que deba avanzar en segundo plano) y se puede pausar por motivos propios
// ('offscreen', 'hidden'…). Al volver, dt se limita a 50 ms para que nada salte.
//   const loop = createLoop((t, dt) => { … }); loop.start(); loop.pause('offscreen'); loop.resume('offscreen'); loop.dispose();
export function createLoop(fn) {
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
  return {
    get running() { return running; },
    start() { wanted = true; sync(); },
    stop() { wanted = false; sync(); },
    pause(reason) { reasons.add(reason); sync(); },
    resume(reason) { reasons.delete(reason); sync(); },
    dispose() { dead = true; sync(); document.removeEventListener('visibilitychange', sync); },
  };
}
