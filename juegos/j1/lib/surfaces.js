// Aged PBR surfaces for the room, the altar, the painting frame and the key (not the 5 objects: they keep cholo-objects.js).
// Every map is a pre-baked WebP in assets/tex/room/ (colour + roughness + bump, + metalness for copper/iron; drawn from one
// shared random pass so grain, scratches and grime line up). 1024 px set for High, assets/tex/room/512/ for Low / phones.
//   const S = surfaces();  S.woodBox (worn edges at the uv borders: boxes), S.woodBevel (wear on bevels, shader), S.wood,
//   S.copper, S.iron, S.plaster / S.floor / S.canvas (material params incl. colour map), S.painting (the picture)
//   setSurfaceRes(1024 | 512) swaps every tiered map in place (no shader recompile), one upload per frame.
import * as THREE from '../vendor/three-0.184.0/three.module.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ loadTexture, reloadTexture }, { asset }] = await Promise.all([
  import(`./objects.js${V}`),
  import(`./paths.js${V}`),
]);

const DIR = 'tex/room/';
const HAS_512 = new Set(['wood-col', 'wood-rough', 'wood-bump', 'woodbox-col', 'woodbox-rough', 'woodbox-bump', 'copper-col', 'copper-rough', 'copper-bump', 'copper-metal', 'canvas-rough', 'canvas-bump', 'painting']);
const q = new URLSearchParams(location.search).get('calidad');
let RES = q === 'alta' ? 1024 : q === 'baja' || q === 'minima' || matchMedia('(pointer: coarse)').matches ? 512 : 1024;
const tiered = new Map();
const url = (name, res = RES) => asset(DIR + (res === 512 && HAS_512.has(name) ? '512/' : '') + name + '.webp');
// tile: seamless maps decode as ImageBitmap; the painting is oriented (<img>, flipY)
function rt(name, srgb = false, rep = [1, 1], tile = true) {
  const t = loadTexture(url(name), srgb, tile); t.repeat.set(rep[0], rep[1]);
  if (HAS_512.has(name)) tiered.set(name, t);
  return t;
}
export function surfaceRes() { return RES; }
// other two-size textures outside the room set: assets/tex/<name>.webp (High) + assets/tex/512/<name>.webp (Low / phones),
// swapped by setSurfaceRes like the room maps (the crystal face)
const others = new Map();
export function tieredTexture(name, srgb = true, group = null) {
  const u = r => asset(`tex/${r === 512 ? '512/' : ''}${name}.webp`), t = loadTexture(u(RES), srgb, false, group);
  t.userData.urlFn = () => u(RES); others.set(t, u); return t;
}

// files of the first stage (the room as it opens) and of the later one (the key's iron)
export function surfaceUrls(res = RES) { return [...['wood', 'woodbox', 'copper'].flatMap(k => [`${k}-col`, `${k}-rough`, `${k}-bump`]), 'copper-metal', 'plaster-col', 'plaster-rough', 'plaster-bump', 'floor-col', 'floor-rough', 'floor-bump', 'canvas-rough', 'canvas-bump', 'painting'].map(n => url(n, res)); }
export const laterSurfaceUrls = (res = RES) => ['iron-col', 'iron-rough', 'iron-bump', 'iron-metal'].map(n => url(n, res));
export function setSurfaceRes(res) {
  if (res === RES) return Promise.resolve(); RES = res;
  let chain = Promise.resolve();
  for (const [t, u] of others) if (t.image) chain = chain.then(() => reloadTexture(t, u(RES))).then(() => new Promise(r => requestAnimationFrame(r))); // not loaded yet: loads at the new size later
  if (!SURF) return chain;
  for (const [name, t] of tiered) chain = chain.then(() => reloadTexture(t, url(name))).then(() => new Promise(r => requestAnimationFrame(r)));
  return chain;
}

function woodMat(name, key, o = {}) {
  return new THREE.MeshStandardMaterial({ name, map: rt(`${key}-col`, true), roughnessMap: rt(`${key}-rough`), bumpMap: rt(`${key}-bump`), bumpScale: 1.6, roughness: 1, metalness: 0, envMapIntensity: 0.6, ...o });
}
// wear on bevels: where the object-space normal is diagonal (bevels of the frame / back panel), lighter + smoother wood
function bevelWear(mat) {
  mat.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjN;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvObjN = objectNormal;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjN;')
      .replace('#include <map_fragment>', '#include <map_fragment>\nvec3 an = abs(normalize(vObjN)); float bevW = smoothstep(0.06, 0.24, 1.0 - max(max(an.x, an.y), an.z));\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 2.2 + vec3(0.035, 0.02, 0.012), bevW * 0.8);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.32, bevW * 0.8);');
  };
  mat.customProgramCacheKey = () => 'bevelWear';
  return mat;
}
function metalMat(name, key, o) {
  return new THREE.MeshStandardMaterial({ name, map: rt(`${key}-col`, true, [2, 2]), roughnessMap: rt(`${key}-rough`, false, [2, 2]), bumpMap: rt(`${key}-bump`, false, [2, 2]), metalnessMap: rt(`${key}-metal`, false, [2, 2]), roughness: 1, metalness: 1, ...o });
}

let SURF = null;
export function surfaces() {
  if (SURF) return SURF;
  const painting = rt('painting', true, [1, 1], false); painting.wrapS = painting.wrapT = THREE.ClampToEdgeWrapping;
  SURF = {
    wood: woodMat('aged_wood', 'wood'),
    woodBox: woodMat('aged_wood_edges', 'woodbox'),
    woodBevel: bevelWear(woodMat('aged_wood_bevel', 'wood')), // same maps as wood; the bevel shader makes the difference
    copper: metalMat('aged_copper', 'copper', { bumpScale: 0.8, envMapIntensity: 1.25 }),
    // room shell + painting: colour map with its detail maps on the same uv/repeat
    plaster: { map: rt('plaster-col', true, [0.45, 0.45]), roughnessMap: rt('plaster-rough', false, [0.45, 0.45]), bumpMap: rt('plaster-bump', false, [0.45, 0.45]), bumpScale: 1.2, roughness: 1 },
    floor: { map: rt('floor-col', true, [2.2, 3.6]), roughnessMap: rt('floor-rough', false, [2.2, 3.6]), bumpMap: rt('floor-bump', false, [2.2, 3.6]), bumpScale: 1.4, roughness: 1 },
    canvas: { roughnessMap: rt('canvas-rough'), bumpMap: rt('canvas-bump'), bumpScale: 0.9, roughness: 1, color: 0xf2e6d2 },
    painting,
  };
  // iron: built on first use (the key, a later stage), so its maps download only then; not enumerable, so spreading
  // surfaces() (room.js) doesn't build it
  let iron = null;
  Object.defineProperty(SURF, 'iron', { enumerable: false, get: () => iron || (iron = metalMat('aged_iron', 'iron', { bumpScale: 1, envMapIntensity: 1 })) });
  return SURF;
}
