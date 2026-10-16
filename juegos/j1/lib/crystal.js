// The cracked crystal shard (reference: assets/tex/crystal-face.webp) as 3D, split into 5 fragments along its cracks.
// Unit: the assembled shard is 1 tall (scale it where it's used). Front = +z.
//   const c = createCrystal();  scene.add(c.group);  c.tick(t);  c.setCrackGlow(3);
//   c.fragments[i].group  →  'fragmento_1'…'fragmento_5' (position = its place in the full shard)
import * as THREE from '../vendor/three-0.184.0/three.module.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ materials, crescentGeo, mergeGeos, texturesReady, prewarm, startTextures }, { IMG, FRAGMENTS, ORNAMENTS, centroid }, { tieredTexture }] = await Promise.all([
  import(`./objects.js${V}`),
  import(`./crystal-shape.js${V}`),
  import(`./surfaces.js${V}`),
]);

// the crystal's own stage: its texture downloads only when this (or the room's 'crystal' stage) asks for it
export const crystalReady = () => startTextures('crystal').then(() => texturesReady());
const K = 1 / IMG.height, DEPTH = 0.034;
export const toShard = ([x, y]) => [(x - IMG.cx) * K, (IMG.cy - y) * K];
const mtx = (x, y, z, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(sx, sy, sz));

let MATS = null;
export function crystalMaterials() {
  if (MATS) return MATS;
  const tex = tieredTexture('crystal-face', true, 'crystal'); // 1092 px on High, 512 px on Low / phones; downloads with the 'crystal' stage
  const glint = { value: 0 }, glintAmt = { value: 1 };
  // smoky cracked glass: the reference painting as colour + faint self-light (the moons glow), clear-coated
  const face = new THREE.MeshPhysicalMaterial({ name: 'smoky_glass', map: tex, emissiveMap: tex, color: 0xd6ced8, emissive: 0xffffff, emissiveIntensity: 0.22, roughness: 0.14, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.03, alphaTest: 0.35, envMapIntensity: 1.6 });
  // idle glint: a soft band of light that runs diagonally across the glass
  face.onBeforeCompile = sh => {
    sh.uniforms.uGlint = glint; sh.uniforms.uGlintAmt = glintAmt;
    sh.fragmentShader = 'uniform float uGlint;\nuniform float uGlintAmt;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float gp = fract(uGlint * 0.16) * 3.4 - 1.2;
      float gd = (vMapUv.x * 0.8 + (1.0 - vMapUv.y) * 0.6) - gp;
      totalEmissiveRadiance += vec3(1.0, 0.86, 0.72) * exp(-gd * gd * 900.0) * 0.45 * uGlintAmt;`);
  };
  face.customProgramCacheKey = () => 'cholo-crystal-glint';
  const back = new THREE.MeshPhysicalMaterial({ name: 'smoky_glass_back', map: tex, color: 0x948aa2, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.3, metalness: 0.25, clearcoat: 1, alphaTest: 0.35 });
  const crack = new THREE.MeshStandardMaterial({ name: 'crack_copper_glow', color: 0x3a1a12, emissive: 0xff8a4a, emissiveIntensity: 1.1, roughness: 0.35, metalness: 0.6 });
  MATS = { tex, face, back, crack, glint, glintAmt, copper: materials().copper };
  return MATS;
}

const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

function buildFragment(P, i, M) {
  const [cx, cy] = toShard(centroid(P));
  const loc = P.map(p => { const [x, y] = toShard(p); return new THREE.Vector2(x - cx, y - cy); });
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(loc), { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -DEPTH / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv, nrm = geo.attributes.normal;
  for (let k = 0; k < pos.count; k++) uv.setXY(k, ((pos.getX(k) + cx) / K + IMG.cx) / IMG.w, 1 - (IMG.cy - (pos.getY(k) + cy) / K) / IMG.h);
  // caps → front (smoky glass) / back, sides → glowing crack edges
  const [lids, sides] = geo.groups, half = lids.count / 2, firstIsBack = nrm.getZ(lids.start) < 0;
  geo.clearGroups();
  geo.addGroup(lids.start, half, firstIsBack ? 1 : 0); geo.addGroup(lids.start + half, half, firstIsBack ? 0 : 1);
  geo.addGroup(sides.start, sides.count, 2);
  const g = new THREE.Group(); g.name = `fragmento_${i + 1}`; g.position.set(cx, cy, 0);
  const body = new THREE.Mesh(geo, [M.face, M.back, M.crack]); body.name = `fragmento_${i + 1}_vidrio`; g.add(body);

  // copper frame: a rounded rim that follows only the shard's original outer edges
  const parts = [];
  const n = P.length, outer = k => P[k].outer && P[(k + 1) % n].outer;
  let s0 = 0; while (s0 < n && outer(s0)) s0++;
  if (s0 < n) {
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const pts = run.map(p => { const [x, y] = toShard(p); return new THREE.Vector3(x - cx, y - cy, 0); });
        const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        parts.push([new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), DEPTH * 0.52, 7, false)]);
        for (const e of [pts[0], pts[pts.length - 1]]) parts.push([new THREE.SphereGeometry(DEPTH * 0.52, 10, 8), mtx(e.x, e.y, 0)]);
      }
      run = [];
    };
    for (let s = 1; s <= n; s++) {
      const k = (s0 + s) % n;
      if (outer(k)) { if (!run.length) run.push(P[k]); run.push(P[(k + 1) % n]); } else flush();
    }
    flush();
  }
  // moon + star filigree from the reference, raised on the copper border
  for (const o of ORNAMENTS) {
    if (!inPoly(P, o.x, o.y)) continue;
    const [x, y] = toShard([o.x, o.y]), r = o.r * K, z = DEPTH / 2 + 0.004;
    if (o.type === 'moon') parts.push([crescentGeo(r, 0.008), mtx(x - cx, y - cy, z, o.rot)]);
    else parts.push([new THREE.OctahedronGeometry(1, 0), mtx(x - cx, y - cy, z, 0, r * 0.26, r, r * 0.12)], [new THREE.OctahedronGeometry(1, 0), mtx(x - cx, y - cy, z, 0, r * 0.8, r * 0.22, r * 0.12)]);
  }
  if (parts.length) { const fr = new THREE.Mesh(mergeGeos(parts), M.copper); fr.name = `fragmento_${i + 1}_marco`; g.add(fr); }
  return g;
}

// one fragment on its own, centred (13: previews + GLB per fragment)
export function createFragment(i) { const g = buildFragment(FRAGMENTS[i], i, crystalMaterials()); g.position.set(0, 0, 0); return g; }

export function createCrystal() {
  const M = crystalMaterials();
  const group = new THREE.Group(); group.name = 'cristal';
  const fragments = FRAGMENTS.map((P, i) => {
    const g = buildFragment(P, i, M); group.add(g);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
    return { group: g, index: i, home: g.position.clone(), poly: P, size };
  });
  prewarm(group); // the room compiles its shaders in the warm-up, not when it first rises
  return {
    group, fragments, materials: M,
    setCrackGlow(v) { M.crack.emissiveIntensity = v; },
    get crackGlow() { return M.crack.emissiveIntensity; },
    setGlint(v) { M.glintAmt.value = v; },
    tick(t) { M.glint.value = t; },
    // put every fragment back in the shard
    assemble() { fragments.forEach(f => { group.add(f.group); f.group.position.copy(f.home); f.group.quaternion.identity(); f.group.scale.setScalar(1); f.group.visible = true; }); },
  };
}
