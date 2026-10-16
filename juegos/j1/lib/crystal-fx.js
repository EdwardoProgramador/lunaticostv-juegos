// Crystal sequences in the room (level 2):
//   playRiseShatter(room, crystal, page)  14 — rises from the altar, cracks glow, trembles, shatters; 5 fragments fly off screen (starts once room.need('crystal') resolves)
//   playFuse(room, crystal, frags, at)     16 — fragments fly together and fuse; cracks seal with copper light
import * as THREE from '../vendor/three.module.min.js';
import { gsap } from '../vendor/gsap.min.js';
import { glowSprite, glowTexture } from './objects.js';

export const CRYSTAL_SCALE = 0.42;   // rising from the altar (14)
export const PUZZLE_SCALE = 0.72;    // floating in front of the painting (16, 17)

// glass dust + copper sparks (one pool per room)
function particles(room) {
  if (room._burst) return room._burst;
  const N = 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), kind = new Uint8Array(N), base = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.022, map: glowTexture(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false; room.scene.add(pts);
  const dust = new THREE.Color(0xd8ccf0), spark = new THREE.Color(0xff9a50), hot = new THREE.Color(0xffe0b0);
  let active = false; // idle pool: no per-frame work or buffer upload
  room.onTick((t, dt) => {
    if (!active) return; let alive = 0;
    for (let i = 0; i < N; i++) {
      if (life[i] <= 0) { col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
      const g = kind[i] ? 2.6 : 0.5, damp = Math.exp(-dt * (kind[i] ? 0.8 : 1.6));
      vel[i * 3 + 1] -= g * dt; for (let k = 0; k < 3; k++) { vel[i * 3 + k] *= damp; pos[i * 3 + k] += vel[i * 3 + k] * dt; }
      life[i] -= dt * (kind[i] ? 0.9 : 0.55); const a = Math.max(0, life[i]);
      for (let k = 0; k < 3; k++) col[i * 3 + k] = base[i * 3 + k] * a;
      if (a > 0) alive++;
    }
    if (!alive) active = false;
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
  });
  room._burst = {
    burst(at, n = N) {
      active = true;
      for (let i = 0; i < n; i++) {
        const sp = i % 3 === 0; kind[i] = sp ? 1 : 0; life[i] = 0.7 + Math.random() * 0.6;
        const d = new THREE.Vector3().randomDirection(), s = sp ? 1.6 + Math.random() * 2.4 : 0.4 + Math.random() * 1.6;
        pos.set([at.x + d.x * 0.03, at.y + d.y * 0.05, at.z + d.z * 0.03], i * 3); vel.set([d.x * s, d.y * s + (sp ? 0.8 : 0.2), d.z * s * 0.6 + 0.4], i * 3);
        const c = sp ? spark.clone().lerp(hot, Math.random() * 0.6) : dust.clone().multiplyScalar(0.5 + Math.random() * 0.5); base.set([c.r, c.g, c.b], i * 3);
      }
    },
    clear() { life.fill(0); col.fill(0); geo.attributes.color.needsUpdate = true; active = false; },
  };
  return room._burst;
}

// Called by createRoom: the crystal light exists (at 0) from the start, so the light count never changes in play, and the
// particle shader is compiled in the room's warm-up.
export function prepareCrystalFX(room) { particles(room); crystalLight(room); }
function crystalLight(room) {
  if (room._clight) return room._clight;
  const light = new THREE.PointLight(0xffa860, 0, 0, 2), glow = glowSprite(0xffa060, 1.2, 0), flash = glowSprite(0xfff0d8, 2.4, 0);
  room.scene.add(light, glow, flash);
  return (room._clight = { light, glow, flash });
}

export function playRiseShatter(room, crystal, page, { reduced = false } = {}) {
  const P = particles(room), L = crystalLight(room), g = crystal.group, F = crystal.fragments;
  crystal.assemble(); room.scene.add(g); g.visible = true;
  const start = new THREE.Vector3(0, 0.7, -0.2), top = new THREE.Vector3(0, 1.22, 0.02);
  g.position.copy(start); g.scale.setScalar(0.02); g.rotation.set(0, -Math.PI * 1.2, 0);
  L.light.position.copy(top); L.glow.position.copy(top); L.flash.position.copy(top).add(new THREE.Vector3(0, 0, 0.1));
  L.light.intensity = 0; L.glow.material.opacity = 0; L.flash.material.opacity = 0; P.clear();
  crystal.setCrackGlow(0.6); crystal.setGlint(1);
  const sh = { a: 0 };
  const off = room.onTick(t => {
    if (sh.a <= 0) return;
    g.position.x = top.x + (Math.random() - 0.5) * sh.a; g.position.y = top.y + (Math.random() - 0.5) * sh.a * 0.6;
    g.rotation.z = (Math.random() - 0.5) * sh.a * 2;
  });
  // normally the crystal stage is loaded long before; if not, the timeline waits (paused) and the loading screen shows.
  // Callers that nest this timeline in their own must await room.need('crystal') first (page 14 does).
  const wait = !room.has('crystal'), tl = gsap.timeline({ onComplete: off, paused: wait });
  if (wait) room.need('crystal').then(() => tl.parent && tl.play()); // killed meanwhile: stays stopped
  tl.call(() => room.setFocus('crystal', 1.4), null, 0)
    .to(g.position, { x: top.x, y: top.y, z: top.z, duration: 1.25, ease: 'power3.out' }, 0)
    .to(g.scale, { x: CRYSTAL_SCALE, y: CRYSTAL_SCALE, z: CRYSTAL_SCALE, duration: 1.15, ease: 'back.out(1.4)' }, 0)
    .to(g.rotation, { y: 0, duration: 1.4, ease: 'power3.out' }, 0)
    .to(L.glow.material, { opacity: 0.55, duration: 1.2 }, 0.2)
    .to(L.light, { intensity: 1.5, duration: 1.2 }, 0.2)
    .to(crystal.materials.crack, { emissiveIntensity: 5.5, duration: 1.0, ease: 'power2.in' }, 1.0)
    .to(L.light, { intensity: 5, duration: 1.0, ease: 'power2.in' }, 1.0)
    .to(sh, { a: reduced ? 0 : 0.03, duration: 0.8, ease: 'power2.in' }, 1.45)
    .to(L.glow.material, { opacity: 1, duration: 0.8, ease: 'power2.in' }, 1.45);
  const B = 2.3;
  tl.call(() => {
    sh.a = 0; g.position.copy(top); g.rotation.z = 0;
    P.burst(top); room.shake(0.07, 0.6);
  }, null, B)
    .fromTo(L.flash.material, { opacity: 0 }, { opacity: 1, duration: 0.08 }, B)
    .to(L.flash.material, { opacity: 0, duration: 0.7, ease: 'power2.out' }, B + 0.1)
    .to(L.flash.scale, { x: 5, y: 5, duration: 0.8, ease: 'power2.out' }, B)
    .to([L.glow.material], { opacity: 0, duration: 0.5 }, B + 0.05)
    .to(L.light, { intensity: 0, duration: 0.8 }, B + 0.05);
  F.forEach((f, i) => {
    const h = f.home.clone(), dir = new THREE.Vector3(h.x * 2.2 + (i % 2 ? 0.5 : -0.5), h.y * 1.6 + 0.25, 0.9 + Math.random() * 0.6).normalize();
    const D = 9 + Math.random() * 3;
    if (reduced) { tl.set(f.group, { visible: false }, B + 0.06); return; } // movimiento reducido: se apagan dentro del destello
    tl.to(f.group.position, { x: h.x + dir.x * D, y: h.y + dir.y * D, z: dir.z * D, duration: 1.0, ease: 'power2.in' }, B)
      .to(f.group.rotation, { x: (Math.random() - 0.5) * 9, y: (Math.random() - 0.5) * 9, z: (Math.random() - 0.5) * 6, duration: 1.0, ease: 'power1.out' }, B)
      .set(f.group, { visible: false }, B + 1.0);
  });
  tl.set(L.flash.scale, { x: 2.4, y: 2.4 }, B + 1);
  page.big('hintFragments', tl, B + 0.65);
  return tl;
}

// Fragments (anywhere in the scene) fly into the full crystal at `center`, facing the camera. Cracks flare, then seal.
export function playFuse(room, crystal, center, tl = gsap.timeline(), at = 0, scale = PUZZLE_SCALE) {
  const g = crystal.group, L = crystalLight(room);
  room.scene.add(g); g.position.copy(center); g.quaternion.identity(); g.scale.setScalar(scale); g.visible = true; g.updateMatrixWorld(true);
  L.light.position.copy(center); L.glow.position.copy(center); L.flash.position.copy(center).add(new THREE.Vector3(0, 0, 0.12));
  tl.call(() => {
    crystal.fragments.forEach(f => {
      g.attach(f.group);
      f.q0 = f.group.quaternion.clone(); f.p0 = f.group.position.clone(); f.s0 = f.group.scale.x; f.k = { t: 0 };
    });
  }, null, at);
  crystal.fragments.forEach((f, i) => {
    tl.to({}, { duration: 1.1, ease: 'power3.inOut', onStart() { this.targets()[0].t = 0; }, onUpdate() {
      const k = this.ratio; f.group.position.lerpVectors(f.p0, f.home, k); f.group.quaternion.slerpQuaternions(f.q0, new THREE.Quaternion(), k); f.group.scale.setScalar(f.s0 + (1 - f.s0) * k);
    } }, at + 0.05 + i * 0.07);
  });
  const E = at + 1.45;
  tl.to(crystal.materials.crack, { emissiveIntensity: 7, duration: 0.25, ease: 'power2.in' }, E - 0.2)
    .fromTo(L.flash.material, { opacity: 0 }, { opacity: 0.9, duration: 0.1 }, E)
    .to(L.flash.material, { opacity: 0, duration: 0.9, ease: 'power2.out' }, E + 0.1)
    .fromTo(L.glow.material, { opacity: 0 }, { opacity: 0.6, duration: 0.3 }, E)
    .to(L.glow.material, { opacity: 0.25, duration: 1.4 }, E + 0.3)
    .fromTo(L.light, { intensity: 6 }, { intensity: 1.2, duration: 1.4 }, E)
    .call(() => room.shake(0.02, 0.4), null, E)
    .to(crystal.materials.crack, { emissiveIntensity: 0.35, duration: 1.6, ease: 'power2.out' }, E + 0.1);
  return tl;
}
export function crystalFX(room) { return { particles: particles(room), light: crystalLight(room) }; }
