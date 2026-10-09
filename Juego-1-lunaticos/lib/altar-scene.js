// Altar reward sequence (same scene and timing as page 08), packaged for reuse.
// const altar = createAltarScene({ stage, canvas, title, cta, dim }); altar.play({ fromDark: true });
import * as THREE from 'three';
import { OBJECTS, setupRenderer, makeEnv, addLights, framed, glowSprite, runLoop, texturesReady } from './cholo-objects.js';
import { buildAltar } from './altar.js';

export { texturesReady };

export function createAltarScene({ stage, canvas, title, cta, dim }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  setupRenderer(renderer); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer); scene.environmentIntensity = 0.6;
  const L = addLights(scene); L.key.intensity = 1.4; L.rim.intensity = 3.2; L.rim2.intensity = 1.4; L.fill.intensity = 0.35;
  const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 40);

  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const fx = fc.getContext('2d');
  const fg = fx.createRadialGradient(128, 128, 0, 128, 128, 128); fg.addColorStop(0, '#fff'); fg.addColorStop(0.45, '#888'); fg.addColorStop(1, '#000'); fx.fillStyle = fg; fx.fillRect(0, 0, 256, 256);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0d0912, roughness: 0.9, alphaMap: new THREE.CanvasTexture(fc), transparent: true, opacity: 0 }));
  scene.add(floor);

  const altar = buildAltar();
  const root = new THREE.Group(); root.add(altar.group); scene.add(root);
  const backGlow = glowSprite(0x6b48b8, 3.6, 0); backGlow.position.set(0, 1.1, -0.9); scene.add(backGlow);

  const items = OBJECTS.map(def => {
    const obj = def.build();
    const s = altar.slots[def.key];
    const holder = new THREE.Group(); holder.add(framed(obj, s.size, false));
    holder.rotation.set(...s.rot);
    holder.position.set(s.pos[0], 0, s.pos[2]);
    altar.group.add(holder); holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder);
    holder.position.y = s.surface ? s.pos[1] - box.min.y + 0.002 : s.pos[1] - (box.min.y + box.max.y) / 2;
    const rest = { pos: holder.position.clone(), rot: holder.rotation.clone() };
    const hit = glowSprite(0xffb070, 0.01, 0); hit.position.copy(rest.pos); altar.group.add(hit);
    const light = new THREE.PointLight(0xffa860, 0, 0, 2); light.position.copy(rest.pos).add(new THREE.Vector3(0, 0.1, 0.25)); altar.group.add(light);
    return { def, obj, holder, rest, hit, light };
  });
  const order = ['candle', 'cassette', 'microphone', 'notebook', 'medallion'].map(k => items.find(it => it.def.key === k));

  // Highest altar points per depth (y, z): arch top, pillar caps/candles, top tier, front tier.
  const TOPS = [[2.02, -0.5], [1.6, -0.3], [0.72, -0.06], [0.3, 0.45]];
  const ndc = new THREE.Vector3();
  let startY = -2.4;
  function frame() {
    const w = stage.clientWidth, h = stage.clientHeight, a = w / h;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = a;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    if (a < 0.8) {
      // mobile: fit the whole altar into the band between the title and the CTA
      const top = title.parentElement.offsetTop + title.offsetTop + title.offsetHeight + 14;
      const bot = cta.offsetTop - 14;
      const band = Math.max(140, bot - top), H = 2.2, Wd = 1.95, mid = 1.0;
      const VH = Math.max(H * h / band, Wd / (a * 0.94));
      const dist = VH / (2 * t), ppu = h / VH;
      const cy = mid - (h / 2 - (top + bot) / 2) / ppu;
      cam.position.set(0, cy + 0.3, dist); cam.lookAt(0, cy, 0);
    } else {
      const needH = 3.0, needW = 1.85;
      const dist = Math.max((needH / 2) / t, (needW / 2) / (t * a));
      const cy = 1.34;
      cam.position.set(0, cy + 0.3, dist); cam.lookAt(0, cy, 0);
    }
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // start position: every altar point below the bottom edge of the real viewport
    ndc.set(0, -1, 0.5).unproject(cam);
    const C = cam.position, d = ndc.sub(C).normalize();
    let off = Infinity;
    for (const [y, z] of TOPS) off = Math.min(off, C.y + d.y * (z - C.z) / d.z - y);
    startY = a < 0.8 ? Math.min(-2.4, off - 0.25) : -2.4;
    renderer.render(scene, cam);
  }
  new ResizeObserver(frame).observe(stage); frame();
  if (document.fonts) document.fonts.ready.then(frame);
  const hideAltar = () => { root.visible = false; gsap.set(canvas, { opacity: 0, visibility: 'hidden' }); };
  const showAltar = () => { root.visible = true; gsap.set(canvas, { opacity: 1, visibility: 'visible' }); };

  let tl;
  function reset() {
    if (tl) tl.kill();
    frame(); hideAltar();
    root.position.y = startY; floor.material.opacity = 0; backGlow.material.opacity = 0; altar.group.userData.smoke = 0;
    altar.flames.forEach(f => (f.state.flare = 0));
    gsap.set(title, { opacity: 0, y: 24, filter: 'blur(8px)' }); gsap.set(cta, { opacity: 0, y: 12 });
    items.forEach(it => { it.holder.visible = false; it.hit.material.opacity = 0; it.light.intensity = 0; });
  }
  function play({ fromDark = false } = {}) {
    reset();
    if (dim && !fromDark) gsap.set(dim, { opacity: 0 });
    order.forEach((it, i) => {
      const side = i % 2 ? 1 : -1;
      it.start = it.rest.pos.clone().add(new THREE.Vector3(side * 1.9, 1.6 + i * 0.1, 1.6));
      it.ctrl = it.rest.pos.clone().lerp(it.start, 0.5).add(new THREE.Vector3(0, 0.7, 0.5));
      it.p = { t: 0 };
    });
    tl = gsap.timeline();
    if (dim) tl.to(dim, { opacity: 0.94, duration: 0.8, ease: 'power2.out' }, 0);
    tl.call(showAltar, null, 0.3)
      .to(root.position, { y: 0, duration: 1.8, ease: 'power3.out' }, 0.3)
      .to(floor.material, { opacity: 1, duration: 1.2 }, 0.6)
      .to(backGlow.material, { opacity: 0.35, duration: 1.6 }, 0.8)
      .to(altar.group.userData, { smoke: 1, duration: 2 }, 1.4);
    altar.flames.forEach((f, i) => tl.to(f.state, { flare: 1, duration: 0.5, ease: 'power2.out' }, 1.1 + i * 0.09));
    order.forEach((it, i) => {
      const at = 2.1 + i * 0.68, B = (a, c, b, t) => a * (1 - t) * (1 - t) + 2 * c * (1 - t) * t + b * t * t;
      tl.call(() => { it.holder.visible = true; }, null, at)
        .to(it.p, { t: 1, duration: 0.85, ease: 'power2.inOut', onUpdate: () => {
          const t = it.p.t, s = it.start, c = it.ctrl, e = it.rest.pos;
          it.holder.position.set(B(s.x, c.x, e.x, t), B(s.y, c.y, e.y, t), B(s.z, c.z, e.z, t));
          it.holder.rotation.set(it.rest.rot.x + (1 - t) * 0.8, it.rest.rot.y + (1 - t) * Math.PI * 2, it.rest.rot.z);
          it.holder.scale.setScalar(0.6 + 0.4 * t);
        } }, at)
        .fromTo(it.hit.scale, { x: 0.05, y: 0.05 }, { x: 0.9, y: 0.9, duration: 0.5, ease: 'power2.out' }, at + 0.82)
        .fromTo(it.hit.material, { opacity: 0.9 }, { opacity: 0, duration: 0.8, ease: 'power2.in' }, at + 0.82)
        .fromTo(it.light, { intensity: 6 }, { intensity: 0.25, duration: 0.9, ease: 'power2.out' }, at + 0.82);
      altar.flames.forEach(f => tl.to(f.state, { flare: 1.45, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' }, at + 0.82));
    });
    tl.to(title, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 5.7)
      .to(cta, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 6.4);
    return tl;
  }
  reset();
  runLoop((t, dt) => {
    altar.tick(t, dt);
    items.forEach(it => it.obj.userData.tick && it.obj.userData.tick(t, dt));
    renderer.render(scene, cam);
  });
  return { play, reset, frame, get timeline() { return tl; }, get startY() { return startY; } };
}
