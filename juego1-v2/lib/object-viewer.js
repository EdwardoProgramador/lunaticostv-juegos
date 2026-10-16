// Object page shell for 01–05: big orbit view + real-size previews (120/80 px) + GLB export.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJECTS, runLoop, setupRenderer, makeEnv, addLights, framed, glowSprite, triCount, exportGLB, texturesReady } from './cholo-objects.js';

const CSS = `
.ov{position:relative;z-index:1}
#gl{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block}
.ov-titlewrap{display:flex;flex-direction:column;gap:6px}
.ov-title{font-size:clamp(40px,6vw,64px)}
.ov-main{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 300px;min-height:0}
.ov-stage{position:relative;min-height:520px;cursor:grab;touch-action:none}
.ov-stage:active{cursor:grabbing}
.ov-hint{position:absolute;left:28px;bottom:22px;color:#6f6474;pointer-events:none}
.ov-side{border-left:1px solid rgba(184,121,106,.18);padding:28px;display:flex;flex-direction:column;gap:22px}
.ov-sizes{display:flex;align-items:flex-end;gap:22px}
.ov-sizes figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.ov-sizes figcaption{font:600 12px/1 var(--f-ui);letter-spacing:.18em;color:#8c7f8e}
.ov-view{outline:1px dashed rgba(184,121,106,.28);outline-offset:4px}
.ov-spec{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0;font:500 15px/1.3 var(--f-ui);letter-spacing:.04em}
.ov-spec dt{color:#8c7f8e;text-transform:uppercase;letter-spacing:.16em;font-size:12px;padding-top:2px}
.ov-spec dd{margin:0;color:var(--c-peach)}
.ov-notes{margin:0;font:400 16px/1.45 var(--f-ui);color:#b9aab4;text-wrap:pretty;max-width:36ch}
@media (max-width:820px){.ov-main{grid-template-columns:1fr}.ov-stage{min-height:62vh}.ov-side{border-left:0;border-top:1px solid rgba(184,121,106,.18)}}
`;

export async function objectPage({ index, key, title, file, notes }) {
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="ch-page ov">
    <header class="ch-head">
      <div class="ov-titlewrap"><span class="ch-label">${index} / 05 · Objeto coleccionable</span><h1 class="ch-title ov-title" data-text="${title}">${title}</h1></div>
      <div class="ch-row"><button class="ch-btn ch-btn--sm" id="replay">Repetir</button><button class="ch-btn ch-btn--sm ch-btn--ghost" id="glb">Descargar GLB</button></div>
    </header>
    <main class="ov-main">
      <section class="ov-stage" id="stage" aria-label="Vista 3D de ${title}"><span class="ch-label ov-hint">Arrastra para girar · Rueda para acercar</span></section>
      <aside class="ov-side">
        <div class="ch-label">Tamaño en la web</div>
        <div class="ov-sizes">
          <figure><div class="ov-view" id="v120" style="width:120px;height:120px"></div><figcaption>120 PX</figcaption></figure>
          <figure><div class="ov-view" id="v80" style="width:80px;height:80px"></div><figcaption>80 PX</figcaption></figure>
        </div>
        <dl class="ov-spec"><dt>Triángulos</dt><dd id="tris">—</dd><dt>Materiales</dt><dd id="mats">—</dd><dt>Archivo</dt><dd>${file}</dd></dl>
        <p class="ov-notes">${notes}</p>
      </aside>
    </main>
  </div>
  <canvas id="gl"></canvas>`;

  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  setupRenderer(renderer);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x060814, 1);
  const resize = () => renderer.setSize(innerWidth, innerHeight, false);
  resize(); addEventListener('resize', resize);

  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer);
  addLights(scene);

  const def = OBJECTS.find(o => o.key === key);
  const obj = def.build();
  const fit = framed(obj, 1);
  const spin = new THREE.Group(); spin.add(fit);
  const anim = new THREE.Group(); anim.add(spin);
  scene.add(anim);

  const haze = glowSprite(0x6a48b0, 2.8, 0.22); scene.add(haze);
  const flash = glowSprite(0xffa060, 2.0, 0); scene.add(flash);

  const sphere = new THREE.Box3().setFromObject(fit).getBoundingSphere(new THREE.Sphere());
  const fov = 30, dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(fov / 2)) * 1.08;
  const mk = (d) => { const c = new THREE.PerspectiveCamera(fov, 1, 0.01, 50); c.position.set(0, d * 0.12, d); c.lookAt(0, 0, 0); return c; };
  const mainCam = mk(dist * 1.05), cam120 = mk(dist * 0.98), cam80 = mk(dist * 0.98);
  const stage = document.getElementById('stage');
  const controls = new OrbitControls(mainCam, stage);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = dist * 0.45; controls.maxDistance = dist * 2;

  document.getElementById('tris').textContent = triCount(obj).toLocaleString('es-MX');
  const mats = new Set(); obj.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => mats.add(m)); });
  document.getElementById('mats').textContent = mats.size;

  let tl;
  const intro = () => {
    if (tl) tl.kill();
    anim.position.set(0, -0.8, 0); anim.scale.setScalar(0.4); anim.rotation.set(0, -Math.PI * 1.5, 0);
    tl = gsap.timeline()
      .to(anim.position, { y: 0, duration: 1.4, ease: 'power3.out' }, 0)
      .to(anim.scale, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'back.out(1.3)' }, 0)
      .to(anim.rotation, { y: 0, duration: 1.9, ease: 'power3.out' }, 0)
      .fromTo(flash.material, { opacity: 0 }, { opacity: 0.85, duration: 0.25, ease: 'power2.out' }, 0.85)
      .to(flash.material, { opacity: 0, duration: 1.0, ease: 'power2.in' }, 1.1);
  };
  document.getElementById('replay').onclick = intro;
  document.getElementById('glb').onclick = () => exportGLB(obj, file);

  const views = [[stage, mainCam], [document.getElementById('v120'), cam120], [document.getElementById('v80'), cam80]];
  const dir = new THREE.Vector3();
  const loop = (t, dt) => {
    spin.rotation.y = obj.userData.sway ? Math.sin(t * 0.5) * obj.userData.sway : spin.rotation.y + dt * 0.35;
    spin.position.y = Math.sin(t * 1.3) * 0.025;
    obj.userData.tick && obj.userData.tick(t, dt);
    controls.update();
    renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
    for (const [el, cam] of views) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width < 2) continue;
      cam.aspect = r.width / r.height; cam.updateProjectionMatrix();
      dir.copy(cam.position).normalize();
      haze.position.copy(dir).multiplyScalar(-0.9); flash.position.copy(dir).multiplyScalar(-0.3);
      const y = innerHeight - r.bottom;
      renderer.setViewport(r.left, y, r.width, r.height); renderer.setScissor(r.left, y, r.width, r.height);
      renderer.render(scene, cam);
    }
  };
  await texturesReady();
  intro(); runLoop(loop);
  window.__viewer = { scene, obj, anim, fit, mainCam, renderer, THREE };
  return window.__viewer;
}
