// Devotional altar for the reward scene (08). Meters, y-up, front = +z.
import * as THREE from 'three';
import { materials, crescentGeo, makeFlame, smokeTexture, mergeGeos } from './cholo-objects.js';

const mtx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

function cloth(width, topY, zBack, zFront, drop, seed) {
  const top = zFront - zBack, L = top + drop;
  const g = new THREE.PlaneGeometry(width, L, 48, 28), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), s = L / 2 - p.getY(i);
    const fold = Math.sin(x * 31 + seed) * 0.6 + Math.sin(x * 57 + seed * 2) * 0.4;
    if (s <= top) p.setXYZ(i, x, topY + 0.004 + Math.max(0, s - top + 0.03) * 0, zBack + s);
    else {
      const d = s - top, k = Math.min(1, d / 0.07);
      p.setXYZ(i, x, topY + 0.004 - d, zFront + 0.006 + (fold * 0.011 + 0.006) * k);
    }
    if (Math.abs(s - L) < 1e-6) p.setY(i, p.getY(i) + Math.sin(x * 23 + seed) * 0.008);
  }
  g.computeVertexNormals();
  return g;
}

export function buildAltar() {
  const m = materials();
  const g = new THREE.Group(); g.name = 'altar';
  const add = (geo, mat, name) => { const o = new THREE.Mesh(geo, mat); o.name = name; g.add(o); return o; };
  const B = (w, h, d, x, y, z) => [new THREE.BoxGeometry(w, h, d), mtx(x, y, z)];

  add(mergeGeos([B(1.56, 0.22, 0.84, 0, 0.11, 0), B(1.62, 0.035, 0.9, 0, 0.235, 0), B(1.26, 0.2, 0.62, 0, 0.35, -0.11), B(0.94, 0.2, 0.36, 0, 0.55, -0.24)]), m.wood, 'tiers');

  // back panel with arched niche
  const W = 1.12, HR = 1.15, sh = new THREE.Shape();
  sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, HR); sh.absarc(0, HR, W / 2, 0, Math.PI, false); sh.lineTo(-W / 2, 0);
  const nw = 0.21, nb = 0.5, nh = 0.42, hole = new THREE.Path();
  hole.moveTo(-nw, nb); hole.lineTo(nw, nb); hole.lineTo(nw, nb + nh); hole.absarc(0, nb + nh, nw, 0, Math.PI, false); hole.lineTo(-nw, nb);
  sh.holes.push(hole);
  const panel = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 });
  panel.translate(0, 0.25, -0.5);
  add(panel, m.wood, 'back_panel');
  add(new THREE.BoxGeometry(0.5, 0.7, 0.02).translate(0, 0.25 + nb + 0.33, -0.505), m.velvet, 'niche_velvet');

  // copper trims
  const outline = (shape, z, r, n) => {
    const pts = shape.getPoints(n).map(v => new THREE.Vector3(v.x, v.y + 0.25, z));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 200, r, 6, true);
  };
  const nicheShape = new THREE.Shape(hole.getPoints(32));
  const trims = [
    [outline(sh, -0.418, 0.012, 48)], [outline(nicheShape, -0.418, 0.01, 32)],
    B(1.63, 0.02, 0.02, 0, 0.252, 0.45), B(1.27, 0.018, 0.018, 0, 0.452, 0.2), B(0.95, 0.018, 0.018, 0, 0.652, -0.06), B(1.57, 0.024, 0.02, 0, 0.02, 0.42),
    [crescentGeo(0.1, 0.03), mtx(0, 1.63, -0.405, 0, 0, Math.PI / 2 + 0.3)],
    [new THREE.OctahedronGeometry(0.03), mtx(-0.2, 1.7, -0.41, 0, 0, 0, 0.6, 1.2, 0.3)],
    [new THREE.OctahedronGeometry(0.022), mtx(0.19, 1.56, -0.41, 0, 0, 0, 0.6, 1.2, 0.3)],
  ];
  // pillars
  for (const sx of [-1, 1]) {
    const x = sx * 0.69;
    trims.push([new THREE.TorusGeometry(0.056, 0.01, 8, 32), mtx(x, 0.29, -0.3, Math.PI / 2)], [new THREE.TorusGeometry(0.056, 0.01, 8, 32), mtx(x, 1.27, -0.3, Math.PI / 2)]);
    trims.push([new THREE.BoxGeometry(0.15, 0.05, 0.15), mtx(x, 1.32, -0.3)]);
    trims.push([crescentGeo(0.055, 0.016), mtx(x, 1.42, -0.3, 0, 0, Math.PI / 2 + 0.3)]);
  }
  add(mergeGeos(trims), m.copper, 'copper_details');
  add(mergeGeos([[new THREE.CylinderGeometry(0.05, 0.055, 1.02, 24), mtx(-0.69, 0.78, -0.3)], [new THREE.CylinderGeometry(0.05, 0.055, 1.02, 24), mtx(0.69, 0.78, -0.3)]]), m.wood, 'pillars');

  // velvet
  add(cloth(1.0, 0.65, -0.42, -0.06, 0.2, 1), m.velvet, 'velvet_top').material.side = THREE.DoubleSide;
  add(cloth(0.52, 0.45, -0.06, 0.2, 0.17, 4), m.velvet, 'velvet_runner');

  // candles
  const flames = [], smokeSources = [];
  const specs = [
    [-0.64, 0.252, 0.27, 0.3, 0.042, true], [0.64, 0.252, 0.27, 0.24, 0.042, true],
    [-0.5, 0.252, 0.34, 0.13, 0.032], [0.5, 0.252, 0.35, 0.17, 0.034],
    [-0.47, 0.452, 0.02, 0.2, 0.036, true], [0.48, 0.452, 0.04, 0.15, 0.034],
    [-0.62, 1.345, -0.3, 0.1, 0.03], [0.62, 1.345, -0.3, 0.12, 0.03],
  ];
  const waxParts = [];
  specs.forEach(([x, y, z, h, r, light], i) => {
    waxParts.push([new THREE.CylinderGeometry(r, r * 1.03, h, 24), mtx(x, y + h / 2, z)]);
    waxParts.push([new THREE.CapsuleGeometry(r * 0.22, h * 0.25, 4, 8), mtx(x + r * 0.9, y + h * 0.82, z + r * 0.3, 0, 0, 0, 1, 1, 0.7)]);
    waxParts.push([new THREE.CylinderGeometry(0.0025, 0.003, 0.02, 6), mtx(x, y + h + 0.008, z)]);
    const f = makeFlame(2.4, !!light, 0.16); f.group.position.set(x, y + h + 0.012, z); f.fx.position.copy(f.group.position);
    g.add(f.group, f.fx); flames.push(f);
    if (i < 2 || i === 4) smokeSources.push(new THREE.Vector3(x, y + h + 0.08, z));
  });
  add(mergeGeos(waxParts), m.wax, 'altar_candles');

  // smoke
  const smoke = [];
  const smat = () => new THREE.SpriteMaterial({ map: smokeTexture(), color: 0xb8a4cc, transparent: true, depthWrite: false, opacity: 0 });
  for (let i = 0; i < 27; i++) {
    const s = new THREE.Sprite(smat()); s.userData = { src: smokeSources[i % smokeSources.length], life: Math.random(), speed: 0.12 + Math.random() * 0.08, seed: Math.random() * 10 };
    s.name = '__smoke'; g.add(s); smoke.push(s);
  }
  const tick = (t, dt) => {
    flames.forEach(f => f.tick(t));
    for (const s of smoke) {
      const u = s.userData; u.life += dt * u.speed * 0.9; if (u.life > 1) u.life -= 1;
      const L = u.life;
      s.position.set(u.src.x + Math.sin(t * 0.7 + u.seed) * 0.05 * L + Math.sin(L * 6 + u.seed) * 0.03, u.src.y + L * 0.9, u.src.z + Math.cos(t * 0.5 + u.seed) * 0.03 * L);
      s.scale.setScalar(0.12 + L * 0.5);
      s.material.opacity = Math.sin(L * Math.PI) * 0.09 * (g.userData.smoke ?? 1);
      s.material.rotation = u.seed + L * 1.5;
    }
  };

  const slots = {
    medallion: { pos: [0, 1.06, -0.41], size: 0.42, rot: [0, 0, 0] },
    candle: { pos: [0, 0.652, -0.22], size: 0.22, rot: [0, 0, 0], surface: true },
    cassette: { pos: [-0.27, 0.652, -0.22], size: 0.3, rot: [-1.15, 0.35, -0.08], surface: true },
    microphone: { pos: [0.28, 0.652, -0.24], size: 0.36, rot: [-0.15, -0.5, 0.42], surface: true },
    notebook: { pos: [0, 0.452, 0.07], size: 0.38, rot: [0.05, -0.12, 0], surface: true },
  };
  return { group: g, flames, slots, tick };
}
