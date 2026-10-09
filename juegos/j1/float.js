// Objeto flotante (la parte reutilizable de "07 Flotar y recolectar", sin el sitio de prueba).
// Vive en una capa fija y transparente; solo el botón circular del objeto recibe clics.
// Movimiento: un ancla que se desliza con resorte amortiguado hacia puntos libres de toda la pantalla
// (prefiere destinos lejanos, así la recorre de lado a lado), más una deriva de ruido suave. El scroll
// lo arrastra un poco con el contenido, como si flotara en agua, y lo manda a otro punto.
// Nunca se queda encima del nav, enlaces, botones o formularios: si el contenido que pasa por debajo
// lo alcanza, se aparta y mientras tanto se vuelve casi transparente y deja pasar los clics.
import * as THREE from './vendor/three.module.min.js';
import { gsap } from './vendor/gsap.min.js';
import { BUILDERS, setupRenderer, makeEnv, addLights, framed, texturesReady, disposeTree, disposeShared } from './lib/objects.js';
import { createLoop } from './lib/loop.js';

// Todo lo que el objeto no debe tapar.
const AVOID = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'label', 'summary', 'iframe', 'video[controls]', 'audio[controls]',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])', 'form', '.nav', '.site-header', '.lang-switch',
].join(',');

// Ruido de gradiente 1D (Perlin) con dos octavas: deriva orgánica, nunca periódica.
function noise(seed) {
  const g = Array.from({ length: 256 }, (_, i) => { const x = Math.sin((i + 1) * 127.1 + seed * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; });
  const n = (x) => { const i = Math.floor(x), f = x - i, a = g[i & 255] * f, b = g[(i + 1) & 255] * (f - 1), u = f * f * f * (f * (f * 6 - 15) + 10); return (a + (b - a) * u) * 2; };
  return (t) => n(t) * 0.7 + n(t * 2.13 + 17.3) * 0.3;
}

export async function createFloat({ key, label, reduced = false, onCollect }) {
  const mobile = () => innerWidth < 640;
  const box = mobile() ? 140 : 176; // lienzo; el modelo ocupa ~62 % (≈ 87 / 109 px)
  const vis = Math.round(box * 0.62); // tamaño visible del objeto
  const hitPx = Math.max(56, Math.round(box * 0.5));

  const el = document.createElement('div');
  el.className = 'lj1-scope lj1-float';
  el.style.setProperty('--lj1-box', `${box}px`);
  el.style.setProperty('--lj1-hit', `${hitPx}px`);
  el.innerHTML = '<div class="lj1-float__glow"></div><div class="lj1-float__flash"></div><canvas class="lj1-float__canvas"></canvas><button type="button" class="lj1-float__hit"></button>';
  const glow = el.children[0], flash = el.children[1], canvas = el.children[2], hit = el.children[3];
  hit.setAttribute('aria-label', label);

  // ── escena ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  setupRenderer(renderer); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(box, box, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const env = makeEnv(renderer); scene.environment = env; addLights(scene);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  const RADIUS = 0.5, CAM_D = RADIUS / Math.sin(THREE.MathUtils.degToRad(15)) / 0.6;
  cam.position.set(0, CAM_D * 0.1, CAM_D); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  const spin = new THREE.Group(); scene.add(spin);
  const obj = BUILDERS[key](), fit = framed(obj, 1);
  fit.scale.multiplyScalar(RADIUS / fit.userData.radius);
  spin.add(fit); spin.scale.setScalar(0.0001);
  const S = { scale: 0, spin: 0 };
  let yaw = 0;
  const sway = obj.userData.sway;

  const lean = { x: 0, z: 0 }; // inclinación según la velocidad: se "deja llevar" al desplazarse
  const draw = (t, dt) => {
    yaw += dt * ((sway || reduced ? 0 : 0.45) + S.spin);
    if (!reduced && dt) {
      const k = 1 - Math.exp(-dt * 4);
      lean.z += (Math.max(-0.35, Math.min(0.35, -A.vx * 0.0011)) - lean.z) * k;
      lean.x += (Math.max(-0.3, Math.min(0.3, A.vy * 0.0009)) - lean.x) * k;
    }
    spin.rotation.y = yaw + (sway && !reduced ? Math.sin(t * 0.6) * sway : 0);
    spin.rotation.x = lean.x;
    spin.rotation.z = reduced ? 0 : Math.sin(t * 0.8) * 0.06 + lean.z;
    spin.position.y = reduced ? 0 : Math.sin(t * 1.4) * 0.05;
    spin.scale.setScalar(Math.max(0.0001, S.scale));
    if (obj.userData.tick) obj.userData.tick(reduced ? 0 : t, dt);
    renderer.render(scene, cam);
  };

  // ── espacio libre ──
  let rects = [], rectsAt = 0, dirty = true;
  const markDirty = () => { dirty = true; };
  function readObstacles() {
    const vw = innerWidth, vh = innerHeight, out = [];
    for (const n of document.querySelectorAll(AVOID)) {
      if (el.contains(n) || n.closest('.lj1-scope')) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      if (r.width * r.height > vw * vh * 0.6) continue; // capas de pantalla completa (scrims) no son destinos de clic
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.pointerEvents === 'none' || cs.opacity === '0') continue;
      out.push([r.left, r.top, r.right, r.bottom]);
    }
    rects = out; rectsAt = performance.now(); dirty = false;
  }
  const pad = 10;
  const blocked = (cx, cy, half) => {
    const l = cx - half - pad, t = cy - half - pad, r = cx + half + pad, b = cy + half + pad;
    for (const q of rects) if (l < q[2] && r > q[0] && t < q[3] && b > q[1]) return true;
    return false;
  };
  const area = () => {
    const top = (() => { const nav = document.querySelector('.nav, .site-header'); const b = nav ? nav.getBoundingClientRect().bottom : 0; return b > 0 && b < innerHeight / 2 ? b : 0; })();
    const m = vis / 2 + 12;
    return { x0: m, x1: innerWidth - m, y0: top + m, y1: innerHeight - m - 8 };
  };
  const amp = () => (reduced ? 0 : Math.min(64, Math.min(innerWidth, innerHeight) * 0.08));
  const nextAt = (now) => now + 4000 + Math.random() * 3000; // cada 4–7 s busca otro punto

  // Busca un punto libre (centro del objeto). near = buscar lejos del punto actual y de los últimos
  // destinos (así va repartiéndose por toda la pantalla); closest = el hueco más cercano (para escapar
  // rápido cuando el contenido le pasa por debajo).
  const visited = [];
  function freeSpot(near, closest = false) {
    const a = area();
    if (a.x1 <= a.x0 || a.y1 <= a.y0) return null;
    const half = vis / 2, wob = amp();
    let best = null, bestScore = -Infinity;
    for (let k = 0; k < 64; k++) {
      const x = a.x0 + Math.random() * (a.x1 - a.x0), y = a.y0 + Math.random() * (a.y1 - a.y0);
      if (blocked(x, y, half + wob)) continue;
      const d = near ? Math.hypot(x - near.x, y - near.y) : 0;
      let score;
      if (closest) score = -d;
      else {
        let far = near ? d : 0; // distancia al más cercano de: punto actual + últimos destinos
        for (const v of visited) far = Math.min(far || Infinity, Math.hypot(x - v.x, y - v.y));
        score = (far === Infinity ? 0 : far) + Math.random() * 90;
      }
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    if (!best) {
      for (let k = 0; k < 64; k++) {
        const x = a.x0 + Math.random() * (a.x1 - a.x0), y = a.y0 + Math.random() * (a.y1 - a.y0);
        if (!blocked(x, y, half)) return { x, y, tight: true };
      }
    }
    return best;
  }

  // ── movimiento ──
  // state: 'away' (invisible, sin hueco o reubicándose) · 'shown' (flotando)
  const nx = noise(Math.random() * 100), ny = noise(Math.random() * 100 + 50);
  const A = { x: 0, y: 0, vx: 0, vy: 0 }; // ancla con resorte críticamente amortiguado
  const OMEGA = 1.05, OMEGA_ESCAPE = 2.8; // ~3.5 s para deslizarse a un punto nuevo; ~1.3 s para apartarse
  let W = null, nextPick = 0, state = 'away', fading = false, shy = false, escaping = false, collecting = false, gone = false;
  const pos = { x: 0, y: 0 };
  let lastScroll = scrollY, scrolled = 0;

  const setW = (sp) => { W = sp; visited.push({ x: sp.x, y: sp.y }); if (visited.length > 4) visited.shift(); };
  function place(x, y) { pos.x = x; pos.y = y; el.style.transform = `translate3d(${(x - box / 2).toFixed(1)}px,${(y - box / 2).toFixed(1)}px,0)`; }
  function setShy(v) {
    if (shy === v) return;
    shy = v; el.classList.toggle('is-shy', v);
    gsap.to(el, { opacity: v ? 0.18 : 1, duration: v ? 0.25 : 0.5, ease: 'power2.out', overwrite: 'auto' });
  }
  function goAway() { // se desvanece; al terminar, el loop decide dónde reaparecer (o se pausa si no hay hueco)
    state = 'away'; fading = true; shy = false; el.classList.add('is-shy');
    gsap.to(el, { opacity: 0, duration: reduced ? 0.35 : 0.3, ease: 'power1.in', overwrite: 'auto', onComplete: () => { fading = false; } });
  }
  function appear(s) {
    state = 'shown'; setW(s); A.x = s.x; A.y = s.y; A.vx = A.vy = 0;
    nextPick = reduced ? Infinity : nextAt(performance.now());
    el.classList.remove('is-shy');
    gsap.to(el, { opacity: 1, duration: reduced ? 0.45 : 0.6, ease: 'power2.out', overwrite: 'auto' });
  }

  function step(t, dt) {
    const now = performance.now();
    if (dirty || now - rectsAt > 250) readObstacles(); // durante el scroll, en cada cuadro; si no, 4 veces por segundo (carruseles, animaciones de entrada)
    const dy = scrollY - lastScroll; lastScroll = scrollY;
    if (!collecting) {
      if (state === 'away') {
        if (!fading) {
          const s = freeSpot(null);
          if (s) { place(s.x, s.y); appear(s); } else loop.pause('away'); // idleCheck lo despierta
        }
      } else {
        if (!escaping && blocked(pos.x, pos.y, vis / 2) && !reduced) {
          // el contenido le pasó por debajo: al hueco libre más cercano, rápido
          const s = freeSpot(pos, true);
          if (s) { setW(s); escaping = true; nextPick = nextAt(now); } else goAway();
        } else if (blocked(W.x, W.y, vis / 2)) {
          // el contenido se movió bajo el punto de destino: con movimiento reducido, desvanecer y reaparecer
          const s = reduced ? null : freeSpot(A);
          if (s) { setW(s); nextPick = nextAt(now); } else goAway();
        } else if (now > nextPick) {
          const s = freeSpot(A);
          if (s) setW(s);
          nextPick = nextAt(now);
        }
        // scroll: el contenido lo arrastra un poco (con inercia) y, tras un buen tramo, se va a otro punto
        if (dy && state === 'shown' && !reduced) {
          const k = Math.max(-140, Math.min(140, dy));
          A.y -= k * 0.4; A.vy = Math.max(-900, Math.min(900, A.vy - k * 3.2));
          scrolled += Math.abs(dy);
          if (scrolled > innerHeight * 0.35 && !escaping) { scrolled = 0; const s = freeSpot(A); if (s) { setW(s); nextPick = nextAt(now); } }
        }
        if (state === 'shown') {
          const w0 = escaping ? OMEGA_ESCAPE : OMEGA;
          A.vx += ((W.x - A.x) * w0 * w0 - A.vx * 2 * w0) * dt;
          A.vy += ((W.y - A.y) * w0 * w0 - A.vy * 2 * w0) * dt;
          A.x += A.vx * dt; A.y += A.vy * dt;
          { const a = area(); A.y = Math.min(a.y1 + 120, Math.max(a.y0 - 120, A.y)); }
          const w = W.tight ? amp() * 0.25 : amp(), a = area();
          const x = Math.min(a.x1, Math.max(a.x0, A.x + nx(t * 0.16) * w));
          const y = Math.min(a.y1, Math.max(a.y0, A.y + ny(t * 0.13) * w));
          place(x, y);
          const b = blocked(x, y, vis / 2);
          if (!b) escaping = false;
          setShy(b);
        }
      }
    }
    draw(t, dt);
  }
  const loop = createLoop(step);

  // pausa si el objeto sale de la pantalla (p. ej. al cambiar el tamaño del viewport)
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => (e.isIntersecting ? loop.resume('offscreen') : loop.pause('offscreen'))) : null;
  // mientras está oculto por falta de espacio, se revisa con calma si ya hay hueco
  const idleCheck = setInterval(() => { if (state === 'away' && !loop.running && !collecting && !gone) { readObstacles(); if (freeSpot(null)) loop.resume('away'); } }, 500);
  const onResize = () => { markDirty(); if (state === 'shown') nextPick = 0; };
  addEventListener('scroll', markDirty, { passive: true });
  addEventListener('resize', onResize, { passive: true });

  // ── recolectar ──
  function burst() {
    for (let k = 0; k < 18; k++) {
      const s = document.createElement('span'); s.className = 'lj1-spark'; el.appendChild(s);
      const a = Math.random() * Math.PI * 2, d = box * (0.34 + Math.random() * 0.4), sz = 0.6 + Math.random();
      gsap.fromTo(s, { x: 0, y: 0, scale: sz, opacity: 1 }, { x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, opacity: 0, duration: 0.55 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => s.remove() });
    }
  }
  let pulse = null;
  function collect() {
    if (collecting || gone || shy || state !== 'shown') return;
    collecting = true; hit.disabled = true;
    if (pulse) pulse.kill();
    gsap.killTweensOf(el);
    gsap.set(el, { opacity: 1 });
    const done = () => { onCollect && onCollect(); };
    if (reduced) {
      gsap.timeline().to(el, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }).call(done);
      return;
    }
    gsap.timeline()
      .to(S, { scale: 1.35, duration: 0.18, ease: 'back.out(3)' })
      .to(flash, { opacity: 1, scale: 1.25, duration: 0.18, ease: 'power2.out' }, 0)
      .to(glow, { opacity: 1, scale: 1.6, duration: 0.18 }, 0)
      .call(burst, null, 0.08)
      .to(S, { spin: 14, duration: 0.55, ease: 'power2.in' }, 0.1)
      .to(S, { scale: 0, duration: 0.34, ease: 'power3.in' }, 0.3)
      .to(flash, { opacity: 0, scale: 0.6, duration: 0.45, ease: 'power2.in' }, 0.25)
      .to(glow, { opacity: 0, scale: 0.4, duration: 0.4 }, 0.3)
      .call(done, null, 0.62)
      .to(el, { opacity: 0, duration: 0.2 }, 0.75);
  }
  hit.addEventListener('click', collect);

  // ── arranque ──
  await texturesReady();
  document.body.appendChild(el);
  readObstacles();
  draw(0, 0); // primer cuadro (compila shaders) antes de mostrarlo
  if (io) io.observe(el);
  loop.start(); // state 'away': el primer cuadro lo coloca en un punto libre y lo hace aparecer
  if (reduced) S.scale = 1;
  else gsap.to(S, { scale: 1, duration: 0.9, ease: 'back.out(1.6)', delay: 0.15 });
  if (!reduced) pulse = gsap.fromTo(glow, { opacity: 0.18, scale: 0.9 }, { opacity: 0.5, scale: 1.08, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  return {
    el,
    get shown() { return state === 'shown' && !shy && !collecting; },
    setLabel(text) { hit.setAttribute('aria-label', text); },
    // Se despide sin ser recolectado (rotación): se encoge y se desvanece. Después hay que llamar destroy().
    leave() {
      if (collecting || gone) return Promise.resolve();
      collecting = true; hit.disabled = true;
      if (pulse) pulse.kill();
      return new Promise((resolve) => {
        if (reduced || state !== 'shown') { gsap.to(el, { opacity: 0, duration: 0.5, ease: 'power1.inOut', overwrite: 'auto', onComplete: resolve }); return; }
        gsap.timeline({ onComplete: resolve })
          .to(S, { scale: 0, duration: 0.75, ease: 'back.in(1.6)' })
          .to(glow, { opacity: 0, scale: 0.5, duration: 0.5 }, 0)
          .to(el, { opacity: 0, duration: 0.45, ease: 'power1.in', overwrite: 'auto' }, 0.3);
      });
    },
    // Libera todo. keepShared: no tocar las cachés compartidas (el altar ya construido las usa).
    destroy({ keepShared = false } = {}) {
      if (gone) return; gone = true;
      loop.dispose(); if (io) io.disconnect(); clearInterval(idleCheck);
      removeEventListener('scroll', markDirty); removeEventListener('resize', onResize);
      hit.removeEventListener('click', collect);
      gsap.killTweensOf([S, el, glow, flash]); if (pulse) pulse.kill();
      el.querySelectorAll('.lj1-spark').forEach((s) => gsap.killTweensOf(s));
      disposeTree(scene); env.dispose();
      if (!keepShared) disposeShared();
      renderer.dispose(); renderer.forceContextLoss();
      el.remove();
    },
  };
}
