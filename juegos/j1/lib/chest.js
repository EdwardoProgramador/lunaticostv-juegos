// The box on the home page (level 2): small antique chest, black wood, worn copper corners, moon emblem, keyhole.
//   const box = createChest({ mount });  box.shake() (sin llave: "Cerrada")  ·  box.armKey(); box.unlock({ from, keySrc, layer, onOpen }):
//   key flies to the keyhole, turns, lid opens with warm light, then the final screen (../box.js) covers the screen.
//   box.setOpen(): ya abierta (juego completado), sin animación: tapa abierta, luz dentro, la llave puesta en la cerradura.
// Port (juego1-v2/lib/chest.js): Three/GSAP locales, estilos en game.css (.lj1-box*), el render se pausa con la caja fuera
// de pantalla, la pestaña oculta o pause('room'); pixel ratio según la calidad del dispositivo; el vuelo de la llave va en
// coordenadas de viewport (layer = capa fija a pantalla completa); textos de ../i18n.js. La pantalla final vive en ../box.js.
import * as THREE from '../vendor/three-0.184.0/three.module.min.js';
import { gsap } from '../vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ materials, crescentGeo, mergeGeos, glowSprite, setupRenderer, makeEnv, addLights, loadTexture }, { runLoop }, { detectQuality, PIXEL_RATIO }, { buildKey }, { t }, { flyIcon }] = await Promise.all([
  import(`./objects.js${V}`),
  import(`./loop.js${V}`),
  import(`./quality.js${V}`),
  import(`./key.js${V}`),
  import(`../i18n.js${V}`),
  import(`./dom.js${V}`),
]);

const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const W = 0.32, D = 0.2, HB = 0.15;

export function buildChest() {
  const m = materials();
  const black = new THREE.MeshStandardMaterial({ name: 'black_wood', map: loadTexture('tex/obj/carved_wood-col.webp', true, true), color: 0x5c5660, roughness: 0.55, metalness: 0.05 });
  const g = new THREE.Group(); g.name = 'caja';
  g.add(new THREE.Mesh(new THREE.BoxGeometry(W, HB, D).translate(0, HB / 2, 0), black));
  const cop = [[new THREE.BoxGeometry(W + 0.014, 0.022, D + 0.014), M4(0, 0.011, 0)], [new THREE.BoxGeometry(W + 0.01, 0.012, D + 0.01), M4(0, HB - 0.006, 0)]];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (W / 2 + 0.003), z = sz * (D / 2 + 0.003);
    cop.push([new THREE.BoxGeometry(0.008, HB * 0.9, 0.05), M4(x, HB / 2, z - sz * 0.022)], [new THREE.BoxGeometry(0.05, HB * 0.9, 0.008), M4(x - sx * 0.022, HB / 2, z)]);
    cop.push([new THREE.SphereGeometry(0.008, 10, 8), M4(x, HB * 0.82, z)], [new THREE.SphereGeometry(0.008, 10, 8), M4(x, HB * 0.18, z)]);
  }
  // escutcheon + moon emblem on the front
  cop.push([new THREE.CylinderGeometry(0.032, 0.032, 0.006, 28).rotateX(Math.PI / 2), M4(0, HB - 0.045, D / 2 + 0.003, 0, 0, 0, 1, 1.25, 1)]);
  const body = new THREE.Mesh(mergeGeos(cop), m.copper); body.name = 'caja_cobre'; g.add(body);
  const hole = new THREE.Mesh(mergeGeos([[new THREE.CircleGeometry(0.009, 20), M4(0, HB - 0.036, D / 2 + 0.0065)], [new THREE.PlaneGeometry(0.008, 0.022), M4(0, HB - 0.05, D / 2 + 0.0065)]]), new THREE.MeshBasicMaterial({ color: 0x050304 }));
  hole.name = 'cerradura'; g.add(hole);
  const keyhole = new THREE.Vector3(0, HB - 0.042, D / 2 + 0.006);
  // lid: half-round, hinged at the back top edge
  const lid = new THREE.Group(); lid.name = 'tapa'; lid.position.set(0, HB, -D / 2); g.add(lid);
  const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.absarc(0, 0, D / 2, Math.PI, 0, true); sh.lineTo(-D / 2, 0);
  const lg = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 24 }); lg.rotateY(Math.PI / 2); lg.translate(-W / 2, 0, D / 2);
  const lp = lg.attributes.position, luv = lg.attributes.uv; for (let i = 0; i < lp.count; i++) luv.setXY(i, lp.getX(i) * 3, (lp.getY(i) + lp.getZ(i)) * 3);
  lid.add(new THREE.Mesh(lg, black));
  const lc = [];
  for (const x of [-W / 2 + 0.01, -0.07, 0.07, W / 2 - 0.01]) lc.push([new THREE.TorusGeometry(D / 2 + 0.003, 0.006, 6, 24, Math.PI), M4(x, 0, D / 2, 0, Math.PI / 2, 0)]);
  lc.push([crescentGeo(0.026, 0.008), M4(0, 0.072, D / 2 + 0.072, -0.8, 0, Math.PI / 2 + 0.3)]);
  lc.push([new THREE.BoxGeometry(0.03, 0.03, 0.008), M4(0, 0.002, D - 0.002)]);
  lid.add(Object.assign(new THREE.Mesh(mergeGeos(lc), m.copper), { name: 'tapa_cobre' }));
  // warm light inside (shown when open)
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.02, D - 0.02).rotateX(-Math.PI / 2).translate(0, HB - 0.01, 0), new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0, toneMapped: false }));
  g.add(inner);
  const fx = new THREE.Group(); fx.name = '__fx'; g.add(fx);
  const glow = glowSprite(0xffa050, 0.5, 0); glow.position.set(0, HB + 0.06, 0); fx.add(glow);
  const glint = glowSprite(0xfff0d8, 0.07, 0); fx.add(glint);
  const light = new THREE.PointLight(0xffa860, 0, 0, 2); light.position.set(0, HB + 0.1, 0); fx.add(light);
  return { group: g, lid, keyhole, inner, glow, glint, light };
}


export function createChest({ mount, reduced = false }) {
  const el = document.createElement('div'); el.className = 'lj1-scope lj1-box';
  el.innerHTML = `<canvas></canvas><button type="button" class="lj1-box-hit"></button><span class="lj1-box-tag" aria-hidden="true"></span>`;
  mount.appendChild(el);
  const canvas = el.querySelector('canvas'), hit = el.querySelector('.lj1-box-hit'), tag = el.querySelector('.lj1-box-tag');
  const relang = () => { hit.setAttribute('aria-label', t().boxLabel); tag.textContent = t().locked; };
  relang();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  setupRenderer(renderer); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PIXEL_RATIO[detectQuality(renderer)])); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer); scene.environmentIntensity = 0.8;
  const Lg = addLights(scene); Lg.key.intensity = 2.6;
  const C = buildChest(); scene.add(C.group); C.group.rotation.y = -0.38;
  // la llave 3D (hierro + cobre del cuarto) se construye solo cuando el jugador ya la tiene: armKey(). Sin llave no se
  // descargan sus texturas.
  let key = null;
  const armKey = () => { if (key) return; key = buildKey(); key.visible = false; key.scale.setScalar(0.12); scene.add(key); renderer.compileAsync(scene, cam).catch(() => {}); };
  const SPAN = 1.9; // canvas / box size (see CSS): fov widened by the same factor, so the box keeps its size and position
  const cam = new THREE.PerspectiveCamera(2 * THREE.MathUtils.radToDeg(Math.atan(SPAN * Math.tan(THREE.MathUtils.degToRad(15)))), 150 / 130, 0.01, 10); cam.position.set(0, 0.36, 0.86); cam.lookAt(0, 0.1, 0);
  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(size).observe(el); size();
  renderer.compileAsync(scene, cam).catch(() => {});
  const S = { open: false, busy: false };
  const kh = new THREE.Vector3();
  const loop = runLoop(t => {
    // idle glint: a small star sliding along the lid band every few seconds
    const ph = (t % 3.6) / 3.6;
    C.glint.position.set(-W / 2 + 0.01, HB + Math.sin(ph * Math.PI) * 0.1, -D / 2 + 0.005 + ph * D);
    C.glint.material.opacity = S.open ? 0 : Math.max(0, Math.sin(ph * Math.PI)) * 0.9;
    C.glint.scale.setScalar(0.05 + Math.sin(t * 20) * 0.01);
    if (!S.busy && !S.open && !reduced) C.group.position.y = Math.sin(t * 1.4) * 0.004;
    renderer.render(scene, cam);
  });
  // fuera de pantalla no se dibuja
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => (e.isIntersecting ? loop.resume('offscreen') : loop.pause('offscreen'))) : null;
  if (io) io.observe(el);
  // posición de la cerradura en coordenadas de viewport
  const keyholeScreen = () => {
    C.group.updateMatrixWorld(true); kh.copy(C.keyhole).applyMatrix4(C.group.matrixWorld).project(cam);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (kh.x * 0.5 + 0.5) * r.width, y: r.top + (-kh.y * 0.5 + 0.5) * r.height };
  };
  function shake() {
    gsap.killTweensOf([C.group.rotation, tag]);
    gsap.timeline().to(C.group.rotation, { z: 0.08, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }).set(C.group.rotation, { z: 0 })
      .fromTo(C.lid.rotation, { x: 0 }, { x: -0.06, duration: 0.05, repeat: 5, yoyo: true }, 0).set(C.lid.rotation, { x: 0 });
    gsap.timeline().fromTo(tag, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25 }).to(tag, { opacity: 0, duration: 0.4, delay: 1.2 });
  }
  function unlock({ from, keySrc, layer, onOpen }) {
    S.busy = true; armKey();
    const tl = gsap.timeline();
    const to = keyholeScreen();
    tl.add(flyIcon(layer, keySrc, from, to, { dur: 0.8, size: 64, lift: 120 }), 0);
    // 3D key in the keyhole: bit first (+y → −z), then pushed in and turned
    const hole = C.keyhole.clone().applyMatrix4(C.group.matrixWorld);
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(C.group.quaternion);
    tl.call(() => { key.visible = true; key.quaternion.copy(C.group.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))); key.position.copy(hole).addScaledVector(dir, 0.05); }, null, 0.78)
      .to(key.position, { x: hole.x + dir.x * 0.008, y: hole.y, z: hole.z + dir.z * 0.008, duration: 0.3, ease: 'power2.in' }, 0.8)
      .to({ a: 0 }, { a: Math.PI / 2, duration: 0.45, ease: 'power2.inOut', onUpdate() { const a = this.targets()[0].a; key.quaternion.copy(C.group.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, a, 0))); } }, 1.2)
      .to(C.lid.rotation, { x: -0.12, duration: 0.15, ease: 'power2.out' }, 1.7)
      .to(C.lid.rotation, { x: -1.95, duration: 0.9, ease: 'power3.out' }, 1.9)
      .to(C.inner.material, { opacity: 1, duration: 0.5 }, 1.9)
      .to(C.glow.material, { opacity: 1, duration: 0.6 }, 1.9)
      .to(C.glow.scale, { x: 0.75, y: 0.75, duration: 1.2 }, 1.9)
      .to(C.light, { intensity: 0.6, duration: 0.6 }, 1.9)
      .call(() => { S.open = true; onOpen && onOpen(); }, null, 2.5);
    return tl;
  }
  function setOpen() {
    if (S.open) return;
    armKey(); gsap.killTweensOf([C.lid.rotation, C.inner.material, C.glow.material, C.glow.scale, C.light, tag]);
    C.group.position.y = 0; C.group.updateMatrixWorld(true);
    const hole = C.keyhole.clone().applyMatrix4(C.group.matrixWorld), dir = new THREE.Vector3(0, 0, 1).applyQuaternion(C.group.quaternion);
    key.visible = true; key.position.copy(hole).addScaledVector(dir, 0.008);
    key.quaternion.copy(C.group.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0)));
    C.lid.rotation.x = -1.95; C.inner.material.opacity = 1; C.glow.material.opacity = 1; C.glow.scale.setScalar(0.75); C.light.intensity = 0.6;
    S.open = true; S.busy = false; gsap.set(tag, { opacity: 0 });
  }
  function reset() {
    gsap.killTweensOf([C.lid.rotation, C.inner.material, C.glow.material, C.glow.scale, C.light, tag]); if (key) gsap.killTweensOf(key.position);
    C.lid.rotation.x = 0; C.inner.material.opacity = 0; C.glow.material.opacity = 0; C.glow.scale.setScalar(0.5); C.light.intensity = 0;
    if (key) key.visible = false; S.open = false; S.busy = false; gsap.set(tag, { opacity: 0 });
  }
  function dispose() {
    loop.dispose(); if (io) io.disconnect();
    gsap.killTweensOf([C.group.rotation, C.lid.rotation, C.inner.material, C.glow.material, C.glow.scale, C.light, tag]); if (key) gsap.killTweensOf(key.position);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    if (scene.environment) scene.environment.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    el.remove();
  }
  return { el, hit, shake, unlock, setOpen, reset, relang, dispose, armKey, pause: r => loop.pause(r), resume: r => loop.resume(r), get open() { return S.open; }, get busy() { return S.busy; } };
}
