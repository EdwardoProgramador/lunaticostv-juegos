// LunaticosTv · Los objetos del Cholo — librería de los 5 objetos 3D (port de juego1-v2/lib/cholo-objects.js).
// Cambios del port: Three local (vendor/), rutas de texturas relativas a este módulo (asset()), materiales perezosos
// (un objeto flotante solo crea y descarga los materiales que usa; el cuarto los pide todos), sin exportadores GLB,
// disposeTree() para liberar la geometría del objeto flotante. El loop de render vive en loop.js.
// All objects are modeled in meters, y-up, centered. Each builder returns a THREE.Group:
//   group.userData.tick(t, dt)  per-frame animation (flame flicker etc.)
//   group.userData.pose         suggested display rotation [x,y,z]
//   child "__fx"                glow sprites / lights — not exported to GLB
import * as THREE from '../vendor/three.module.min.js';
import { asset } from './paths.js';
export { asset };

// Texture loading. Every surface is a pre-baked image (assets/tex/…); nothing is drawn at runtime except tiny glow/smoke sprites.
// tile = seamless map whose orientation doesn't matter: decoded off the main thread (fetch + createImageBitmap, flipY off);
// otherwise <img> + decode() (still async), flipY on. texturesReady() waits for everything requested so far.
const texCache = {}, texWait = [];
const BITMAP = typeof createImageBitmap === 'function' && typeof fetch === 'function';
async function decodeImage(url, tile) {
  if (tile && BITMAP) {
    try {
      const res = await fetch(url); if (!res.ok) throw new Error(url); const blob = await res.blob();
      try { return await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); } catch (e) { return await createImageBitmap(blob); }
    } catch (e) { /* file:// or an old browser: <img> below */ }
  }
  const img = new Image(); img.decoding = 'async'; img.src = url;
  if (img.decode) await img.decode(); else await new Promise((ok, no) => { img.onload = ok; img.onerror = no; });
  return img;
}
// (re)fill a texture from a file: same Texture object, so materials keep their compiled programs. A size change frees the old
// GPU copy first; the upload happens on the next render (or renderer.initTexture).
export function reloadTexture(t, url, tile = t.userData.tile) {
  return decodeImage(url, tile).then(img => {
    if (t.image) t.dispose();
    t.image = img; t.flipY = !(typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap); t.userData.url = url; t.needsUpdate = true;
    return t;
  }).catch(() => t);
}
// group: a later loading stage (e.g. 'crystal'). Its textures exist at once (materials compile the same) but download only
// when startTextures(group) is called. texturesReady() / textureProgress() cover the first stage (no group).
const groups = {};
function T(url, srgb = true, tile = false, group = null) {
  const k = url + srgb;
  if (texCache[k]) return texCache[k];
  const t = new THREE.Texture(); t.userData.tile = tile; t.userData.url = url = asset(url);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (tile) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (group) { const G = groups[group] || (groups[group] = { items: [], wait: null, done: 0 }); G.items.push(t); if (G.wait) G.wait.push(fill(t, G)); }
  else texWait.push(reloadTexture(t, url, tile).then(x => (texDone++, x)));
  return (texCache[k] = t);
}
const fill = (t, G) => reloadTexture(t, t.userData.urlFn ? asset(t.userData.urlFn()) : t.userData.url).then(x => (G.done++, x));
export function startTextures(group) {
  const G = groups[group]; if (!G) return Promise.resolve([]);
  if (!G.wait) G.wait = G.items.map(t => fill(t, G));
  return Promise.all(G.wait);
}
export function groupProgress(group) { const G = groups[group]; return G && G.items.length ? G.done / G.items.length : 1; }
export const groupStarted = group => !!(groups[group] && groups[group].wait);
let texDone = 0;
export function texturesReady() { return Promise.all(texWait); }
export function textureProgress() { return texWait.length ? texDone / texWait.length : 1; } // 0…1, for loading screens
// Objects that join a scene later (the crystal): the room compiles their materials in the stage that loads them.
export const WARM = new Set();
export function prewarm(obj) { WARM.add(obj); return obj; }
export const loadTexture = T; // shared loader (crystal.js, surfaces.js, chest.js): texturesReady() also waits for these

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
// tiny generated sprites only (glow, smoke: radial gradients, 128 px)
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

function std(name, o) { const m = new THREE.MeshStandardMaterial(o); m.name = name; return m; }

// Materiales compartidos, perezosos: cada uno se crea (y sus texturas empiezan a descargarse) la primera vez que se usa.
let MATS = null;
const lazy = (defs) => { const o = {}; for (const k of Object.keys(defs)) { let v = null; Object.defineProperty(o, k, { enumerable: true, get: () => v || (v = defs[k]()) }); } return o; };
export function materials() {
  if (MATS) return MATS;
  const O = (name, srgb = true) => T(`tex/obj/${name}.webp`, srgb, true), rough = () => O('worn_copper-rough', false);
  MATS = lazy({
    copper: () => std('worn_copper', { map: O('worn_copper-col'), roughnessMap: rough(), roughness: 1, metalness: 1 }),
    copperDark: () => std('dark_copper', { map: O('dark_copper-col'), roughnessMap: rough(), roughness: 1, metalness: 0.9 }),
    micMetal: () => std('mic_metal', { map: O('mic_metal-col'), roughnessMap: O('mic_metal-rough', false), roughness: 1, metalness: 1 }),
    silver: () => std('aged_silver', { map: O('aged_silver-col'), roughnessMap: rough(), roughness: 0.8, metalness: 1 }),
    charcoal: () => std('charcoal_plastic', { map: O('charcoal_plastic-col'), roughness: 0.62, metalness: 0.15 }),
    darkMetal: () => std('dark_handle', { map: O('dark_handle-col'), roughnessMap: O('dark_handle-rough', false), roughness: 1, metalness: 0.7 }),
    grille: () => std('grille_mesh', { color: 0x0e0b0d, roughness: 0.95, metalness: 0.2 }),
    rubber: () => std('black_rubber', { color: 0x151215, roughness: 0.42, metalness: 0 }),
    tape: () => std('magnetic_tape', { color: 0x4a2a22, roughness: 0.2, metalness: 0.85, side: THREE.DoubleSide }),
    leather: () => std('worn_leather', { map: O('worn_leather-col'), roughness: 0.82, metalness: 0 }),
    paperEdge: () => std('paper_edge', { map: O('paper_edge-col'), roughness: 0.95, metalness: 0 }),
    wax: () => std('wax', { color: 0xefdfcb, roughness: 0.5, metalness: 0, emissive: 0xff9a50, emissiveIntensity: 0.06 }),
    wick: () => std('wick', { color: 0x120c0a, roughness: 1 }),
    ribbon: () => std('purple_ribbon', { color: 0x4a3550, roughness: 0.7, metalness: 0, side: THREE.DoubleSide }),
    wood: () => std('carved_wood', { map: O('carved_wood-col'), roughness: 0.62, metalness: 0 }),
    pencilBody: () => std('pencil_lacquer', { map: O('pencil_lacquer-col'), roughness: 0.45, metalness: 0.1 }),
    pencilWood: () => std('pencil_wood', { color: 0xd8a27a, roughness: 0.8 }),
    graphite: () => std('graphite', { color: 0x1a1a1c, roughness: 0.35, metalness: 0.6 }),
    eraser: () => std('eraser', { color: 0xb05a52, roughness: 0.9 }),
    flame: () => std('flame', { color: 0x000000, emissive: 0xffa04a, emissiveIntensity: 3.2, transparent: true, opacity: 0.9, depthWrite: false }),
    flameCore: () => std('flame_core', { color: 0x000000, emissive: 0xfff1d6, emissiveIntensity: 4.5 }),
    velvet: () => Object.assign(new THREE.MeshPhysicalMaterial({ color: 0x2a1c32, roughness: 0.92, metalness: 0, sheen: 0.8, sheenColor: new THREE.Color(0x7e5a9c), sheenRoughness: 0.5 }), { name: 'purple_velvet' }),
    // Mercury glass, thin-walled (thickness 0): tint comes from color/map only, so it looks the same at every display scale.
    // Mottled silvering (metalnessMap) mirrors the room; clear patches let the cream wax show through.
    glass: () => {
      const mercMap = O('mercury_glass-col'), mercMetal = O('mercury_glass-metal', false);
      mercMap.repeat.set(3, 1); mercMetal.repeat.set(3, 1);
      return Object.assign(new THREE.MeshPhysicalMaterial({ color: 0xc9c2cd, map: mercMap, metalness: 1, metalnessMap: mercMetal, roughness: 0.16, transmission: 1, thickness: 0, ior: 1.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 4 }), { name: 'mercury_glass' });
    },
    waxGlow: () => std('wax_inner', { color: 0xeadfcc, roughness: 0.6, emissiveMap: T('tex/obj/wax_inner-glow.webp'), emissive: 0xffffff, emissiveIntensity: 0.7 }),
    wornSilver: () => std('worn_silver', { map: O('worn_silver-col'), roughnessMap: rough(), roughness: 0.55, metalness: 0.7, envMapIntensity: 2.2 }),
  });
  return MATS;
}

// ---------- renderer / lighting ----------
export function setupRenderer(r) {
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
}
export function makeEnv(renderer) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 256); bg.addColorStop(0, '#141026'); bg.addColorStop(0.55, '#07070f'); bg.addColorStop(1, '#030305');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
  const spot = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); };
  spot(110, 90, 70, 'rgba(255,170,100,1)'); spot(110, 90, 20, 'rgba(255,230,200,1)');
  const band = g.createLinearGradient(0, 70, 0, 170); band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, 'rgba(120,80,70,0.35)'); band.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = band; g.fillRect(0, 70, 512, 100);
  spot(240, 120, 60, 'rgba(255,190,140,0.55)');
  spot(360, 100, 90, 'rgba(130,90,220,0.9)'); spot(250, 30, 120, 'rgba(60,40,90,0.6)'); spot(470, 140, 50, 'rgba(255,140,80,0.4)');
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
  return env;
}
// Warm key + cool purple rim (+ faint fill). Positions are directions; scale doesn't matter.
export function addLights(scene) {
  const key = new THREE.DirectionalLight(0xffb27a, 3.8); key.position.set(-2, 2.6, 3);
  const rim = new THREE.DirectionalLight(0x9466ff, 5.0); rim.position.set(2.6, 1.4, -2.6);
  const rim2 = new THREE.DirectionalLight(0x7a52e0, 2.2); rim2.position.set(-2.8, 0.6, -2.2);
  const fill = new THREE.HemisphereLight(0x3a2c58, 0x0a0608, 0.7);
  scene.add(key, rim, rim2, fill);
  return { key, rim, rim2, fill };
}

let _glow, _smoke;
export function glowTexture() {
  return _glow || (_glow = canvasTex(128, (g, S) => {
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, 'rgba(255,225,180,1)'); gr.addColorStop(0.18, 'rgba(255,170,90,0.55)'); gr.addColorStop(0.5, 'rgba(255,120,50,0.12)'); gr.addColorStop(1, 'rgba(255,100,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }));
}
export function smokeTexture() {
  return _smoke || (_smoke = canvasTex(128, (g, S) => {
    const r = rng(9);
    for (let i = 0; i < 14; i++) { const x = S / 2 + (r() - .5) * 50, y = S / 2 + (r() - .5) * 50, rad = 20 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(200,180,220,0.22)'); gr.addColorStop(1, 'rgba(200,180,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  }));
}
export function glowSprite(color = 0xffffff, size = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity }));
  s.scale.setScalar(size); return s;
}
// Many soft sprites (smoke, haze) in ONE draw call: camera-facing quads with their own position, size, rotation, opacity and
// colour; the same look as one THREE.Sprite each (map × colour × opacity, fog, normal blending, no depth write).
//   const b = spriteBatch(27, smokeTexture(), 0xb8a4cc);  scene.add(b.mesh);  b.set(i, x, y, z, size, rotation, opacity);  b.update()
export function spriteBatch(n, map, color = 0xffffff) {
  const quad = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index; geo.setAttribute('position', quad.attributes.position); geo.setAttribute('uv', quad.attributes.uv); geo.instanceCount = n;
  const pos = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const prm = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage); // size, rotation, opacity
  geo.setAttribute('iPos', pos); geo.setAttribute('iPrm', prm);
  const mat = new THREE.ShaderMaterial({
    name: 'sprite_batch', transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, diffuse: { value: new THREE.Color(color) } }]),
    vertexShader: `#include <common>
#include <fog_pars_vertex>
attribute vec3 iPos; attribute vec3 iPrm; varying vec2 vUv; varying float vA;
void main() {
  vUv = uv; vA = iPrm.z;
  vec4 mvPosition = modelViewMatrix * vec4(iPos, 1.0); float c = cos(iPrm.y), s = sin(iPrm.y);
  mvPosition.xy += mat2(c, s, -s, c) * position.xy * iPrm.x;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `#include <common>
#include <fog_pars_fragment>
uniform sampler2D map; uniform vec3 diffuse; varying vec2 vUv; varying float vA;
void main() {
  vec4 t = texture2D(map, vUv);
  gl_FragColor = vec4(diffuse * t.rgb, t.a * vA);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`,
  });
  mat.uniforms.map.value = map;
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'sprite_batch';
  return {
    mesh,
    set(i, x, y, z, size, rot, opacity) { pos.setXYZ(i, x, y, z); prm.setXYZ(i, size, rot, opacity); },
    update() { pos.needsUpdate = prm.needsUpdate = true; },
  };
}

// ---------- geometry helpers ----------
function M(geo, mat, name) { const m = new THREE.Mesh(geo, mat); m.name = name; return m; }
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function planarUV(geo, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}
export function mergeGeos(list) {
  const gs = list.map(([g, m]) => { const x = g.index ? g.toNonIndexed() : g.clone(); if (m) x.applyMatrix4(m); if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; });
  const n = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
  for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return out;
}
const mtx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

function ribbonGeo(curve, w, n, up, twist = () => 0) {
  const P = [], N = [], U = [], I = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, p = curve.getPointAt(s), t = curve.getTangentAt(s);
    const side = new THREE.Vector3().crossVectors(t, up); if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize().applyAxisAngle(t, twist(s));
    const nr = new THREE.Vector3().crossVectors(side, t).normalize();
    const a = p.clone().addScaledVector(side, -w / 2), b = p.clone().addScaledVector(side, w / 2);
    P.push(a.x, a.y, a.z, b.x, b.y, b.z); N.push(nr.x, nr.y, nr.z, nr.x, nr.y, nr.z); U.push(0, s, 1, s);
    if (i < n) { const k = i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  return g;
}
class Ellipse3 extends THREE.Curve {
  constructor(rx, ry, z = 0) { super(); this.rx = rx; this.ry = ry; this.z = z; }
  getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 2; return o.set(Math.cos(a) * this.rx, Math.sin(a) * this.ry, this.z); }
}
function crescentShape(R) {
  // Outer circle R at origin, inner circle offset to the right: opening faces right.
  const s = new THREE.Shape(), cx = R * 0.42, a0 = Math.PI / 3, ex = R * Math.cos(a0), ey = R * Math.sin(a0);
  const ri = Math.hypot(ex - cx, ey);
  s.absarc(0, 0, R, a0, 2 * Math.PI - a0, false);
  const b0 = Math.atan2(-ey, ex - cx), b1 = Math.atan2(ey, ex - cx);
  s.absarc(cx, 0, ri, b0 + 2 * Math.PI, b1, true);
  return s;
}
export function crescentGeo(R, depth) {
  const g = new THREE.ExtrudeGeometry(crescentShape(R), { depth, bevelEnabled: true, bevelThickness: depth * 0.35, bevelSize: R * 0.04, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -depth / 2); g.scale(1, 1, -1);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 30, uv.getY(i) * 30);
  return g;
}

// Candle flame with flicker. Returns {group, fx, tick}
export function makeFlame(scale = 1, withLight = true, lightPower = 0.03) {
  const m = materials();
  const pts = [[0, 0], [0.0034, 0.003], [0.0044, 0.0075], [0.0036, 0.0125], [0.002, 0.0185], [0.0007, 0.0235], [0, 0.027]].map(p => new THREE.Vector2(p[0], p[1]));
  const geo = new THREE.LatheGeometry(pts, 18);
  const g = new THREE.Group(); g.name = 'flame'; g.scale.setScalar(scale);
  g.add(M(geo, m.flame, 'flame_outer'), M(geo.clone().scale(0.5, 0.55, 0.5).translate(0, 0.001, 0), m.flameCore, 'flame_core'));
  const fx = new THREE.Group(); fx.name = '__fx';
  const halo = glowSprite(0xffb070, 0.09 * scale, 0.85); halo.position.y = 0.012 * scale;
  const halo2 = glowSprite(0xff8a3c, 0.16 * scale, 0.3); halo2.position.y = 0.01 * scale;
  fx.add(halo, halo2);
  let light = null;
  if (withLight) { light = new THREE.PointLight(0xff9a4a, 1, 0, 2); light.position.y = 0.012 * scale; fx.add(light); }
  const seed = Math.random() * 100, v = new THREE.Vector3();
  const state = { flare: 1, calm: 0 }; // calm 0…1 steadies the flicker (shadow puzzle feedback)
  const tick = (t) => {
    const n = (Math.sin(t * 13 + seed) * 0.5 + Math.sin(t * 23.7 + seed * 2) * 0.3 + Math.sin(t * 5.1 + seed) * 0.2) * (1 - state.calm * 0.85);
    const f = state.flare;
    g.children[0].scale.set(1 - n * 0.04, (1 + n * 0.1) * f, 1 - n * 0.04);
    g.children[1].scale.set(1, 1 + n * 0.08 * f, 1);
    g.rotation.z = Math.sin(t * 2.3 + seed) * 0.05; g.rotation.x = Math.sin(t * 1.7 + seed) * 0.04;
    halo.material.opacity = (0.75 + n * 0.12) * Math.min(1.6, f);
    halo2.material.opacity = (0.3 + n * 0.06) * f;
    if (light) { g.getWorldScale(v); light.intensity = lightPower * v.x * v.x * (1 + n * 0.18) * f * f; }
  };
  return { group: g, fx, tick, state, light };
}

// Builders take { lod }: true = lighter copy for the room, where the objects stand ~13 cm tall on the altar and are never
// seen up close (fewer segments on curved parts; same shapes and materials). The object pages (01–05, 07) use full detail.
const seg = (lod, n, min = 3) => lod ? Math.max(min, Math.round(n * 0.55)) : n;

// ---------- 01 CASSETTE ----------
export function buildCassette({ lod = false } = {}) {
  const m = materials();
  const W = 0.100, H = 0.0638, D = 0.012, R = 0.0035, bt = 0.001, bs = 0.001;
  const g = new THREE.Group(); g.name = 'cassette';
  const body = new THREE.ExtrudeGeometry(rrShape(W, H, R), { depth: D - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 3, curveSegments: 6 });
  body.translate(0, 0, -(D - 2 * bt) / 2);
  g.add(M(body, [m.charcoal, m.copperDark], 'shell'));
  const face = new THREE.ShapeGeometry(rrShape(W, H, R), 6); planarUV(face, W, H);
  const faceMat = std('cassette_face', { map: T('tex/cassette-face.webp'), roughness: 0.62, metalness: 0.2 }); // 512 px en todas partes (nunca se ve más grande)
  const front = M(face, faceMat, 'face_front'); front.position.z = D / 2 + 0.0002; g.add(front);
  const back = M(face.clone(), m.charcoal, 'face_back'); back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0002; g.add(back);
  const pts = [[-0.030, -0.027, -0.001], [-0.034, -0.037, 0.003], [-0.041, -0.047, 0.009], [-0.031, -0.057, 0.014], [-0.011, -0.055, 0.012], [-0.012, -0.045, 0.008], [-0.027, -0.045, 0.006], [-0.037, -0.055, 0.010], [-0.026, -0.069, 0.016], [0.004, -0.073, 0.014], [0.030, -0.070, 0.010], [0.044, -0.077, 0.006], [0.041, -0.085, 0.004], [0.027, -0.078, 0.003]];
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  g.add(M(ribbonGeo(curve, 0.0038, seg(lod, 220), new THREE.Vector3(0, 0, 1), s => Math.sin(s * Math.PI * 3.2) * 1.1 + s * 0.8), m.tape, 'tape'));
  g.userData.pose = [0.15, -0.35, -0.2];
  return g;
}

// ---------- 02 MICROPHONE ----------
export function buildMicrophone({ lod = false } = {}) {
  const m = materials();
  const g = new THREE.Group(); g.name = 'microphone';
  const R = 0.029, L = 0.026, SX = 1.2, DY = L + R - 0.047;
  const prof = y => { const a = Math.abs(y); return a <= L ? R : Math.sqrt(Math.max(0, R * R - (a - L) ** 2)); };
  const core = new THREE.CapsuleGeometry(R * 0.9, L * 2, seg(lod, 8), seg(lod, 24)); core.scale(SX, 1, 1); core.translate(0, DY, 0);
  g.add(M(core, m.grille, 'grille_core'));
  const ribs = [], N = 14, YS = L + 0.66 * R;
  for (let i = 0; i < N; i++) {
    const y = -YS + i * (2 * YS / (N - 1)), r = prof(y);
    const tg = new THREE.TorusGeometry(r, 0.0021, seg(lod, 6, 4), seg(lod, 48)); tg.rotateX(Math.PI / 2); tg.scale(SX, 1, 1); tg.translate(0, y, 0); ribs.push([tg]);
  }
  const yc = L + 0.72 * R, th = Math.acos((yc - L) / R);
  const capT = new THREE.SphereGeometry(R, seg(lod, 32), seg(lod, 10), 0, Math.PI * 2, 0, th); capT.scale(SX, 1, 1); capT.translate(0, L, 0);
  const capB = capT.clone(); capB.rotateX(Math.PI);
  ribs.push([capT], [capB]);
  // seam band around the silhouette
  const seamPts = []; const Rs = R + 0.0011;
  for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; seamPts.push(new THREE.Vector3(SX * Rs * Math.cos(a), L + Rs * Math.sin(a), 0)); }
  for (const y of [L / 2, 0, -L / 2]) seamPts.push(new THREE.Vector3(-SX * Rs, y, 0));
  for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; seamPts.push(new THREE.Vector3(SX * Rs * Math.cos(a), -L + Rs * Math.sin(a), 0)); }
  for (const y of [-L / 2, 0, L / 2]) seamPts.push(new THREE.Vector3(SX * Rs, y, 0));
  ribs.push([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPts, true), seg(lod, 96), 0.0017, seg(lod, 8, 4), true)]);
  ribs.push([new THREE.SphereGeometry(0.0022, seg(lod, 12), seg(lod, 8)), mtx(SX * Rs + 0.0012, 0, 0)], [new THREE.SphereGeometry(0.0022, seg(lod, 12), seg(lod, 8)), mtx(-SX * Rs - 0.0012, 0, 0)]);
  g.add(M(mergeGeos(ribs).translate(0, DY, 0), m.micMetal, 'head'));
  // yoke + knob
  const yoke = mergeGeos([
    [new THREE.CylinderGeometry(0.0085, 0.0095, 0.014, 24), mtx(0, -0.053, 0)],
    [new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 20), mtx(0, -0.054, 0.0095, Math.PI / 2)],
    [new THREE.TorusGeometry(0.0105, 0.0013, 8, 32), mtx(0, -0.0605, 0, Math.PI / 2)],
  ]);
  g.add(M(yoke, m.micMetal, 'yoke'));
  g.add(M(new THREE.CylinderGeometry(0.0103, 0.0084, 0.056, seg(lod, 32)).translate(0, -0.088, 0), m.darkMetal, 'handle'));
  const fittings = mergeGeos([
    [new THREE.TorusGeometry(0.0089, 0.0011, 8, 32), mtx(0, -0.112, 0, Math.PI / 2)],
    [new THREE.CylinderGeometry(0.0088, 0.0088, 0.006, 28), mtx(0, -0.119, 0)],
    [new THREE.CylinderGeometry(0.0074, 0.0066, 0.014, 28), mtx(0, -0.129, 0)],
  ]);
  g.add(M(fittings, m.silver, 'connector'));
  const cable = new THREE.CatmullRomCurve3([[0, -0.134, 0], [0, -0.146, 0.001], [-0.006, -0.158, 0.004], [-0.022, -0.165, 0.008], [-0.046, -0.156, 0.010], [-0.062, -0.131, 0.008], [-0.063, -0.105, 0.004], [-0.053, -0.085, -0.001], [-0.036, -0.074, -0.006], [-0.016, -0.07, -0.011]].map(p => new THREE.Vector3(...p)));
  g.add(M(new THREE.TubeGeometry(cable, seg(lod, 90), 0.0042, seg(lod, 10, 5), false), m.rubber, 'cable'));
  g.add(M(new THREE.CylinderGeometry(0.0048, 0.0052, 0.01, 16).translate(0, -0.139, 0), m.rubber, 'strain_relief'));
  g.userData.pose = [0.1, -0.5, 0.48];
  return g;
}

// ---------- 03 CANDLE ----------
// Wrap flat relief geometry (x = arc length, y = height, z = height above surface) onto a vertical cylinder of radius R, front = +z.
// crescentGeo is mirrored in z, which reverses triangle winding; swap two corners per triangle so front faces render.
function flipWinding(geo) {
  for (const k of ['position', 'normal', 'uv']) {
    const at = geo.attributes[k], n = at.itemSize, a = at.array;
    for (let i = 0; i < at.count; i += 3) for (let c = 0; c < n; c++) { const t = a[(i + 1) * n + c]; a[(i + 1) * n + c] = a[(i + 2) * n + c]; a[(i + 2) * n + c] = t; }
  }
  return geo;
}
function wrapCyl(geo, R) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const f = p.getX(i) / R, c = Math.cos(f), s = Math.sin(f), rad = R + p.getZ(i);
    p.setXYZ(i, s * rad, p.getY(i), c * rad);
    const nx = n.getX(i), nz = n.getZ(i); n.setXYZ(i, nx * c + nz * s, n.getY(i), -nx * s + nz * c);
  }
  return geo;
}
// Half-round relief stroke along a 2D path, radius tapering r0 → r1.
function reliefStrokeGeo(pts, r0, r1, seg = 4, step = 0.0008) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
  const n = Math.max(8, Math.round(curve.getLength() / step)), P = [], N = [], U = [], I = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), d = curve.getTangentAt(t), sx = -d.y, sy = d.x, r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI, c = Math.cos(a), z = Math.sin(a);
      P.push(p.x + sx * c * r, p.y + sy * c * r, z * r * 0.85); N.push(sx * c, sy * c, z); U.push(t, j / seg);
      if (i < n && j < seg) { const k = i * (seg + 1) + j, k2 = k + seg + 1; I.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  return g;
}
// Spiral from radius r0 at angle a0 winding inward (dir -1 = clockwise).
const spiral = (cx, cy, r0, a0, turns, dir, k = 0.28, n = Math.ceil(turns * 14)) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, r = r0 * (1 - (1 - k) * t);
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});
// Baroque band: 6 repeats of mirrored C-scrolls with acanthus leaves and a rosette; the front repeat carries a fleur-de-lis.
function baroqueBand(R, y0, h, lod = false) {
  const reps = 6, w = (Math.PI * 2 * R) / reps, parts = [];
  const blob = (x, y, sx, sy, sz, rot = 0) => [new THREE.SphereGeometry(1, lod ? 6 : 8, lod ? 4 : 5), mtx(x, y, 0, 0, 0, rot, sx, sy, sz)];
  const reliefStroke = (pts, r0, r1) => reliefStrokeGeo(pts, r0, r1, lod ? 3 : 4, lod ? 0.0016 : 0.0008);
  for (let u = 0; u < reps; u++) {
    const ox = u * w, front = u === 0;
    for (const s of [-1, 1]) {
      const X = x => ox + s * x * w, V = v => y0 + v * h;
      const main = [[0.04, 0.16], [0.11, 0.62], [0.22, 0.88], [0.33, 0.86]].map(([x, v]) => [X(x), V(v)])
        .concat(spiral(0, 0, 0.32 * h, Math.PI / 2 + 0.25, 1.15, -1).map(([x, y]) => [ox + s * (0.36 * w + x), V(0.5) + y]));
      parts.push([reliefStroke(main, 0.001, 0.0005)]);
      const lower = [[0.08, 0.1], [0.2, 0.05], [0.31, 0.1]].map(([x, v]) => [X(x), V(v)]);
      parts.push([reliefStroke(lower, 0.0007, 0.00045)]);
      const ex = 0.36 * w + 0.32 * h * 0.28 * Math.cos(Math.PI / 2 + 0.25 - 1.15 * Math.PI * 2);
      parts.push(blob(ox + s * ex, V(0.5) + 0.32 * h * 0.28 * Math.sin(Math.PI / 2 + 0.25 - 1.15 * Math.PI * 2), 0.0009, 0.0009, 0.0007));
      for (const [x, v, len, ang] of [[0.15, 0.95, 0.0026, 0.5], [0.2, 0.62, 0.0021, -0.35], [0.29, 0.18, 0.0018, -0.9]])
        parts.push(blob(X(x), V(v), 0.0007, len, 0.0006, -s * ang));
      parts.push(blob(X(0.5), V(0.5), 0.0007, 0.0016, 0.0006));
    }
    if (front) {
      parts.push(blob(ox, y0 + 0.66 * h, 0.0015, 0.0055, 0.0009));
      parts.push(blob(ox, y0 + 0.12 * h, 0.0011, 0.0022, 0.0007));
      parts.push([reliefStroke([[ox - 0.0034, y0 + 0.36 * h], [ox + 0.0034, y0 + 0.36 * h]], 0.0006, 0.0006)]);
      for (const s of [-1, 1]) {
        const curl = [[ox + s * 0.001, y0 + 0.42 * h]].concat(spiral(ox + s * 0.0042, y0 + 0.62 * h, 0.0028, s > 0 ? Math.PI * 0.95 : 0.05, 0.9, -s));
        parts.push([reliefStroke(curl, 0.00065, 0.0004)]);
      }
    } else {
      const cy = y0 + 0.58 * h; parts.push(blob(ox, cy, 0.0011, 0.0011, 0.0009));
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + k * Math.PI * 2 / 5; parts.push(blob(ox + Math.cos(a) * 0.0017, cy + Math.sin(a) * 0.0017, 0.0007, 0.0011, 0.0006, a - Math.PI / 2)); }
    }
  }
  const geos = parts.map(([g0, mm]) => { const g1 = g0.index ? g0.toNonIndexed() : g0; if (mm) g1.applyMatrix4(mm); return wrapCyl(g1, R); });
  return mergeGeos(geos.map(g1 => [g1]));
}
// Wax drip hanging down the outer wall: thin neck widening into a droplet at the tip.
function waxDrip(phi, top, L, r0, rb, sway, wall, lod = false) {
  const p = [[0, -L - rb]];
  for (let i = 1; i <= 5; i++) { const a = -Math.PI / 2 + (i / 5) * Math.PI * 0.72; p.push([Math.cos(a) * rb, -L + Math.sin(a) * rb]); }
  for (const [r, y] of [[r0 * 0.72, -L + rb * 1.9], [r0 * 0.85, -L * 0.5], [r0, -L * 0.15], [r0 * 1.2, 0], [r0 * 0.9, 0.0022], [0.0001, 0.0028]])
    if (y > p[p.length - 1][1] + 0.0002) p.push([r, y]);
  const geo = new THREE.LatheGeometry(p.map(q => new THREE.Vector2(q[0], q[1])), lod ? 6 : 10, Math.PI);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), d = Math.max(0, -y / L);
    pos.setXYZ(i, pos.getX(i) + sway * d * d, y + top, pos.getZ(i) * 0.55 + wall(y + top) + rb * 0.2);
  }
  geo.computeVertexNormals();
  return [geo, mtx(0, 0, 0, 0, phi, 0)];
}
export function buildCandle({ lod = false } = {}) {
  const m = materials();
  const g = new THREE.Group(); g.name = 'candle';
  // glass holder: thick rolled lip, straight wall, flared foot
  const prof = [[0.001, 0], [0.043, 0], [0.0465, 0.003], [0.0468, 0.012], [0.0448, 0.015], [0.0442, 0.018], [0.0442, 0.075], [0.047, 0.0785], [0.0478, 0.082], [0.0473, 0.0856], [0.0452, 0.0873], [0.0424, 0.0875], [0.0402, 0.0859], [0.0394, 0.0835], [0.0394, 0.024], [0.001, 0.022]].map(p => new THREE.Vector2(p[0], p[1]));
  const glassGeo = new THREE.LatheGeometry(prof, seg(lod, 64));
  { const p = glassGeo.attributes.position, uv = glassGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setY(i, p.getY(i) / 0.0927); } // height-based v: mottling stays round, not streaked
  const glass = M(glassGeo, m.glass, 'glass_holder'); glass.renderOrder = 2;
  // inner surface sheen so the wall reads as thick glass
  const innerSheen = M(new THREE.CylinderGeometry(0.0393, 0.0393, 0.06, seg(lod, 48), 1, true).translate(0, 0.055, 0), Object.assign(new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.12, envMapIntensity: 3, side: THREE.BackSide, depthWrite: false }), { name: 'glass_inner' }), 'glass_inner'); g.add(innerSheen);
  const wax = M(new THREE.CylinderGeometry(0.0388, 0.0388, 0.051, seg(lod, 48)).translate(0, 0.0475, 0), m.waxGlow, 'wax');
  // poured wax: top surface, pool over the rim, drips of different lengths
  const wall = y => y < 0.075 ? 0.0442 : y < 0.0785 ? 0.0442 + (y - 0.075) / 0.0035 * 0.0028 : y < 0.082 ? 0.047 + (y - 0.0785) / 0.0035 * 0.0008 : 0.0476;
  const wx = [[new THREE.CylinderGeometry(0.0392, 0.0392, 0.0035, seg(lod, 48)), mtx(0, 0.0742, 0)]];
  const dr = rng(42), A0 = -1.15, A1 = 2.6;
  const N = 26, lump = Array.from({ length: N + 1 }, () => 0.6 + dr() * 0.7);
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = A0 + t * (A1 - A0) + (dr() - .5) * 0.06, taper = Math.min(1, t * 5, (1 - t) * 5) * lump[i];
    const at = (R, y, sx, sy, sz, rz = 0) => wx.push([new THREE.SphereGeometry(1, lod ? 7 : 10, lod ? 4 : 6), mtx(Math.sin(a) * R, y, Math.cos(a) * R, 0, a, rz, sx, sy, sz)]);
    at(0.0436 + (dr() - .5) * 0.001, 0.0871 + (dr() - .5) * 0.0006, 0.0095 * Math.max(taper, 0.35), 0.0019 * taper + 0.0005, 0.0046 * Math.max(taper, 0.4), (dr() - .5) * 0.25);
    if (taper > 0.5) at(0.0402, 0.0853, 0.0085 * taper, 0.0013 * taper, 0.0024 * taper);
    if (dr() < 0.6 && taper > 0.4) at(0.047, 0.0838, 0.006 * taper, 0.0026 * taper, 0.0015 * taper);
  }
  for (const [phi, L, r0, rb] of [[-0.95, 0.010, 0.0019, 0.0026], [-0.62, 0.022, 0.0017, 0.0025], [-0.35, 0.006, 0.0022, 0.0027], [0.18, 0.011, 0.0018, 0.0024], [0.44, 0.033, 0.0021, 0.0031], [0.63, 0.015, 0.0019, 0.0026], [0.86, 0.045, 0.0024, 0.0035], [1.06, 0.023, 0.0018, 0.0026], [1.3, 0.038, 0.0022, 0.0031], [1.55, 0.008, 0.002, 0.0026], [1.8, 0.029, 0.0019, 0.0028], [2.1, 0.014, 0.0021, 0.0027], [2.4, 0.025, 0.0018, 0.0025]])
    wx.push(waxDrip(phi + (dr() - .5) * 0.06, 0.0842, L * (0.9 + dr() * 0.2), r0, rb, (dr() - .5) * 0.0024, wall, lod));
  g.add(glass, wax, M(mergeGeos(wx), m.wax, 'wax_drips'));
  // worn silver: crescent moon on the front + baroque band with rings
  const moon = wrapCyl(flipWinding(crescentGeo(0.013, 0.002).translate(0, 0.0465, 0.0017)), 0.0442);
  const band = baroqueBand(0.0441, 0.0170, 0.0156, lod);
  const rings = [[new THREE.TorusGeometry(0.0451, 0.0009, seg(lod, 6, 4), seg(lod, 72)), mtx(0, 0.0162, 0, Math.PI / 2)], [new THREE.TorusGeometry(0.0446, 0.0008, seg(lod, 6, 4), seg(lod, 72)), mtx(0, 0.0338, 0, Math.PI / 2)]];
  g.add(M(mergeGeos([[moon], [band], ...rings]), m.wornSilver, 'silver_ornament'));
  g.add(M(new THREE.CylinderGeometry(0.0008, 0.001, 0.008, 8).translate(0, 0.0775, 0), m.wick, 'wick'));
  const fl = makeFlame(1, true, 0.012); fl.group.position.y = 0.0805; g.add(fl.group);
  fl.fx.position.y = 0.0805;
  const fx = new THREE.Group(); fx.name = '__fx'; fx.add(fl.fx);
  const inner = glowSprite(0xff9a50, 0.16, 0.25); inner.position.y = 0.06; fx.add(inner);
  g.add(fx);
  g.userData.flames = [fl];
  g.userData.tick = (t) => fl.tick(t);
  g.userData.pose = [0.32, 0, 0];
  return g;
}

// ---------- 04 NOTEBOOK ----------
export function buildNotebook({ lod = false } = {}) {
  const m = materials();
  const g = new THREE.Group(); g.name = 'notebook';
  const PW = 0.098, PD = 0.138, CW = 0.105, CD = 0.146;
  const ytop = d => 0.0042 + 0.0072 * Math.pow(d, 0.35) * (1 - 0.18 * d);
  const half = (side) => {
    const h = new THREE.Group(); h.name = side < 0 ? 'left_half' : 'right_half';
    h.rotation.z = side * 0.07;
    const cover = M(new THREE.BoxGeometry(CW, 0.0035, CD).translate(side * (CW / 2 + 0.002), 0.0008, 0), m.leather, side < 0 ? 'cover_left' : 'cover_right'); h.add(cover);
    const sh = new THREE.Shape(); const n = 16;
    sh.moveTo(0.001 * side, 0.0026);
    for (let i = 0; i <= n; i++) { const d = i / n; sh.lineTo(side * (0.001 + d * PW), ytop(d) - 0.0004); }
    sh.lineTo(side * (0.001 + PW), 0.0026); sh.lineTo(0.001 * side, 0.0026);
    const blk = new THREE.ExtrudeGeometry(sh, { depth: PD, bevelEnabled: false, curveSegments: 4 }); blk.translate(0, 0, -PD / 2);
    h.add(M(blk, m.paperEdge, side < 0 ? 'pages_left' : 'pages_right'));
    const pg = new THREE.PlaneGeometry(PW, PD, 24, 1), p = pg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / PW + 0.5, d = side < 0 ? 1 - u : u, z = -p.getY(i);
      p.setXYZ(i, side * (0.001 + d * PW), ytop(d) + 0.0002, z);
    }
    pg.computeVertexNormals();
    const pm = std(side < 0 ? 'page_left' : 'page_right', { map: T(side < 0 ? 'tex/notebook-left.webp' : 'tex/notebook-right.webp'), roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
    h.add(M(pg, pm, side < 0 ? 'page_top_left' : 'page_top_right'));
    // straps
    if (side < 0) {
      h.add(M(mergeGeos([[new THREE.BoxGeometry(0.006, 0.009, 0.013), mtx(-CW - 0.004, 0.002, -0.035)], [new THREE.BoxGeometry(0.006, 0.009, 0.013), mtx(-CW - 0.004, 0.002, 0.012)]]), m.leather, 'pen_loops'));
    } else {
      h.add(M(new THREE.BoxGeometry(0.016, 0.004, 0.02).translate(CW + 0.008, 0.004, 0.0), m.leather, 'clasp_strap'));
    }
    return h;
  };
  g.add(half(-1), half(1));
  g.add(M(new THREE.CylinderGeometry(0.006, 0.006, CD, seg(lod, 16), 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, -0.0002, 0), m.leather, 'spine'));
  // pencil (rests on right page along the drawn pencil)
  const pencil = new THREE.Group(); pencil.name = 'pencil';
  const pg = mergeGeos([[new THREE.CylinderGeometry(0.0034, 0.0034, 0.076, 6), mtx(0, 0, 0, 0, 0, Math.PI / 2)]]);
  pencil.add(M(pg, m.pencilBody, 'pencil_body'));
  pencil.add(M(new THREE.CylinderGeometry(0.0009, 0.0034, 0.013, 6).rotateZ(Math.PI / 2).translate(-0.0445, 0, 0), m.pencilWood, 'pencil_wood'));
  pencil.add(M(new THREE.CylinderGeometry(0.0001, 0.0009, 0.0035, 8).rotateZ(Math.PI / 2).translate(-0.0527, 0, 0), m.graphite, 'pencil_lead'));
  pencil.add(M(new THREE.CylinderGeometry(0.0037, 0.0037, 0.009, 16).rotateZ(Math.PI / 2).translate(0.0425, 0, 0), m.copper, 'pencil_ferrule'));
  pencil.add(M(new THREE.CylinderGeometry(0.0033, 0.0033, 0.006, 16).rotateZ(Math.PI / 2).translate(0.05, 0, 0), m.eraser, 'pencil_eraser'));
  pencil.position.set(0.034, 0.0158, -0.019); pencil.rotation.set(0, 1.04, -0.07);
  g.add(pencil);
  const rc = new THREE.CatmullRomCurve3([[0.004, 0.006, 0.045], [0.005, 0.0055, 0.069], [0.006, -0.002, 0.075], [0.008, -0.016, 0.08], [0.011, -0.03, 0.083]].map(p => new THREE.Vector3(...p)));
  g.add(M(ribbonGeo(rc, 0.008, 30, new THREE.Vector3(0, 1, 0), s => s * 0.4), m.ribbon, 'ribbon_bookmark'));
  // open pages face the camera, tilted back ~30° from vertical; sway instead of full spin
  g.userData.pose = [Math.PI / 3, 0, 0];
  g.userData.sway = 0.45;
  return g;
}

// ---------- 05 MEDALLION ----------
export function buildMedallion({ lod = false } = {}) {
  const m = materials();
  const g = new THREE.Group(); g.name = 'medallion';
  const RX = 0.0205, RY = 0.0285, TH = 0.0035;
  g.add(M(new THREE.CylinderGeometry(1, 1, TH, seg(lod, 72)).rotateX(Math.PI / 2).scale(RX, RY, 1), m.copperDark, 'medal_body'));
  const faceMat = std('medal_relief', { map: T('tex/medallion-face.webp'), emissiveMap: T('tex/medallion-face.webp'), emissive: 0xffffff, emissiveIntensity: 0.22, normalMap: T('tex/medallion-normal.webp', false), normalScale: new THREE.Vector2(2.2, 2.2), metalness: 0.65, roughness: 0.45 });
  g.add(M(new THREE.CircleGeometry(1, seg(lod, 72)).scale(0.0171, 0.0239, 1).translate(0, 0, TH / 2 + 0.0002), faceMat, 'medal_face'));
  const back = new THREE.CircleGeometry(1, seg(lod, 72)).scale(RX * 0.95, RY * 0.95, 1).rotateY(Math.PI).translate(0, 0, -TH / 2 - 0.0002);
  g.add(M(back, m.copper, 'medal_back'));
  const parts = [
    [new THREE.TubeGeometry(new Ellipse3(RX, RY, 0.0006), seg(lod, 140), 0.0016, seg(lod, 8, 5), true)],
    [new THREE.TubeGeometry(new Ellipse3(0.0174, 0.0242, TH / 2), seg(lod, 140), 0.0006, seg(lod, 6, 4), true)],
  ];
  const nb = 52;
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * Math.PI * 2;
    const near = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2].some(c => Math.abs(a - c) < 0.13);
    if (near) continue;
    parts.push([new THREE.SphereGeometry(0.00072, lod ? 5 : 8, lod ? 3 : 6), mtx(Math.cos(a) * 0.01895, Math.sin(a) * 0.0263, TH / 2 + 0.0002)]);
  }
  const orn = (x, y, s = 1) => {
    parts.push([new THREE.SphereGeometry(0.001, lod ? 6 : 10, lod ? 4 : 8), mtx(x, y, TH / 2 + 0.0009, 0, 0, 0, s)]);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; parts.push([new THREE.SphereGeometry(0.001, lod ? 5 : 8, lod ? 3 : 6), mtx(x + Math.cos(a) * 0.0014 * s, y + Math.sin(a) * 0.0014 * s, TH / 2 + 0.0005, 0, 0, a, 1.5 * s, 0.85 * s, 0.7 * s)]); }
  };
  orn(RX - 0.0006, 0); orn(-RX + 0.0006, 0); orn(0, RY - 0.0008); orn(0, -RY + 0.0008);
  parts.push([new THREE.ConeGeometry(0.0022, 0.004, 4), mtx(0, -RY - 0.0016, 0, Math.PI, 0, 0, 1, 1, 0.5)]);
  g.add(M(mergeGeos(parts), m.copper, 'frame_beads_ornaments'));
  // jump ring + bail
  const bail = mergeGeos([
    [new THREE.TorusGeometry(0.0026, 0.0008, 8, 20), mtx(0, RY + 0.0024, 0, 0, Math.PI / 2, 0)],
    [new THREE.LatheGeometry([[0.0044, -0.0058], [0.0056, -0.0058], [0.0061, 0], [0.0056, 0.0058], [0.0044, 0.0058], [0.0044, -0.0058]].map(p => new THREE.Vector2(...p)), 28), mtx(0, RY + 0.0098, 0, 0, 0, Math.PI / 2, 1, 1, 1)],
    [new THREE.OctahedronGeometry(0.0016), mtx(0, RY + 0.0098, 0.0062, 0, 0, 0, 0.8, 1.7, 0.45)],
  ]);
  const bm = M(bail, m.copper, 'bail'); g.add(bm);
  // chain: two strands from the bail forming the heart-shaped loop of the reference
  const k = 7.18e-5, cvt = (px, py, z) => new THREE.Vector3((px - 549) * k, -(py - 662) * k, z);
  const strand = (dir) => [[549, 156, 0], [500, 150, 0.0002], [440, 128, 0.0004], [370, 92, 0], [300, 58, -0.0006], [225, 48, -0.0012], [178, 100, -0.0018], [180, 190, -0.0024], [232, 278, -0.003], [305, 342, -0.0036], [385, 378, -0.004]]
    .map(([x, y, z]) => cvt(549 + (x - 549) * dir, y, z));
  const links = [];
  for (const dir of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3(strand(dir), false, 'centripetal');
    const len = c.getLength(), pitch = 0.0052, n = Math.floor(len / pitch);
    for (let i = 0; i <= n; i++) {
      const s = i / n, p = c.getPointAt(s), t = c.getTangentAt(s);
      const Z = new THREE.Vector3(0, 0, 1), cz = Z.clone().addScaledVector(t, -t.dot(Z)).normalize(), b = new THREE.Vector3().crossVectors(cz, t);
      const basis = new THREE.Matrix4().makeBasis(t, b, cz);
      if ((i + (dir > 0 ? 1 : 0)) % 2) basis.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      const lg = new THREE.TorusGeometry(0.0025, 0.0008, lod ? 4 : 6, lod ? 8 : 14); lg.scale(1.38, 1, 1);
      links.push([lg, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(basis)]);
    }
  }
  g.add(M(mergeGeos(links), m.copper, 'chain'));
  g.userData.pose = [0, 0, 0];
  return g;
}

export const OBJECTS = [
  { key: 'cassette', name: 'Cassette', build: buildCassette },
  { key: 'microphone', name: 'Micrófono', build: buildMicrophone },
  { key: 'candle', name: 'Vela', build: buildCandle },
  { key: 'notebook', name: 'Libreta', build: buildNotebook },
  { key: 'medallion', name: 'Medalla', build: buildMedallion },
];

// Wrap an object so its pose is applied and it is centered + scaled to `size` (max dimension).
export function framed(obj, size = 1, usePose = true) {
  const pose = new THREE.Group(); pose.name = 'pose';
  const p = usePose && obj.userData.pose || [0, 0, 0]; pose.rotation.set(p[0], p[1], p[2]);
  pose.add(obj);
  const fit = new THREE.Group(); fit.name = 'fit'; fit.add(pose);
  const fx = obj.getObjectByName('__fx'); if (fx) obj.remove(fx);
  const box = new THREE.Box3().setFromObject(pose), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  if (fx) obj.add(fx);
  const k = size / Math.max(s.x, s.y, s.z);
  pose.position.copy(c).multiplyScalar(-1);
  fit.scale.setScalar(k);
  fit.userData.radius = s.length() / 2 * k; // bounding-box radius at this scale
  return fit;
}

export const BUILDERS = Object.fromEntries(OBJECTS.map(o => [o.key, o.build]));

// Libera la geometría propia de un árbol (el objeto flotante al irse). Los materiales y texturas compartidos no se tocan:
// el cuarto puede estar usándolos en otro renderer; la memoria de GPU del flotante se va con su contexto.
export function disposeTree(root) {
  root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  if (root.parent) root.parent.remove(root);
}
