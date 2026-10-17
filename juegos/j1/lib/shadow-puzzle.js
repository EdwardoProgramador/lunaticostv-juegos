// Shadow puzzle (level 2, 16B): the 5 fragments float as a loose cluster in front of the painting; the main candle
// projects their shadows onto the canvas in real time. Drag to rotate the cluster on two axes (with inertia). Only one
// orientation makes the shadows form the target silhouette 'lunas' (the twin crescents of the crystal, over the clouds).
// Closer = sharper shadow + steadier candle; within tolerance it snaps, the silhouette locks with a glow, and the
// fragments fuse into the full crystal.
//
// How the shadows are made: each fragment carries an invisible "caster" — its share of the target silhouette,
// back-projected from the candle onto a plane through the fragment. The share is the silhouette clipped by the
// fragment's cell, and the cell borders are jagged glass cracks (shared by both neighbours), so at the solution the
// casters' projections tile the silhouette exactly; at any other angle they fall apart into sharp, irregular shards.
// Glass, not stone: every fragment also casts its real outline (the cracked shard, copper rim on the outer edges) as a
// faint copper-tinted glass shadow; the moon shares are denser, with a dark rim, a bright refracted line and a few
// fracture lines. All of it is semi-transparent and sharp; the glass detail fades out as the pieces line up.
// Port: Three/GSAP locales, page.hint recibe la clave de ../i18n.js, nudge() para jugar con las flechas del teclado.
import * as THREE from '../vendor/three-0.184.0/three.module.min.js';
import { gsap } from '../vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ clipConvex, area, centroid }, { PUZZLE_SCALE, playFuse, crystalFX }, { toShard }, { glowSprite }] = await Promise.all([
  import(`./crystal-shape.js${V}`),
  import(`./crystal-fx.js${V}`),
  import(`./crystal.js${V}`),
  import(`./objects.js${V}`),
]);

// ---------- targets (painting uv: u 0…1 left→right, v 0…1 top→bottom) ----------
function crescent(cx, cy, R, ang, dFrac = 0.42, n = 44, W = 1.1, H = 1.35) {
  const d = R * dFrac, a = Math.acos(d / (2 * R)), pts = [];
  for (let k = 0; k <= n; k++) { const t = ang + a + (2 * Math.PI - 2 * a) * k / n; pts.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
  const ox = cx + d * Math.cos(ang), oy = cy + d * Math.sin(ang);
  for (let k = 1; k < n; k++) { const t = ang + Math.PI + a - (2 * a) * k / n; pts.push([ox + R * Math.cos(t), oy + R * Math.sin(t)]); }
  return pts.map(([x, y]) => [x / W, y / H]);
}
const D2R = Math.PI / 180;
// cells: one per fragment (1 top right · 2 upper left · 3 middle right · 4 lower left · 5 lower right), like the shard
function cells({ aTop, aBot, l0, l1, r1a, r1b, r2a, r2b }) {
  const xA = v => aTop + (aBot - aTop) * (v + 0.3) / 1.6, E = 1.3, B = -0.3;
  return Object.assign([
    [[xA(B), B], [E, B], [E, r1b], [xA(r1a), r1a]],
    [[B, B], [xA(B), B], [xA(l1), l1], [B, l0]],
    [[xA(r1a), r1a], [E, r1b], [E, r2b], [xA(r2a), r2a]],
    [[B, l0], [xA(l1), l1], [xA(E), E], [B, E]],
    [[xA(r2a), r2a], [E, r2b], [E, E], [xA(E), E]],
  ], { xA });
}
// Jagged glass crack along every inner cell border. Only inserted points move; the corners stay put, and a border
// shared by two cells gets the same points from both sides (vertical line: global v grid; cross lines: canonical order).
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const JAG = 0.012, VSTEP = 0.042, CSTEP = 0.045;
function jagCell(cell, xA) {
  const B = -0.3, E = 1.3, on = (a, b) => Math.abs(a - b) < 1e-9, onV = p => on(p[0], xA(p[1]));
  const border = (p, q) => (on(p[0], q[0]) && (on(p[0], B) || on(p[0], E))) || (on(p[1], q[1]) && (on(p[1], B) || on(p[1], E)));
  const out = [];
  cell.forEach((p, k) => {
    const q = cell[(k + 1) % cell.length]; out.push(p);
    if (border(p, q)) return;
    const ins = [];
    if (onV(p) && onV(q)) {
      const lo = Math.min(p[1], q[1]) + 0.012, hi = Math.max(p[1], q[1]) - 0.012;
      for (let j = Math.ceil(lo / VSTEP); j * VSTEP <= hi; j++) { const v = j * VSTEP; ins.push([xA(v) + (j & 1 ? 1 : -1) * (0.3 + hash(j) * 0.7) * JAG, v]); }
      if (p[1] > q[1]) ins.reverse();
    } else {
      const fwd = p[0] < q[0] || (p[0] === q[0] && p[1] < q[1]), a = fwd ? p : q, b = fwd ? q : p;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(2, Math.ceil(L / CSTEP)), seed = Math.round((a[1] + b[1]) * 1000);
      for (let i = 1; i < n; i++) { const t = i / n, o = (i & 1 ? 1 : -1) * (0.3 + hash(seed + i) * 0.7) * JAG; ins.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
      if (!fwd) ins.reverse();
    }
    out.push(...ins);
  });
  return out;
}
export const TARGETS = {
  lunas: { shapes: [crescent(0.47, 0.56, 0.33, 35 * D2R), crescent(0.66, 0.86, 0.27, 215 * D2R)], cells: cells({ aTop: 0.55, aBot: 0.5, l0: 0.5, l1: 0.48, r1a: 0.4, r1b: 0.36, r2a: 0.64, r2b: 0.62 }) },
};
const DEPTH = [0.58, 0.63, 0.55, 0.66, 0.6]; // fraction of the way from the candle to the wall
const ROT = [[0.25, 0.5, 0.2], [-0.3, -0.45, 0.4], [0.5, 0.2, -0.3], [-0.2, 0.6, 0.1], [0.35, -0.5, -0.45]];
const START = { yaw: 0.95, pitch: -0.48 };

export function createShadowPuzzle({ room, crystal, page, variant = 'lunas', reduced = false, onSolved }) {
  const T = TARGETS[variant], PA = room.PAINT, L = room.light, ZS = room.shadowZ;
  const toWorld = ([u, v]) => new THREE.Vector3(PA.cx - PA.w / 2 + u * PA.w, PA.cy + PA.h / 2 - v * PA.h, ZS);
  // pieces of the silhouette per fragment
  const pieces = T.cells.map(cell => T.shapes.map(s => clipConvex(s, cell)).filter(p => p.length > 2 && Math.abs(area(p)) > 1e-5));
  const wallPoint = pieces.map((ps, i) => {
    if (!ps.length) { return toWorld(centroid(T.cells[i]).map(x => Math.min(0.9, Math.max(0.1, x)))); }
    const big = ps.reduce((a, b) => Math.abs(area(b)) > Math.abs(area(a)) ? b : a); return toWorld(centroid(big));
  });
  const Pw = wallPoint.map((W, i) => L.clone().lerp(W, DEPTH[i]));
  const C = Pw.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / 5);
  const Rq = ROT.map(r => new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)));
  // casters in each fragment's local frame: the whole silhouette + the jagged cell that cuts this fragment's share
  // out of it (clipped at draw time), plus 2 fracture lines inside the share
  const casters = T.cells.map((cell, i) => {
    const n = Pw[i].clone().sub(L).normalize(), inv = Rq[i].clone().invert(), num = n.dot(Pw[i].clone().sub(L));
    const back = uv => { const w = toWorld(uv), dir = w.clone().sub(L), X = L.clone().addScaledVector(dir, num / n.dot(dir)); return X.sub(Pw[i]).applyQuaternion(inv).multiplyScalar(1 / PUZZLE_SCALE); };
    const big = pieces[i].length ? pieces[i].reduce((a, b) => Math.abs(area(b)) > Math.abs(area(a)) ? b : a) : cell, c0 = centroid(big);
    const cracks = [0, 1].map(k => {
      let a = hash(i * 7 + k) * Math.PI * 2, x = c0[0] + (hash(i * 13 + k) - 0.5) * 0.08, y = c0[1] + (hash(i * 17 + k) - 0.5) * 0.08; const line = [[x, y]];
      for (let st = 0; st < 4; st++) { a += (hash(i * 31 + k * 5 + st) - 0.5) * 1.3; const d = 0.035 + hash(i * 41 + k * 3 + st) * 0.03; x += Math.cos(a) * d; y += Math.sin(a) * d; line.push([x, y]); }
      return line.map(back);
    });
    const P = crystal.fragments[i].poly, [gx, gy] = toShard(centroid(P));
    const glass = P.map(p => { const [x, y] = toShard(p); return new THREE.Vector3(x - gx, y - gy, 0); });
    return { shapes: T.shapes.map(sh => sh.map(back)), cell: jagCell(cell, T.cells.xA).map(back), cracks, glass, outer: P.map((p, k) => !!(p.outer && P[(k + 1) % P.length].outer)) };
  });

  const pivot = new THREE.Group(); pivot.name = 'fragment_cluster'; pivot.position.copy(C); room.scene.add(pivot);
  const S = { yaw: START.yaw, pitch: START.pitch, vy: 0, vp: 0, drag: false, locked: false, enabled: false, fade: 1, done: false, intro: false };
  const qy = new THREE.Quaternion(), qx = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  const applyRot = () => { qy.setFromAxisAngle(Y, S.yaw); qx.setFromAxisAngle(X, S.pitch); pivot.quaternion.copy(qx).multiply(qy); };

  function mount() {
    crystal.fragments.forEach((f, i) => {
      pivot.add(f.group); f.group.visible = true;
      f.group.position.copy(Pw[i]).sub(C); f.group.quaternion.copy(Rq[i]); f.group.scale.setScalar(PUZZLE_SCALE);
    });
  }

  // ---------- shadow drawing ----------
  const SH = room.painting.shadow, GL = room.painting.glow, W = SH.canvas.width, H = SH.canvas.height;
  const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const mx = mask.getContext('2d');
  const v = new THREE.Vector3(), TINT = 'rgb(62,28,14)';
  let closeness = 0;
  // project local caster points from the candle onto the painting (canvas px); points behind the light are dropped
  const proj = (pts, m) => {
    const out = [];
    for (const p of pts) {
      v.copy(p).applyMatrix4(m); if (v.z > L.z - 0.02) continue;
      const t = (ZS - L.z) / (v.z - L.z);
      out.push((L.x + (v.x - L.x) * t - (PA.cx - PA.w / 2)) / PA.w * W, ((PA.cy + PA.h / 2) - (L.y + (v.y - L.y) * t)) / PA.h * H);
    }
    return out;
  };
  const trace = (g, a, close = true) => { if (a.length < 4) return; g.moveTo(a[0], a[1]); for (let k = 2; k < a.length; k += 2) g.lineTo(a[k], a[k + 1]); if (close) g.closePath(); };
  const shapesPath = (g, fr) => { g.beginPath(); fr.shapes.forEach(a => trace(g, a)); };
  const cellPath = (g, fr) => { g.beginPath(); trace(g, fr.cell); };
  const smooth = x => x * x * (3 - 2 * x);
  function drawShadows() {
    pivot.updateMatrixWorld(true);
    const frs = [];
    crystal.fragments.forEach((f, i) => {
      if (!f.group.visible || f.group.parent !== pivot) return;
      const m = f.group.matrixWorld, c = casters[i], cell = proj(c.cell, m);
      if (cell.length >= 6) frs.push({ cell, shapes: c.shapes.map(sh => proj(sh, m)), cracks: c.cracks.map(l => proj(l, m)), glass: c.glass.every(p => (v.copy(p).applyMatrix4(m).z < L.z - 0.02)) ? proj(c.glass, m) : null, outer: c.outer });
    });
    // 1 · union of the shares, opaque (cuts stroked inside the silhouette so no hairline seams at the solution), tinted copper
    mx.globalCompositeOperation = 'source-over'; mx.clearRect(0, 0, W, H); mx.fillStyle = mx.strokeStyle = '#000'; mx.lineWidth = 1.4; mx.lineJoin = 'miter';
    for (const fr of frs) {
      mx.save(); cellPath(mx, fr); mx.clip(); shapesPath(mx, fr); mx.fill(); mx.restore();
      mx.save(); shapesPath(mx, fr); mx.clip(); cellPath(mx, fr); mx.stroke(); mx.restore();
    }
    mx.globalCompositeOperation = 'source-in'; mx.fillStyle = TINT; mx.fillRect(0, 0, W, H); mx.globalCompositeOperation = 'source-over';
    const c = SH.ctx; c.clearRect(0, 0, W, H);
    const w = (1 - smooth(Math.min(1, Math.max(0, (closeness - 0.5) / 0.44)))) * S.fade; // full glass detail until halfway, gone just before the snap
    // 2 · the shards themselves: faint glass, solid copper rim on the outer edges, light caught along the cracked edges
    if (w > 0.01) for (const fr of frs) {
      const a = fr.glass; if (!a) continue;
      c.beginPath(); trace(c, a); c.globalAlpha = 0.44 * w; c.fillStyle = TINT; c.fill();
      c.lineJoin = 'miter'; c.lineCap = 'round';
      for (const outer of [false, true]) {
        c.beginPath();
        for (let k = 0, n = a.length / 2; k < n; k++) if (fr.outer[k] === outer) { const j = (k + 1) % n; c.moveTo(a[k * 2], a[k * 2 + 1]); c.lineTo(a[j * 2], a[j * 2 + 1]); }
        if (outer) { c.globalAlpha = 0.7 * w; c.strokeStyle = '#1c0b05'; c.lineWidth = 3.4; c.stroke(); }
        else { c.globalAlpha = 0.5 * w; c.strokeStyle = '#1c0b05'; c.lineWidth = 1.8; c.stroke(); c.globalAlpha = 0.28 * w; c.strokeStyle = '#ffc492'; c.lineWidth = 0.7; c.stroke(); }
      }
    }
    c.lineCap = 'butt';
    // 3 · the moon shares (denser)
    c.globalAlpha = (0.56 + 0.18 * closeness) * S.fade; c.drawImage(mask, 0, 0);
    // 4 · glass detail per share: overlaps darker (two layers of glass), rim, refracted bright line, fracture lines
    if (w > 0.01) for (const fr of frs) {
      c.save(); cellPath(c, fr); c.clip(); shapesPath(c, fr); c.clip();
      c.globalAlpha = 0.17 * w; c.fillStyle = '#1a0a05'; c.fillRect(0, 0, W, H);
      c.lineJoin = 'miter'; c.beginPath(); trace(c, fr.cell); fr.shapes.forEach(a => trace(c, a));
      c.globalAlpha = 0.32 * w; c.strokeStyle = '#ffc492'; c.lineWidth = 4.6; c.stroke();
      c.globalAlpha = 0.75 * w; c.strokeStyle = '#1c0b05'; c.lineWidth = 2.2; c.stroke();
      c.beginPath(); fr.cracks.forEach(a => trace(c, a, false));
      c.globalAlpha = 0.55 * w; c.strokeStyle = '#1c0b05'; c.lineWidth = 1.5; c.stroke();
      c.globalAlpha = 0.3 * w; c.strokeStyle = '#ffd2a8'; c.lineWidth = 0.6; c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
    SH.tex.needsUpdate = true;
  }
  function drawGlow() {
    const c = GL.ctx; c.clearRect(0, 0, W, H);
    c.save(); c.lineJoin = 'round';
    for (const s of T.shapes) {
      c.beginPath(); s.forEach(([u, vv], k) => (k ? c.lineTo(u * W, vv * H) : c.moveTo(u * W, vv * H))); c.closePath();
      c.fillStyle = 'rgba(255,140,60,0.16)'; c.fill();
      c.shadowColor = '#ff9a3c'; c.shadowBlur = 26; c.strokeStyle = '#ffc890'; c.lineWidth = 4; c.stroke();
      c.shadowBlur = 8; c.strokeStyle = '#fff0dc'; c.lineWidth = 1.5; c.stroke();
    }
    c.restore(); GL.tex.needsUpdate = true;
  }
  const clearCanvases = () => { SH.ctx.clearRect(0, 0, W, H); SH.tex.needsUpdate = true; GL.ctx.clearRect(0, 0, W, H); GL.tex.needsUpdate = true; GL.mat.opacity = 0; };

  // ---------- input ----------
  const el = page.canvas; let last = null;
  el.addEventListener('pointerdown', e => {
    if (!S.enabled || S.locked) return;
    S.drag = true; S.vy = S.vp = 0; last = { x: e.clientX, y: e.clientY, t: performance.now() };
    el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', e => {
    if (!S.drag) return;
    const now = performance.now(), dt = Math.max(0.008, (now - last.t) / 1000), k = page.isMobile() ? 0.011 : 0.0075;
    const dy = (e.clientX - last.x) * k, dp = (e.clientY - last.y) * k;
    S.yaw += dy; S.pitch = Math.max(-1.45, Math.min(1.45, S.pitch + dp));
    S.vy = S.vy * 0.6 + (dy / dt) * 0.4; S.vp = S.vp * 0.6 + (dp / dt) * 0.4;
    last = { x: e.clientX, y: e.clientY, t: now };
  });
  const release = () => { if (!S.drag) return; S.drag = false; el.style.cursor = S.enabled ? 'grab' : ''; if (performance.now() - last.t > 80) S.vy = S.vp = 0; };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);

  const error = () => 2 * Math.acos(Math.min(1, Math.abs(pivot.quaternion.w)));
  room.onTick((t, dt) => {
    if (S.intro) { crystal.tick(t * 2.2); drawShadows(); return; } // reunión: las sombras siguen a los fragmentos que llegan
    if (!S.enabled && !S.locked) return;
    if (!S.drag && !S.locked) {
      S.yaw += S.vy * dt; S.pitch = Math.max(-1.45, Math.min(1.45, S.pitch + S.vp * dt));
      const d = Math.exp(-dt * 2.6); S.vy *= d; S.vp *= d;
    }
    if (!S.done) applyRot();
    const err = error();
    if (!S.locked) {
      closeness = Math.max(0, Math.min(1, 1 - err / 1.25));
      room.candle.calm = closeness * closeness;
      const speed = Math.hypot(S.vy, S.vp);
      if (err < 0.06 || (err < 0.14 && !S.drag && speed < 1.2)) solve();
    }
    const q = pivot.quaternion, sig = `${q.x.toFixed(4)}${q.y.toFixed(4)}${q.z.toFixed(4)}${closeness.toFixed(3)}${S.fade.toFixed(3)}`;
    if (sig !== lastSig) { lastSig = sig; if (S.fade > 0.001 || SH.tex.version) drawShadows(); }
  });
  let lastSig = '';

  let tl = null;
  function solve() {
    if (S.locked) return;
    S.locked = true; S.drag = false; S.vy = S.vp = 0; el.style.cursor = '';
    S.yaw = Math.atan2(Math.sin(S.yaw), Math.cos(S.yaw));
    page.hint('');
    drawGlow();
    tl = gsap.timeline();
    tl.to(S, { yaw: 0, pitch: 0, duration: 0.5, ease: 'power3.out' }, 0)
      .to({ c: closeness }, { c: 1, duration: 0.5, onUpdate() { closeness = this.targets()[0].c; } }, 0)
      .to(room.candle, { calm: 1, duration: 0.4 }, 0)
      .fromTo(GL.mat, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.5)
      .to(GL.mat, { opacity: 0.55, duration: 0.25, yoyo: true, repeat: 3 }, 0.85)
      .call(() => room.shake(0.012, 0.3), null, 0.5);
    room.flare(tl, 0.5);
    const F = 2.0;
    tl.call(() => { S.done = true; }, null, F)
      .to(S, { fade: 0, duration: 0.6 }, F)
      .to(GL.mat, { opacity: 0, duration: 0.9 }, F + 0.3)
      .call(() => room.setVoid(0, 0.6), null, F);
    playFuse(room, crystal, C, tl, F);
    tl.call(() => { S.enabled = false; room.candle.calm = 0; onSolved && onSolved(tl); }, null, F + 3.0);
    return tl;
  }
  function reset() {
    if (tl) tl.kill(); tl = null;
    if (introTl) introTl.kill(); introTl = null; S.intro = false; glints.forEach((g) => { gsap.killTweensOf([g.material, g.scale]); g.material.opacity = 0; });
    Object.assign(S, { yaw: START.yaw, pitch: START.pitch, vy: 0, vp: 0, drag: false, locked: false, fade: 1, done: false });
    closeness = 0; lastSig = ''; applyRot(); mount(); clearCanvases(); crystal.setCrackGlow(1.1); room.candle.calm = 0;
    if (crystal.group.parent) crystal.group.visible = false;
  }
  // ---------- reunión (antes del puzzle) ----------
  // Cada fragmento entra desde un borde distinto de la pantalla (curva suave, gira hasta su orientación, crece), deja una
  // estela de brasas de cobre y destella al llegar; la vela responde a cada llegada y se aviva al reunirse los cinco.
  // ~3.5 s. Con movimiento reducido: aparecen en su sitio uno a uno con su destello.
  let introTl = null;
  const glints = [0, 1, 2, 3, 4].map(() => { const g = glowSprite(0xfff0d8, 0.3, 0); room.scene.add(g); return g; });
  const EDGES = [[-1.3, 0.3], [1.3, -0.15], [0.2, 1.3], [-0.75, -1.3], [1.25, 1.05]]; // NDC: izq., der., arriba, abajo, esquina
  const _w = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function gather(done) {
    const FX = crystalFX(room), cam = room.cam;
    S.intro = true; S.fade = 0; crystal.setGlint(1);
    cam.updateMatrixWorld(); pivot.updateMatrixWorld(true);
    const depth = C.clone().project(cam).z, order = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const T0 = 0.2, STEP = reduced ? 0.28 : 0.42, DUR = reduced ? 0 : 1.25;
    const tl = gsap.timeline({ onComplete: () => { S.intro = false; introTl = null; done(); } });
    crystal.fragments.forEach((f, n) => {
      const g = f.group, i = order[n], end = g.position.clone(), q1 = g.quaternion.clone(), s1 = g.scale.x, at = T0 + n * STEP;
      g.visible = false;
      const flash = () => {
        g.getWorldPosition(_w); const sp = glints[n];
        sp.position.copy(_w); gsap.killTweensOf([sp.material, sp.scale]);
        gsap.timeline().fromTo(sp.material, { opacity: 0 }, { opacity: 0.95, duration: 0.09 }).to(sp.material, { opacity: 0, duration: 0.6, ease: 'power2.out' });
        gsap.fromTo(sp.scale, { x: 0.12, y: 0.12 }, { x: 0.55, y: 0.55, duration: 0.65, ease: 'power2.out' });
        if (!reduced) FX.trail.emit(_w, 12, 0.14);
        gsap.timeline().to(room.candle.flame.state, { flare: 1.35, duration: 0.12, ease: 'power2.out' }).to(room.candle.flame.state, { flare: 1, duration: 0.5 });
        gsap.timeline().to(room.candle, { base: 8, duration: 0.12 }).to(room.candle, { base: 6.5, duration: 0.6 });
      };
      if (reduced) { tl.set(g, { visible: true }, at).call(flash, null, at); return; }
      // desde fuera de la pantalla, a la profundidad del grupo; punto de control desplazado: una curva, no una recta
      _w.set(EDGES[i][0], EDGES[i][1], depth).unproject(cam);
      const from = pivot.worldToLocal(_w.clone()), ctrl = from.clone().lerp(end, 0.55);
      ctrl.add(_a.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(from.distanceTo(end) * 0.28));
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4));
      tl.set(g, { visible: true }, at)
        .to({}, { duration: DUR, ease: 'power3.out', onUpdate() {
          const k = this.ratio, u = 1 - k;
          g.position.set(u * u * from.x + 2 * u * k * ctrl.x + k * k * end.x, u * u * from.y + 2 * u * k * ctrl.y + k * k * end.y, u * u * from.z + 2 * u * k * ctrl.z + k * k * end.z);
          g.quaternion.slerpQuaternions(q0, q1, Math.min(1, k * 1.1)); g.scale.setScalar(s1 * (0.55 + 0.45 * k));
          if (k < 0.92) { g.getWorldPosition(_b); FX.trail.emit(_b, 2); }
        } }, at)
        .call(flash, null, at + DUR * 0.82);
    });
    const end = T0 + 4 * STEP + DUR;
    tl.to(S, { fade: 1, duration: end - 0.5, ease: 'power1.inOut' }, 0.3);
    room.flare(tl, end - 0.15);
    tl.to({}, { duration: 0.45 }, end); // un respiro antes de la instrucción
    return tl;
  }

  let startTok = 0; // start() waits for the room's crystal stage; hide() meanwhile cancels it
  return {
    center: C, pivot,
    reset,
    // intro: los fragmentos llegan uno a uno desde los bordes y se reúnen frente al cuadro antes de poder girarlos
    start({ intro = false, onIntroDone } = {}) {
      const k = ++startTok, go = () => {
        if (k !== startTok) return;
        reset(); room.setVoid(0.5);
        const ready = () => {
          if (k !== startTok) return;
          S.enabled = true; el.style.cursor = 'grab'; drawShadows();
          if (!(page.tip && page.tip('tipPuzzle', { delay: 0.2, then: 'hintRotateKeys' }))) page.hint('hintRotate', { delay: 0.6 });
        };
        if (intro) introTl = gather(() => { if (onIntroDone) onIntroDone(); ready(); });
        else { drawShadows(); ready(); }
      };
      room.has('crystal') ? go() : room.need('crystal').then(go);
    },
    stop() { if (introTl) { introTl.kill(); introTl = null; S.intro = false; } S.enabled = false; el.style.cursor = ''; },
    // teclado: girar un paso (radianes) en cada eje
    nudge(dYaw, dPitch) { if (!S.enabled || S.locked || S.drag) return; S.vy = S.vp = 0; S.yaw += dYaw; S.pitch = Math.max(-1.45, Math.min(1.45, S.pitch + dPitch)); },
    hide() { startTok++; reset(); S.enabled = false; crystal.fragments.forEach(f => (f.group.visible = false)); clearCanvases(); },
    get locked() { return S.locked; },
  };
}
