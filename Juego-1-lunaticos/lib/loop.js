// Background-tab keep-alive + render loop. Browsers pause rAF in hidden tabs/iframes;
// this keeps GSAP timelines (and render loops) advancing so sequences don't freeze or jump.
//   keepGsapAlive()   GSAP only (pages without a 3D loop). Safe to call many times — one ticker per page.
//   runLoop(fn)       fn(t, dt) every frame; also keeps GSAP alive.

let alive = false;
export function keepGsapAlive() {
  if (alive) return; alive = true;
  // Hidden tabs throttle timers to ~1 tick/s. GSAP's lag smoothing would count each 1 s gap as 33 ms
  // (≈30× slow-down), so it is off while hidden; on return one catch-up tick runs, then it is restored.
  document.addEventListener('visibilitychange', () => {
    if (!window.gsap) return;
    if (document.hidden) gsap.ticker.lagSmoothing(0);
    else { gsap.ticker.tick(); gsap.ticker.lagSmoothing(500, 33); }
  });
  // GSAP's own ticker runs on rAF while visible; this only drives it while hidden.
  setInterval(() => { if (document.hidden && window.gsap) gsap.ticker.tick(); }, 16);
}

export function runLoop(fn) {
  keepGsapAlive();
  let last = performance.now(), raf = 0, to = 0;
  const schedule = () => { if (document.hidden) to = setTimeout(step, 16); else raf = requestAnimationFrame(step); };
  const step = () => {
    raf = to = 0;
    // visible: cap at 50 ms so a stall never jumps; hidden: frames arrive ~1/s, so allow up to 1 s
    const now = performance.now(), dt = Math.min((now - last) / 1000, document.hidden ? 1 : 0.05); last = now;
    fn(now / 1000, dt);
    schedule();
  };
  // a pending rAF never fires once the page is hidden — reschedule on every visibility change
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); clearTimeout(to); schedule(); });
  step();
}
