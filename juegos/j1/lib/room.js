// El Cuarto del Cholo — the 3D room (level 2 base). Meters, y-up, the back wall at z = WALL_Z, camera looks −z.
//   const room = createRoom({ stage, canvas });
//   room.setFocus('altar' | 'full' | 'painting' | 'niche' | 'crystal', seconds);  room.onTick(fn);  room.toScreen(v3)
// Pieces: back wall with a hidden niche, worn wood floor, the shared altar (altar.js) with 5 places for the objects (a moon phase carved in the wood under each, lit in copper while an object stands there),
// the main candle (the light that casts the puzzle shadows), the ornate painting (a door on a hinge), smoke, dust.
// Three/GSAP locales; el loop duerme mientras el cuarto está cerrado y ya liberó la GPU
// (room.wake() al abrir); sin preserveDrawingBuffer; createRoom({ reduced }) = sin parallax ni sacudidas y los cambios
// de encuadre son un corte con fundido; textos de ../i18n.js; estilos en game.css (.lj1-room-load*).
import * as THREE from '../vendor/three-0.184.0/three.module.min.js';
import { gsap } from '../vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ OBJECTS, materials, setupRenderer, makeEnv, addLights, glowSprite, glowTexture, smokeTexture, spriteBatch, makeFlame, crescentGeo, mergeGeos, framed, texturesReady, textureProgress, startTextures, groupProgress, WARM }, { runLoop }, { prepareCrystalFX }, { buildAltar }, { MOON_PHASE, ALTAR_ORDER }, { bindText }, { moonLitPath }, { surfaces, surfaceUrls, laterSurfaceUrls, surfaceRes, setSurfaceRes }, { createRoomRenderer, detectQuality, BAKE, bakeVertexLight, bakedMaterial, bakeLightMap }, { forcedQuality }] = await Promise.all([
  import(`./objects.js${V}`),
  import(`./loop.js${V}`),
  import(`./crystal-fx.js${V}`),
  import(`./altar.js${V}`),
  import(`./level2-data.js${V}`),
  import(`../i18n.js${V}`),
  import(`./notebook-clue.js${V}`),
  import(`./surfaces.js${V}`),
  import(`./room-render.js${V}`),
  import(`./debug.js${V}`),
]);

export const WALL_Z = -0.62;
export const PAINT = { cx: 0, cy: 2.82, w: 1.1, h: 1.35, border: 0.15 };
export const FLAME = new THREE.Vector3(0, 0.6, 0.33);           // main candle flame = shadow light
export const PLACE_X = [-0.36, -0.18, 0, 0.18, 0.36];
const PLACE_Y = 0.672, PLACE_Z = -0.2;
const FW = PAINT.w + PAINT.border * 2, FH = PAINT.h + PAINT.border * 2;
const NICHE = { w: 0.92, h: 1.12, d: 0.34 };
// Display size + upright pose of each object on its altar place.
const ON_PLACE = {
  candle: { size: 0.13, rot: [0, 0, 0] },
  notebook: { size: 0.17, rot: [0.95, 0, 0] },
  cassette: { size: 0.145, rot: [-0.2, 0.1, 0] },
  microphone: { size: 0.165, rot: [0, -0.45, 0.12] },
  medallion: { size: 0.125, rot: [-0.12, 0, 0] },
};
const FOCUS = {
  full: { cx: 0, cy: 1.75, w: 2.4, h: 3.5, z: -0.3 },
  altar: { cx: 0, cy: 0.76, w: 0.98, h: 0.62, z: -0.15 },
  crystal: { cx: 0, cy: 1.05, w: 1.9, h: 2.0, z: -0.15 },
  painting: { cx: 0, cy: 2.5, w: 1.75, h: 2.3, z: -0.3 },
  niche: { cx: 0, cy: 2.7, w: 1.7, h: 2.0, z: -0.4 },
};

// ---------- textures ----------
// The painting on the canvas: night clouds over water (the shadow puzzle's backdrop), the same on every room page (pre-baked, surfaces.js).
export function paintingTex() { return surfaces().painting; }
// Moon phase carved into the altar's wood front (0 new … 1 full, lit side right): a groove ring + the lit part cut out.
// mask = where the groove is (alpha + copper emissive when lit), depth = bump (groove low, soft bevel).
function engraveTex(f) {
  const S = 128, draw = (bg, ink, blur) => {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, S, S); g.filter = `blur(${blur}px)`; g.fillStyle = g.strokeStyle = ink;
    g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, 52, 0, 7); g.stroke();
    if (f > 0) { moonLitPath(g, S / 2, S / 2, 42, f); g.fill(); }
    if (f < 1) { g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, 42, 0, 7); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  };
  return { mask: draw('#000', '#fff', 0.8), depth: draw('#fff', '#000', 2.2) };
}
const ENG_ON = 1.25; // engraving glow while an object stands on its place
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const rectPath = (w, h, z, r) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return new THREE.CatmullRomCurve3(s.getSpacedPoints(80).map(p => new THREE.Vector3(p.x, p.y, z)), true); };

function buildPainting(m) {
  // door = hinge on the left outer edge; inner = everything that swings
  const door = new THREE.Group(); door.name = 'painting_door'; door.position.set(PAINT.cx - FW / 2, PAINT.cy, WALL_Z + 0.002);
  const inner = new THREE.Group(); inner.position.x = FW / 2; door.add(inner);
  const outer = new THREE.Shape(); outer.moveTo(-FW / 2, -FH / 2); outer.lineTo(FW / 2, -FH / 2); outer.lineTo(FW / 2, FH / 2); outer.lineTo(-FW / 2, FH / 2); outer.lineTo(-FW / 2, -FH / 2);
  const hole = new THREE.Path(); hole.moveTo(-PAINT.w / 2, -PAINT.h / 2); hole.lineTo(-PAINT.w / 2, PAINT.h / 2); hole.lineTo(PAINT.w / 2, PAINT.h / 2); hole.lineTo(PAINT.w / 2, -PAINT.h / 2); hole.lineTo(-PAINT.w / 2, -PAINT.h / 2); outer.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outer, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 3, curveSegments: 4 });
  const bp = body.attributes.position, buv = body.attributes.uv; for (let i = 0; i < bp.count; i++) buv.setXY(i, bp.getX(i) * 1.6, bp.getY(i) * 1.6);
  const frame = new THREE.Mesh(body, m.woodBevel); frame.name = 'painting_frame'; inner.add(frame);
  const cop = [
    [new THREE.TubeGeometry(rectPath(PAINT.w + 0.03, PAINT.h + 0.03, 0.074, 0.01), 160, 0.013, 8, true)],
    [new THREE.TubeGeometry(rectPath(PAINT.w + 0.13, PAINT.h + 0.13, 0.08, 0.02), 160, 0.008, 6, true)],
    [new THREE.TubeGeometry(rectPath(FW + 0.01, FH + 0.01, 0.04, 0.02), 160, 0.012, 8, true)],
  ];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const x = sx * (FW / 2 - 0.075), y = sy * (FH / 2 - 0.075);
    cop.push([new THREE.TorusGeometry(0.04, 0.008, 8, 28), M4(x, y, 0.085)], [new THREE.SphereGeometry(0.018, 16, 12), M4(x, y, 0.085)]);
    cop.push([new THREE.OctahedronGeometry(1, 0), M4(x, y, 0.09, 0, 0, Math.PI / 4, 0.016, 0.06, 0.01)], [new THREE.OctahedronGeometry(1, 0), M4(x, y, 0.09, 0, 0, -Math.PI / 4, 0.016, 0.06, 0.01)]);
  }
  // crest: crescent moon between two stars, on top of the frame
  cop.push([crescentGeo(0.1, 0.03), M4(0, FH / 2 + 0.07, 0.05, 0, 0, Math.PI / 2 + 0.25)]);
  for (const sx of [-1, 1]) {
    cop.push([new THREE.OctahedronGeometry(1, 0), M4(sx * 0.2, FH / 2 + 0.03, 0.05, 0, 0, 0, 0.012, 0.05, 0.01)], [new THREE.OctahedronGeometry(1, 0), M4(sx * 0.2, FH / 2 + 0.03, 0.05, 0, 0, 0, 0.04, 0.012, 0.01)]);
    const arc = new THREE.TorusGeometry(0.085, 0.009, 6, 24, Math.PI * 0.9); cop.push([arc, M4(sx * 0.1, FH / 2 + 0.005, 0.05, 0, 0, sx > 0 ? Math.PI * 0.1 : 0)]);
  }
  cop.push([new THREE.BoxGeometry(0.2, 0.05, 0.012), M4(0, -FH / 2 + 0.075, 0.085)]);
  const copper = new THREE.Mesh(mergeGeos(cop), m.copper); copper.name = 'painting_copper'; inner.add(copper);
  const tex = paintingTex();
  const canvasMat = new THREE.MeshStandardMaterial({ name: 'painting_canvas', map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.18, metalness: 0, envMapIntensity: 0.5, ...m.canvas }); // aged canvas: weave + craquelure + uneven varnish
  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(PAINT.w, PAINT.h), canvasMat); canvasMesh.position.z = 0.03; canvasMesh.name = 'painting_canvas'; inner.add(canvasMesh);
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH).rotateY(Math.PI), m.wood); backing.position.z = 0.0; inner.add(backing);
  // overlays drawn by the shadow puzzle: shadows (normal blend) + lock glow (additive)
  const mkOverlay = (z, additive, res = 384) => {
    const c = document.createElement('canvas'); c.width = res; c.height = Math.round(res * PAINT.h / PAINT.w);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 1 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PAINT.w, PAINT.h), mat); mesh.position.z = z; mesh.renderOrder = 3; inner.add(mesh);
    return { canvas: c, ctx: c.getContext('2d'), tex: t, mat, mesh };
  };
  const shadow = mkOverlay(0.032, false, 640), glow = mkOverlay(0.034, true); // shadow at higher res: crisp glass edges
  return { door, inner, canvasMat, tex, shadow, glow };
}

function buildMainCandle(m) {
  const g = new THREE.Group(); g.name = 'main_candle'; g.position.set(FLAME.x, 0.2525, FLAME.z);
  const h = FLAME.y - 0.2525 - 0.045;
  g.add(new THREE.Mesh(mergeGeos([[new THREE.CylinderGeometry(0.075, 0.085, 0.016, 32), M4(0, 0.008, 0)], [new THREE.TorusGeometry(0.075, 0.006, 6, 32), M4(0, 0.016, 0, Math.PI / 2)], [new THREE.CylinderGeometry(0.052, 0.06, 0.03, 24), M4(0, 0.03, 0)], [crescentGeo(0.026, 0.006), M4(0, 0.03, 0.06, 0, 0, Math.PI / 2 + 0.3)]]), m.copper));
  const wax = [[new THREE.CylinderGeometry(0.044, 0.046, h, 28), M4(0, 0.045 + h / 2, 0)], [new THREE.CylinderGeometry(0.0025, 0.003, 0.02, 6), M4(0, 0.045 + h + 0.008, 0)]];
  for (const [a, L] of [[0.4, 0.07], [1.6, 0.12], [2.7, 0.05], [4.1, 0.09], [5.3, 0.15]]) wax.push([new THREE.CapsuleGeometry(0.008, L, 4, 8), M4(Math.sin(a) * 0.044, 0.045 + h - L / 2, Math.cos(a) * 0.044)]);
  g.add(new THREE.Mesh(mergeGeos(wax), m.wax));
  const flame = makeFlame(2.9, false); flame.group.position.set(0, 0.045 + h + 0.012, 0); flame.fx.position.copy(flame.group.position);
  g.add(flame.group, flame.fx);
  return { group: g, flame };
}

// Nivel 1 → el cuarto: trae a la caché HTTP las texturas de la primera etapa del cuarto en idle, baja prioridad (el código
// ya está cargado: este módulo lo importa todo). Solo descarga: nada se decodifica, construye ni sube a la GPU aquí.
export function prefetchRoom() {
  const go = () => surfaceUrls().forEach(u => fetch(u, { priority: 'low' }).catch(() => {}));
  'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 1500);
}

export function createRoom({ stage, canvas, reduced = false }) {
  // sin preserveDrawingBuffer: nada lee el canvas, así la GPU puede descartar el cuadro en vez de copiarlo
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  setupRenderer(renderer); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x050409, 1); renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; // soft via shadow.radius
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050409, 9, 22);
  scene.environmentIntensity = 0.35; // the simple environment (makeEnv) is made in the background warm-up
  const L = addLights(scene); L.key.intensity = 0.9; L.rim.intensity = 1.6; L.rim2.intensity = 0.8; L.fill.intensity = 0.35;
  const cam = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  const m = { ...materials(), ...surfaces() }; // room, altar, frame: aged surfaces (the 5 objects keep their own materials)

  // walls + floor
  const wallMat = new THREE.MeshStandardMaterial({ name: 'plaster', metalness: 0, color: 0xe0d0d8, envMapIntensity: 0.4, ...m.plaster });
  const ws = new THREE.Shape(); ws.moveTo(-2.8, 0); ws.lineTo(2.8, 0); ws.lineTo(2.8, 4.4); ws.lineTo(-2.8, 4.4); ws.lineTo(-2.8, 0);
  const wh = new THREE.Path(), hx = NICHE.w / 2, hy0 = PAINT.cy - NICHE.h / 2, hy1 = PAINT.cy + NICHE.h / 2;
  wh.moveTo(-hx, hy0); wh.lineTo(-hx, hy1); wh.lineTo(hx, hy1); wh.lineTo(hx, hy0); wh.lineTo(-hx, hy0); ws.holes.push(wh);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(ws), wallMat); back.position.z = WALL_Z; scene.add(back);
  const sides = new THREE.Mesh(mergeGeos([-1, 1].map(sx => [new THREE.PlaneGeometry(10, 4.4), M4(sx * 2.8, 2.2, WALL_Z + 5, 0, -sx * Math.PI / 2, 0)])), wallMat); sides.name = 'side_walls'; scene.add(sides);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 10), new THREE.MeshStandardMaterial({ color: 0x0a080c, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.4, WALL_Z + 5); scene.add(ceil);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 10), new THREE.MeshStandardMaterial({ name: 'worn_wood_floor', metalness: 0, color: 0xb8a8a0, envMapIntensity: 0.5, ...m.floor }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, WALL_Z + 5); scene.add(floor);
  const base = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 0.05), m.woodBox); base.position.set(0, 0.08, WALL_Z + 0.025); scene.add(base);

  // niche behind the painting
  const niche = new THREE.Group(); niche.name = 'niche'; scene.add(niche);
  const nz = WALL_Z - NICHE.d / 2;
  const nb = new THREE.Mesh(new THREE.PlaneGeometry(NICHE.w, NICHE.h), m.velvet); nb.position.set(0, PAINT.cy, WALL_Z - NICHE.d); niche.add(nb);
  niche.add(new THREE.Mesh(mergeGeos([
    ...[-1, 1].map(sx => [new THREE.PlaneGeometry(NICHE.d, NICHE.h), M4(sx * NICHE.w / 2, PAINT.cy, nz, 0, -sx * Math.PI / 2, 0)]),
    ...[-1, 1].map(sy => [new THREE.PlaneGeometry(NICHE.w, NICHE.d), M4(0, PAINT.cy + sy * NICHE.h / 2, nz, sy * Math.PI / 2, 0, 0)]),
  ]), m.wood));
  niche.add(new THREE.Mesh(new THREE.TubeGeometry(rectPath(NICHE.w + 0.02, NICHE.h + 0.02, WALL_Z + 0.004, 0.01), 120, 0.012, 6, true).translate(0, PAINT.cy, 0), m.copper));
  const nicheLight = new THREE.PointLight(0xffa860, 0, 0, 2); nicheLight.position.set(0, PAINT.cy + 0.2, WALL_Z - 0.05); scene.add(nicheLight);
  const nicheGlow = glowSprite(0xff9a50, 1.4, 0); nicheGlow.position.set(0, PAINT.cy, WALL_Z - NICHE.d + 0.05); scene.add(nicheGlow);
  const keyAnchor = new THREE.Group(); keyAnchor.position.set(0, PAINT.cy, WALL_Z - NICHE.d * 0.45); scene.add(keyAnchor);

  // altar (shared) + places + main candle
  const altar = buildAltar({ valance: 0.045, mats: { tiers: m.woodBox, panel: m.woodBevel, pillars: m.wood, copper: m.copper } }); scene.add(altar.group);
  altar.group.userData.smoke = 1;
  const placeRing = new THREE.MeshStandardMaterial({ color: 0x3a2018, emissive: 0xff9a50, emissiveIntensity: 0, roughness: 0.4, metalness: 0.8 });
  const plinths = new THREE.Mesh(mergeGeos(PLACE_X.map(x => [new THREE.CylinderGeometry(0.058, 0.064, 0.016, 32), M4(x, PLACE_Y - 0.008, PLACE_Z)])), m.copper); plinths.name = 'place_plinths'; scene.add(plinths);
  const places = PLACE_X.map((x, i) => {
    const g = new THREE.Group(); g.name = `place_${i + 1}`; g.position.set(x, PLACE_Y - 0.016, PLACE_Z); scene.add(g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.005, 6, 40).rotateX(Math.PI / 2).translate(0, 0.017, 0), placeRing.clone()); g.add(ring);
    const et = engraveTex(MOON_PHASE[ALTAR_ORDER[i]]);
    const eng = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.068), new THREE.MeshStandardMaterial({ name: `moon_engraving_${i + 1}`, color: 0x2a140c, roughness: 0.85, metalness: 0.15,
      alphaMap: et.mask, transparent: true, depthWrite: false, bumpMap: et.depth, bumpScale: 2.5, emissive: 0xff9a50, emissiveMap: et.mask, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
    eng.name = `moon_engraving_${i + 1}`; eng.position.set(x, 0.545, -0.06 + 0.0006); scene.add(eng);
    const glow = glowSprite(0xffb070, 0.34, 0); glow.position.set(x, PLACE_Y + 0.07, PLACE_Z + 0.02); scene.add(glow);
    return { index: i, group: g, ring, eng, glow, pos: new THREE.Vector3(x, PLACE_Y, PLACE_Z), key: null };
  });
  const main = buildMainCandle(m); scene.add(main.group);
  const mainLight = new THREE.PointLight(0xff9a4a, 6.5, 0, 2); mainLight.position.copy(FLAME).add(new THREE.Vector3(0, 0.03, 0)); scene.add(mainLight);
  // soft shadows: the main candle (the shadow-puzzle light) + the two tall front altar candles (refreshed 4×/s)
  const shadowLights = [mainLight, ...altar.flames.filter(f => f.light).slice(0, 2).map(f => f.light)];
  shadowLights.forEach((l, i) => { l.castShadow = true; Object.assign(l.shadow, { bias: -0.002, normalBias: 0.012, radius: i ? 3 : 5 }); l.shadow.mapSize.setScalar(i ? 512 : 1024); l.shadow.camera.near = 0.02; l.shadow.camera.far = 9; if (i) l.shadow.autoUpdate = false; });
  const wash = new THREE.PointLight(0xff8a4a, 1.6, 0, 1.6); wash.position.set(0, 1.5, 1.1); scene.add(wash);
  // las sombras que se refrescan a mano (autoUpdate = false) deben existir antes de cualquier dibujado: sin mapa, Three
  // enlaza una textura vacía que no es de sombra y WebGL avisa (sampler mismatch)
  const primeShadows = () => shadowLights.forEach(l => { if (l.castShadow && !l.shadow.map) l.shadow.needsUpdate = true; });
  const candle = { flame: main.flame, light: mainLight, base: 6.5, color: new THREE.Color(0xff9a4a), cold: { v: 0 }, calm: 0 };

  // the 5 objects, ready to stand on any place. The holders exist now; the models are built in the background (room.ready),
  // one per frame, so creating the room never blocks the page.
  const objects = {};
  OBJECTS.forEach(def => {
    const holder = new THREE.Group(); holder.name = `on_altar_${def.key}`; const pose = new THREE.Group(); pose.rotation.set(...ON_PLACE[def.key].rot);
    holder.add(pose); holder.visible = false; scene.add(holder);
    objects[def.key] = { def, obj: null, holder, pose, place: -1, top: 0 };
  });
  // lights inside the objects (the candle's flame) live at the scene root and are always counted (0 while the object is
  // off the altar): placing an object never changes the number of lights, so no shader recompiles
  const objLights = [];
  function buildObject(o) {
    const cfg = ON_PLACE[o.def.key], obj = o.def.build({ lod: true }), fit = framed(obj, cfg.size, false); // room detail (objects.js)
    const tmp = new THREE.Group(); tmp.rotation.set(...cfg.rot); tmp.add(fit); tmp.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tmp); o.pose.add(fit); o.pose.position.y = -box.min.y + 0.001;
    o.obj = obj; o.top = box.max.y - box.min.y;
    const ls = []; obj.traverse(l => l.isLight && ls.push(l));
    ls.forEach(l => { const a = new THREE.Object3D(); a.position.copy(l.position); l.parent.add(a); l.position.set(0, 0, 0); scene.add(l); l.intensity = 0; objLights.push({ l, holder: o.holder, anchor: a }); });
    shadowFlags(o.holder);
  }

  // painting + void glow (where the fragments will float)
  const P = buildPainting(m); scene.add(P.door);
  const SHADOW_Z = WALL_Z + 0.002 + 0.032;
  const clusterCenter = FLAME.clone().lerp(new THREE.Vector3(PAINT.cx, PAINT.cy, SHADOW_Z), 0.6);
  const voidGlow = glowSprite(0xb48cff, 0.9, 0); voidGlow.position.copy(clusterCenter); scene.add(voidGlow);
  const voidGlow2 = glowSprite(0xffa060, 0.4, 0); voidGlow2.position.copy(clusterCenter); scene.add(voidGlow2);

  // smoke + dust (the haze: 9 soft sprites in one draw call)
  const hazeBatch = spriteBatch(9, smokeTexture(), 0x8c7aa8); hazeBatch.mesh.name = 'haze'; scene.add(hazeBatch.mesh);
  const haze = Array.from({ length: 9 }, () => ({ x: (Math.random() - 0.5) * 4, y: 0.4 + Math.random() * 3, z: -0.2 + Math.random() * 1.8, sp: 0.04 + Math.random() * 0.05, ph: Math.random() * 10, s: 1.6 + Math.random() * 1.6 }));
  const DN = 140, dpos = new Float32Array(DN * 3), dseed = [];
  for (let i = 0; i < DN; i++) { dpos[i * 3] = (Math.random() - 0.5) * 4; dpos[i * 3 + 1] = Math.random() * 3.6; dpos[i * 3 + 2] = -0.5 + Math.random() * 2.5; dseed.push(Math.random() * 10); }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xffc89a, size: 0.012, map: glowTexture(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  // ---------- camera ----------
  const view = { focus: 'full', pads: { top: 70, bottom: 40 }, mix: { t: 1 }, from: null, to: null, px: 0, py: 0, tx: 0, ty: 0, shake: { v: 0 }, touch: matchMedia('(hover: none)').matches };
  const fitFocus = (f, w, h) => {
    const a = w / h, t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const band = Math.max(120, h - view.pads.top - view.pads.bottom), fw = 0.94;
    const VH = Math.max(f.h * h / band, f.w / (a * fw));
    const dist = VH / (2 * t), ppu = h / VH;
    const ly = f.cy + ((view.pads.top + h - view.pads.bottom) / 2 - h / 2) / ppu;
    return { x: f.cx, y: ly, z: f.z, dist };
  };
  const look = new THREE.Vector3();
  const RR = createRoomRenderer({ renderer, scene, cam });
  function placeCamera() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    const a = fitFocus(view.from || FOCUS[view.focus], w, h), b = fitFocus(FOCUS[view.focus], w, h), k = view.mix.t;
    const lx = a.x + (b.x - a.x) * k, ly = a.y + (b.y - a.y) * k, lz = a.z + (b.z - a.z) * k, d = a.dist + (b.dist - a.dist) * k;
    const s = view.shake.v, j = () => (Math.random() - 0.5) * s;
    look.set(lx + j() * 0.3, ly + j() * 0.3, lz);
    cam.position.set(lx + view.px * 0.22 * Math.min(1, d / 4) + j(), ly + d * 0.07 + view.py * 0.12 + j(), lz + d);
    cam.lookAt(look);
  }
  function frame() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    RR.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); placeCamera(); cam.updateMatrixWorld();
  }
  new ResizeObserver(frame).observe(stage); frame();
  stage.addEventListener('pointermove', e => {
    if (reduced) return;
    if (e.pointerType !== 'mouse') { view.touch = true; return; }
    const r = stage.getBoundingClientRect(); view.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; view.ty = -((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  stage.addEventListener('pointerleave', () => { view.tx = 0; view.ty = 0; });

  const v3 = new THREE.Vector3();
  const tickers = [];
  const engrave = (i, v, animate) => { const mat = places[i].eng.material; gsap.killTweensOf(mat); animate ? gsap.to(mat, { emissiveIntensity: v, duration: v ? 0.6 : 0.35, ease: 'power2.out' }) : (mat.emissiveIntensity = v); };
  const room = {
    THREE, renderer, scene, cam, altar, places, objects, candle, painting: P, niche: { group: niche, light: nicheLight, glow: nicheGlow, anchor: keyAnchor },
    post: RR, voidGlow: [voidGlow, voidGlow2], clusterCenter, light: FLAME.clone(), shadowZ: SHADOW_Z, PAINT, frame,
    onTick(fn) { tickers.push(fn); return () => { const i = tickers.indexOf(fn); if (i >= 0) tickers.splice(i, 1); }; },
    setPads(p) { Object.assign(view.pads, p); frame(); },
    setFocus(name, dur = 1.2) {
      if (!FOCUS[name]) return;
      if (reduced && dur > 0) { // movimiento reducido: corte de cámara escondido en un fundido corto
        gsap.killTweensOf(canvas, 'opacity');
        gsap.timeline().to(canvas, { opacity: 0, duration: 0.22, ease: 'power1.in' }).call(() => room.setFocus(name, 0)).to(canvas, { opacity: 1, duration: 0.35, ease: 'power1.out' });
        return;
      }
      const cur = view.from && view.mix.t < 1 ? lerpFocus(view.from, FOCUS[view.focus], view.mix.t) : FOCUS[view.focus];
      gsap.killTweensOf(view.mix);
      view.from = { ...cur }; view.focus = name;
      if (dur <= 0) { view.mix.t = 1; frame(); return; }
      view.mix.t = 0; gsap.to(view.mix, { t: 1, duration: dur, ease: 'power2.inOut' });
    },
    get focus() { return view.focus; },
    shake(amount = 0.05, dur = 0.5) { if (reduced) return; gsap.killTweensOf(view.shake); gsap.fromTo(view.shake, { v: amount }, { v: 0, duration: dur, ease: 'power2.out' }); },
    toScreen(v) {
      v3.copy(v).project(cam);
      return { x: (v3.x * 0.5 + 0.5) * stage.clientWidth, y: (-v3.y * 0.5 + 0.5) * stage.clientHeight, behind: v3.z > 1 };
    },
    setPaintingLight(v, dur = 0) { dur ? gsap.to(P.canvasMat, { emissiveIntensity: v, duration: dur }) : (P.canvasMat.emissiveIntensity = v); },
    // put an object on place i (or take it off with i = -1)
    putObject(key, i, { animate = true } = {}) {
      const o = objects[key]; if (!o) return;
      if (o.place >= 0 && places[o.place].key === key) { places[o.place].key = null; engrave(o.place, 0, animate); }
      o.place = i; gsap.killTweensOf([o.holder.position, o.holder.scale]);
      if (i < 0) { o.holder.visible = false; return; }
      const p = places[i]; p.key = key; engrave(i, ENG_ON, animate);
      o.holder.visible = true; o.holder.position.copy(p.pos); o.holder.rotation.set(0, 0, 0);
      if (animate) {
        gsap.fromTo(o.holder.position, { y: p.pos.y + 0.16 }, { y: p.pos.y, duration: 0.5, ease: 'bounce.out' });
        gsap.fromTo(o.holder.scale, { x: 0.6, y: 0.6, z: 0.6 }, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(2)' });
        gsap.fromTo(p.glow.material, { opacity: 0.8 }, { opacity: 0, duration: 0.7 });
      } else o.holder.scale.setScalar(1);
    },
    clearObjects() { Object.keys(objects).forEach(k => room.putObject(k, -1)); places.forEach(p => { p.key = null; p.ring.material.emissiveIntensity = 0; p.glow.material.opacity = 0; gsap.killTweensOf(p.eng.material); p.eng.material.emissiveIntensity = 0; }); },
    lightPlace(i, tl, at) {
      const p = places[i];
      tl.to(p.ring.material, { emissiveIntensity: 3, duration: 0.25, ease: 'power2.out' }, at)
        .fromTo(p.glow.material, { opacity: 0 }, { opacity: 0.9, duration: 0.2 }, at)
        .to(p.glow.material, { opacity: 0.35, duration: 0.6 }, at + 0.25)
        .to(p.eng.material, { emissiveIntensity: 2.6, duration: 0.3, ease: 'power2.out' }, at).to(p.eng.material, { emissiveIntensity: 1.9, duration: 0.6 }, at + 0.3);
    },
    flare(tl, at = 0) { (tl || gsap.timeline()).to(candle.flame.state, { flare: 1.7, duration: 0.25, ease: 'power2.out' }, at).to(candle, { base: 9, duration: 0.25 }, at).to(candle.flame.state, { flare: 1.15, duration: 1.2 }, at + 0.3).to(candle, { base: 7.5, duration: 1.2 }, at + 0.3); },
    coldFlicker(tl, at = 0) {
      tl = tl || gsap.timeline();
      tl.to(candle.cold, { v: 1, duration: 0.12 }, at)
        .to(candle.flame.state, { flare: 0.35, duration: 0.08, yoyo: true, repeat: 5, ease: 'steps(2)' }, at)
        .to(candle, { base: 1.2, duration: 0.08, yoyo: true, repeat: 5 }, at)
        .to(candle.cold, { v: 0, duration: 0.8 }, at + 0.7).set(candle.flame.state, { flare: 1 }, at + 0.7).to(candle, { base: 6.5, duration: 0.6 }, at + 0.7);
      return tl;
    },
    resetLights() { gsap.killTweensOf([candle, candle.cold, candle.flame.state]); candle.base = 6.5; candle.cold.v = 0; candle.calm = 0; candle.flame.state.flare = 1; candle.flame.state.calm = 0; },
    openPainting(tl, at = 0, dur = 1.6) {
      tl.to(P.door.rotation, { y: -1.72, duration: dur, ease: 'power2.inOut' }, at)
        .to(nicheLight, { intensity: 2.2, duration: dur }, at + 0.3)
        .to(nicheGlow.material, { opacity: 0.55, duration: dur }, at + 0.3);
      return tl;
    },
    setPaintingOpen(open, lit = open) { P.door.rotation.y = open ? -1.72 : 0; nicheLight.intensity = lit ? 0.9 : 0; nicheGlow.material.opacity = lit ? 0.22 : 0; },
    setVoid(v, dur = 0.8) { gsap.to(voidGlow.material, { opacity: v * 0.35, duration: dur }); gsap.to(voidGlow2.material, { opacity: v * 0.5, duration: dur }); },
  };
  const lerpFocus = (a, b, t) => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t, z: a.z + (b.z - a.z) * t });

  // shadows: every solid mesh casts + receives (walls/floor/ceiling only receive); flames, glass overlays and sprites don't
  const ROOM_SHELL = new Set([back, floor, ceil]);
  function shadowFlags(root) {
    root.traverse(o => {
      if (!o.isMesh) return;
      const mats = [].concat(o.material), skip = mats.some(x => x.transparent || /^flame/.test(x.name || ''));
      o.receiveShadow = !mats.every(x => x.transparent); o.castShadow = !skip && !ROOM_SHELL.has(o);
    });
  }
  shadowFlags(scene);
  sides.castShadow = false; // the side walls never stand between the candle and anything
  // fine details whose shadows are a few millimetres long: cast on High only (Low / Minima keep the shadows that read)
  const fineCasters = [base, plinths, ...places.map(p => p.ring)];
  [P.door, niche].forEach(g => g.traverse(o => o.isMesh && o.castShadow && fineCasters.push(o)));
  const trims = altar.group.getObjectByName('copper_details'); if (trims) fineCasters.push(trims);
  // environment: the room itself, captured from in front of the altar (re-captured once textures have settled) — High only
  const envHide = [hazeBatch.mesh, dust, voidGlow, voidGlow2];
  let baseEnv = null;
  const capture = () => RR.captureEnv(new THREE.Vector3(0, 1.05, 0.55), envHide);

  // ---------- Low / Minima light bake: the altar candles + front wash as light maps (back wall, floor) and per-vertex light (altar, frame, niche) ----------
  const bakeLights = [...altar.flames.filter(f => f.light).map(f => f.light), wash];
  scene.updateMatrixWorld(true); altar.tick(0, 0.016);
  const bakeSrc = bakeLights.map(l => ({ pos: l.getWorldPosition(new THREE.Vector3()), color: l.color.clone(), intensity: l.intensity, decay: l.decay }));
  const lightMapped = [];
  const lmap = (mesh, toLocal, W, H, rep, off) => { mesh.material = mesh.material.clone(); mesh.material.lightMap = bakeLightMap(mesh, bakeSrc, toLocal, W, H, rep, off); mesh.material.lightMapIntensity = 0; lightMapped.push(mesh.material); };
  // meshes that get the per-vertex bake: the room as built here (not the objects, the painting door, or anything a page adds later)
  const skipBake = new Set([P.door, ...Object.values(objects).map(o => o.holder)]);
  const inSkipped = o => { for (let p = o; p; p = p.parent) if (skipBake.has(p)) return true; return false; };
  const toBake = []; scene.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || !o.material.isMeshStandardMaterial || o.material.transparent || ROOM_SHELL.has(o) || /^flame/.test(o.material.name || '') || inSkipped(o)) return;
    toBake.push(o);
  });
  async function bake(slice) { // run in the background warm-up, in slices
    lmap(back, (s, t, v) => v.set((s - 0.5) * 5.6, t * 4.4, 0), 112, 88, [1 / 5.6, 1 / 4.4], [0.5, 0]); await slice();
    lmap(floor, (s, t, v) => v.set((s - 0.5) * 5.6, (t - 0.5) * 10, 0), 56, 100); await slice();
    const bakedMats = new Map();
    for (const o of toBake) {
      if (!bakeVertexLight(o, bakeSrc)) continue;
      if (!bakedMats.has(o.material)) bakedMats.set(o.material, bakedMaterial(o.material));
      o.material = bakedMats.get(o.material); await slice();
    }
  }
  // The two light setups. High: every candle light real-time, 3 shadow casters, glass with transmission. Low / Minima: the
  // baked candles + wash off, the main candle the only shadow, glass without the transmission pass. Both are compiled in
  // the warm-up, so a quality change only switches to programs that already exist. Nothing in play touches lights.
  const glass = new Set(); // filled once the objects are built (the candle's glass)
  const findGlass = () => Object.values(objects).forEach(o => o.holder.traverse(x => x.isMesh && [].concat(x.material).forEach(mt => { if (mt.transmission > 0 && !glass.has(mt)) { glass.add(mt); mt.userData.tx = mt.transmission; } })));
  function lightConfig(hi) {
    bakeLights.forEach(l => (l.visible = hi)); shadowLights.forEach((l, i) => { if (i) l.castShadow = hi; });
    glass.forEach(mt => (mt.transmission = hi ? mt.userData.tx : 0));
  }
  // ---------- adaptive quality ----------
  // 'high': room reflections, bloom, soft shadows from 3 candles, every candle light real-time, 1024 px surfaces, pixel ratio ≤ 2.
  // 'low': the altar candles + wash baked, only the main candle (the shadow-puzzle light) real-time with the one 512² shadow,
  //   simple environment, no bloom, pixel ratio ≤ 1.25.  'minimal': as low, plus no reflections (no environment; a little
  //   more fill light instead), the puzzle shadow at 256², pixel ratio 1.
  // Auto starts at the detected level (phones low, weak phones / software GPUs minimal, desktop high) and measures the real
  // frame rate in 1.5 s windows. During the first 12 s on screen it steps UP one level after two fast, steady windows
  // (≥ 55 fps, ≤ 2 frames over 33 ms); at any time it steps DOWN after two slow windows (< 40 fps on high, < 27 on low).
  // Margin: the gap between those thresholds, 1 s settle after every change, and a level that had to be left for being
  // slow is never tried again, so it never flips back and forth. All three are compiled in the warm-up (no recompiles).
  const LEVELS = ['minimal', 'low', 'high'];
  const DPR = devicePixelRatio || 1, forced = forcedQuality(); // ?calidad=… solo con debug
  const Q = { detected: detectQuality(renderer), mode: forced || 'auto', level: '', ceil: 2, probe: 0, warm: 0, acc: 0, n: 0, janks: 0, fast: 0, slow: 0, last: performance.now(), fns: [] };
  function setLevel(level) {
    const hi = level === 'high', min = level === 'minimal'; Q.level = level;
    renderer.setPixelRatio(hi ? Math.min(DPR, 2) : min ? 1 : Math.min(DPR, 1.25));
    RR.setBloom(hi);
    lightConfig(hi); BAKE.value = hi ? 0 : 1; lightMapped.forEach(mt => (mt.lightMapIntensity = hi ? 0 : 1));
    const ms = hi ? 1024 : min ? 256 : 512;
    if (mainLight.shadow.mapSize.x !== ms) { mainLight.shadow.mapSize.setScalar(ms); if (mainLight.shadow.map) { mainLight.shadow.map.dispose(); mainLight.shadow.map = null; } }
    mainLight.shadow.radius = hi ? 5 : min ? 2 : 3;
    fineCasters.forEach(o => (o.castShadow = hi));
    if (hi && RR.roomEnv) { scene.environment = RR.roomEnv; scene.environmentIntensity = 1.1; }
    else { scene.environment = min ? null : baseEnv; scene.environmentIntensity = 0.35; }
    L.fill.intensity = min ? 0.8 : 0.35;
    if (hi && surfaceRes() < 1024) setSurfaceRes(1024); // a phone that stepped up to high: full-size surfaces, streamed in one per frame
    Q.warm = 1; Q.acc = Q.n = Q.janks = Q.fast = Q.slow = 0;
    frame(); Q.fns.forEach(fn => fn(room.quality));
  }
  function watch() {
    const now = performance.now(), real = (now - Q.last) / 1000; Q.last = now;
    if (Q.mode !== 'auto' || document.hidden || !stage.clientWidth || real > 0.5) return;
    Q.probe += real;
    if (Q.warm > 0) { Q.warm -= real; return; }
    Q.acc += real; Q.n++; if (real > 0.034) Q.janks++;
    if (Q.acc < 1.5) return;
    const fps = Q.n / Q.acc, steady = Q.janks <= 2, i = LEVELS.indexOf(Q.level); Q.acc = Q.n = Q.janks = 0;
    Q.slow = fps < (Q.level === 'high' ? 40 : 27) ? Q.slow + 1 : 0;
    Q.fast = fps >= 55 && steady ? Q.fast + 1 : 0;
    if (Q.slow >= 2 && i > 0 && compiled.has(LEVELS[i - 1])) { Q.ceil = i - 1; setLevel(LEVELS[i - 1]); }
    else if (Q.fast >= 2 && i < Q.ceil && Q.probe < 12 && compiled.has(LEVELS[i + 1])) setLevel(LEVELS[i + 1]);
  }
  room.quality = {
    get level() { return Q.level; }, get mode() { return Q.mode; }, get detected() { return Q.detected; },
    set(mode) { Q.mode = mode; Q.ceil = 2; Q.probe = 0; setLevel(mode === 'auto' ? Q.detected : mode); },   // 'auto' | 'high' | 'low' | 'minimal'
    onChange(fn) { Q.fns.push(fn); },
  };
  setLevel(Q.mode === 'auto' ? Q.detected : Q.mode);

  // ---------- background preparation: everything the room can draw is built, uploaded and compiled before its first frame ----------
  // Runs in small slices (≤ ~8 ms of work, then the page gets a frame), so the page stays responsive while it prepares
  // (on 09 the 5/5 HUD sequence plays meanwhile). room.ready resolves when the room can open instantly.
  prepareCrystalFX(room);
  const TEX_KEYS = ['map', 'roughnessMap', 'bumpMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'normalMap', 'lightMap', 'clearcoatMap', 'sheenColorMap'];
  const texOfMat = (mt, out) => { TEX_KEYS.forEach(k => mt[k] && mt[k].isTexture && out.add(mt[k])); if (mt.uniforms) Object.values(mt.uniforms).forEach(u => u && u.value && u.value.isTexture && out.add(u.value)); return out; };
  const texOf = (root, out) => { root.traverse(o => o.material && [].concat(o.material).forEach(mt => texOfMat(mt, out))); return out; };
  let dead = false; // room.dispose(): la preparación en curso se queda parada (sus promesas no vuelven a resolverse)
  const later = () => new Promise(r => { if (dead) return; document.hidden ? setTimeout(r, 0) : requestAnimationFrame(() => setTimeout(r, 0)); }); // after the next paint
  let sliceT = 0;
  // work budget per frame: 8 ms while the room prepares out of sight (the page keeps its frame rate), 30 ms while the loading
  // screen is up (its flame and line are compositor animations, so they stay smooth)
  const slice = async (force) => { if (force || performance.now() - sliceT > (shown() ? 30 : 8)) { await later(); sliceT = performance.now(); } };
  const load = { progress: 0 };
  const step = (label, p) => { load.progress = p; }; // label: solo nombra el paso
  let warmed = false;
  // compile one level's programs: the scene state is switched and restored in the same synchronous block (no frame sees it);
  // the compile itself finishes in the driver's threads (KHR_parallel_shader_compile)
  const compiled = new Set();
  let gen = 0; // bumped when the GPU is released, so a compile that finishes afterwards doesn't count
  function compileLevel(lv, extra) {
    const hi = lv === 'high', env = scene.environment, g = gen;
    lightConfig(hi); scene.environment = lv === 'minimal' ? null : baseEnv;
    renderer.setRenderTarget(hi ? RR.hdrTarget() : null);
    const jobs = [renderer.compileAsync(scene, cam), renderer.compileAsync(extra, cam, scene)];
    renderer.setRenderTarget(null); lightConfig(Q.level === 'high'); scene.environment = env;
    return Promise.all(jobs).then(() => g === gen && compiled.add(lv)).catch(() => {}); // contexto perdido (dispose): no cuenta
  }
  // the GPU half of the preparation (also re-run when the room reopens after closing freed the GPU): simple environment,
  // texture uploads, the starting level + its neighbour compiled, room reflections, bloom passes, one frame with every
  // object placed (shadow and transmission targets allocate now, not on the first placing). p0 = progress at the start.
  async function warmGPU(p0) {
    const P = f => p0 + (1 - p0) * f;
    if (!baseEnv) { baseEnv = makeEnv(renderer); await slice(true); }
    setLevel(Q.level);
    const extra = new THREE.Group(), lent = laterObjects(); // later stages already loaded (after a reopen: the crystal)
    lent.forEach(o => extra.add(o));
    const texs = [...texOf(extra, texOf(scene, new Set()))]; sliceT = performance.now();
    for (let i = 0; i < texs.length; i++) { renderer.initTexture(texs[i]); load.progress = P(0.6 * (i + 1) / texs.length); await slice(); }
    step('textures uploaded', P(0.6));
    // the three setups: High against the HDR target (no tone mapping, linear); Low and Minima (no environment) against the
    // canvas. The starting level and its neighbour are compiled before the room opens; the third right after (in the driver's
    // background threads), and the automatic watch never switches to a level that isn't compiled yet.
    const first = Q.level === 'minimal' ? ['low', 'minimal'] : ['high', 'low'];
    for (const lv of first) { await compileLevel(lv, extra); await later(); step('compiled ' + lv, P(lv === first[0] ? 0.75 : 0.88)); }
    lent.forEach(o => o.parent === extra && extra.remove(o));
    lightConfig(true); scene.environment = baseEnv; primeShadows(); capture(); await later(); primeShadows(); RR.warmPasses(); step('reflections + passes', P(0.95)); await later();
    setLevel(Q.level);
    const list = Object.values(objects), hid = list.filter(o => !o.holder.visible); hid.forEach(o => (o.holder.visible = true));
    frame(); primeShadows(); RR.render(); hid.forEach(o => (o.holder.visible = false));
    step('ready', 1);
    warmed = true;
    const rest = LEVELS.find(l => !first.includes(l)), lent2 = laterObjects(); lent2.forEach(o => extra.add(o));
    compileLevel(rest, extra).then(() => step('compiled ' + rest + ' (after ready)', 1)); lent2.forEach(o => o.parent === extra && extra.remove(o));
  }
  // ---------- later stage: the crystal ----------
  // The crystal and its fragments (rise + shatter, shadow puzzle, fuse) are not part of the first opening: their texture
  // downloads, uploads and compiles (every level) in the background once the room is ready, while the player places the
  // objects, so it is done long before the altar is solved. Code that uses the crystal calls room.need('crystal'): it
  // resolves at once when loaded, otherwise the room's loading screen shows until it is (fallback only).
  const stageDone = new Set(); let crystalStage = null, waiting = 0;
  const laterObjects = () => stageDone.has('crystal') ? [...WARM].filter(o => !o.parent) : [];
  function loadCrystal() {
    return crystalStage || (crystalStage = (async () => {
      await room.ready;
      const tw = startTextures('crystal'); let got = false; tw.then(() => (got = true));
      while (!got) { if (waiting) load.progress = 0.6 * groupProgress('crystal'); await later(); }
      await tw; step('crystal downloaded', 0.6);
      while (!warmed) await later(); // not while the GPU is released (room closed)
      const extra = new THREE.Group(), lent = [...WARM].filter(o => !o.parent); lent.forEach(o => extra.add(o));
      const texs = [...texOf(extra, new Set())]; WARM.forEach(o => o.parent && o.parent !== extra && texOf(o, new Set()).forEach(x => texs.push(x)));
      sliceT = performance.now();
      for (let i = 0; i < texs.length; i++) { renderer.initTexture(texs[i]); await slice(); }
      for (const lv of LEVELS) { await compileLevel(lv, extra); await later(); }
      lent.forEach(o => o.parent === extra && extra.remove(o));
      stageDone.add('crystal'); step('crystal ready', 1);
      laterSurfaceUrls().forEach(u => fetch(u, { priority: 'low' }).catch(() => {})); // the key's iron, into the HTTP cache for its stage
    })());
  }
  room.has = name => stageDone.has(name);
  room.need = name => {
    if (name !== 'crystal' || stageDone.has(name)) return Promise.resolve();
    waiting++; return loadCrystal().finally(() => waiting--);
  };
  room.ready = (async () => {
    await later(); // the page paints first
    const list = Object.values(objects);
    for (let i = 0; i < list.length; i++) { buildObject(list[i]); step('model ' + list[i].def.key, 0.04 * (i + 1)); await slice(true); }
    findGlass(); await bake(slice); step('bake', 0.25);
    let got = false; const tw = texturesReady().then(() => (got = true)); // every texture requested so far (incl. the crystal's)
    while (!got) { load.progress = 0.25 + 0.35 * textureProgress(); await later(); }
    await tw; step('textures downloaded', 0.6);
    await warmGPU(0.6);
  })();
  room.ready.then(() => 'requestIdleCallback' in window ? requestIdleCallback(loadCrystal, { timeout: 1500 }) : setTimeout(loadCrystal, 300));

  // ---------- closing the room frees the GPU ----------
  // Once the room has been on screen and closes, every geometry, texture, material program, shadow map, render target and
  // environment map is released (the scene itself stays in memory). Reopening re-runs warmGPU (loading screen if it takes
  // more than 150 ms); nothing is rebuilt or downloaded again.
  let seen = false, released = false, rewarming = false;
  function releaseGPU() {
    warmed = false; released = true; compiled.clear(); gen++;
    const geos = new Set(), mats = new Set(), texs = new Set();
    const collect = root => root.traverse(o => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material) [].concat(o.material).forEach(mt => { mats.add(mt); });
      if (o.isLight && o.shadow && o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
    });
    collect(scene); WARM.forEach(o => !o.parent && collect(o));
    mats.forEach(mt => texOfMat(mt, texs));
    geos.forEach(g => g.dispose()); texs.forEach(x => x.dispose()); mats.forEach(mt => mt.dispose());
    RR.dispose(); if (baseEnv) { baseEnv.dispose(); baseEnv = null; } scene.environment = null;
    renderer.renderLists.dispose();
    step('released', 0); load.progress = 0;
  }
  function closedOrOpened(vis) {
    if (warmed && vis) seen = true;
    if (warmed && !vis && seen) { seen = false; releaseGPU(); }
    if (released && vis && !rewarming) { rewarming = true; warmGPU(0).then(() => { released = rewarming = false; }); }
  }

  // loading screen: only if the room is opened before it is ready (after 150 ms, so a near-ready room never flashes it)
  const loader = document.createElement('div'); loader.className = 'lj1-room-load'; loader.setAttribute('role', 'status');
  loader.innerHTML = `<div class="lj1-room-load-candle" aria-hidden="true"><span class="lj1-room-load-halo"></span><span class="lj1-room-load-flame"></span><span class="lj1-room-load-wick"></span><span class="lj1-room-load-wax"></span></div><div class="lj1-room-load-line" aria-hidden="true"><span></span></div><p class="lj1-room-load-text"></p>`;
  canvas.after(loader);
  bindText(loader.querySelector('.lj1-room-load-text'), 'roomLoading');
  const loadBar = loader.querySelector('.lj1-room-load-line span'), host = canvas.parentElement;
  let loadShown = 0;
  const loaderOn = on => { loader.classList.toggle('is-on', on); host.classList.toggle('is-loading', on); };
  const loaderTick = (dt) => {
    if (warmed && !waiting) { if (loadShown) { loadBar.style.transform = 'scaleX(1)'; loaderOn(false); loadShown = 0; } return; }
    if (!shown()) { if (loadShown) loaderOn(false); loadShown = 0; return; }
    loadShown += dt; if (loadShown > 0.15) loaderOn(true);
    loadBar.style.transform = `scaleX(${load.progress.toFixed(3)})`;
  };

  let shadowT = 0;
  const cold = new THREE.Color(0x86a4ff);
  const shown = () => canvas.isConnected && !canvas.closest('.is-closed') && stage.clientWidth > 0;
  const loop = runLoop((t, dt) => {
    loaderTick(dt); const vis = shown(); closedOrOpened(vis);
    // cerrado: el loop se duerme en cuanto no queda nada que hacer (nunca abierto, o GPU ya liberada); room.wake() lo despierta
    if (!vis && !loadShown && (!seen || released)) { loop.pause('closed'); Q.last = performance.now(); return; }
    if (!warmed || !vis) { Q.last = performance.now(); return; } // nothing renders while the room is closed or warming up
    watch();
    shadowT += dt; if (shadowT > 0.25) { shadowT = 0; shadowLights.forEach((l, i) => { if (i && l.castShadow) l.shadow.needsUpdate = true; }); }
    altar.tick(t, dt);
    candle.flame.state.calm = candle.calm;
    candle.flame.tick(t);
    const n = (Math.sin(t * 11.3) * 0.5 + Math.sin(t * 27.1) * 0.3 + Math.sin(t * 4.7) * 0.2) * (1 - candle.calm * 0.9);
    mainLight.intensity = candle.base * (1 + n * 0.16);
    mainLight.color.copy(candle.color).lerp(cold, candle.cold.v);
    if (BAKE.value) BAKE.value = 1 + n * 0.06; // baked candles flicker a little with the main one
    Object.values(objects).forEach(o => o.holder.visible && o.obj && o.obj.userData.tick && o.obj.userData.tick(t, dt));
    objLights.forEach(x => { if (x.holder.visible) x.anchor.getWorldPosition(x.l.position); else x.l.intensity = 0; });
    haze.forEach((u, i) => hazeBatch.set(i, u.x + Math.sin(t * u.sp + u.ph) * 0.8, u.y + Math.sin(t * u.sp * 0.7 + u.ph) * 0.2, u.z, u.s, t * 0.02 + u.ph, 0.05 + Math.sin(t * 0.2 + u.ph) * 0.02)); hazeBatch.update();
    const dp = dgeo.attributes.position;
    for (let i = 0; i < DN; i++) { let y = dp.getY(i) + dt * 0.02; if (y > 3.8) y = 0; dp.setXYZ(i, dp.getX(i) + Math.sin(t * 0.3 + dseed[i]) * dt * 0.02, y, dp.getZ(i)); }
    dp.needsUpdate = true;
    voidGlow.material.rotation = t * 0.1;
    // parallax: mouse on desktop, slow idle drift on touch
    const ix = reduced ? 0 : view.touch ? Math.sin(t * 0.21) * 0.5 : view.tx, iy = reduced ? 0 : view.touch ? Math.sin(t * 0.17) * 0.35 : view.ty;
    view.px += (ix - view.px) * Math.min(1, dt * 2.5); view.py += (iy - view.py) * Math.min(1, dt * 2.5);
    placeCamera();
    tickers.forEach(fn => fn(t, dt));
    primeShadows();
    RR.render();
  });
  room.wake = () => loop.resume('closed');
  // fuera de la página (reinicio del juego): todo lo de la GPU y el contexto
  room.dispose = () => { dead = true; loop.dispose(); if (!released) releaseGPU(); renderer.dispose(); renderer.forceContextLoss(); loader.remove(); };
  return room;
}
