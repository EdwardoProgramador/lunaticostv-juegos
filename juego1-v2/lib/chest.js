// The box on the home page (level 2): small antique chest, black wood, worn copper corners, moon emblem, keyhole.
//   const box = createChest({ mount });  box.tryOpen({ hasKey, from })  → shake + "Cerrada" without key; with key:
//   key flies to the keyhole, turns, lid opens with warm light, then showReveal() covers the screen.
import * as THREE from 'three';
import { materials, crescentGeo, mergeGeos, glowSprite, setupRenderer, makeEnv, addLights, runLoop, loadTexture } from './cholo-objects.js';
import { buildKey } from './key.js';
import { TEXT } from './level2-text.js';
import { flyIcon } from './room-page.js';

const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const W = 0.32, D = 0.2, HB = 0.15;

export function buildChest() {
  const m = materials();
  const black = new THREE.MeshStandardMaterial({ name: 'black_wood', map: loadTexture('assets/tex/obj/carved_wood-col.webp', true, true), color: 0x5c5660, roughness: 0.55, metalness: 0.05 });
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

const CSS = `
.cbox{position:absolute;z-index:4;width:150px;height:130px;pointer-events:none}
/* the canvas is 1.9× the box area (same framing, wider fov) and radially masked, so light and glow fade out long before its edges */
.cbox canvas{position:absolute;left:-45%;top:-45%;width:190%;height:190%;display:block;pointer-events:none;background:transparent;
  -webkit-mask-image:radial-gradient(closest-side,#000 58%,transparent 100%);mask-image:radial-gradient(closest-side,#000 58%,transparent 100%)}
.cbox-hit{position:absolute;left:22%;right:22%;top:30%;bottom:10%;border:0;background:transparent;cursor:pointer;pointer-events:auto;border-radius:12px}
.cbox-hit:focus-visible{outline:2px solid var(--c-candle);outline-offset:2px}
.cbox-tag{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);padding:4px 10px;white-space:nowrap;pointer-events:none;opacity:0;
  font:600 12px/1 var(--f-ui);letter-spacing:.2em;text-transform:uppercase;color:#F2D2BC;background:#140f1c;border:1px solid rgba(184,121,106,.6)}
@container (max-width:640px){.cbox{width:116px;height:100px}}
.creveal{position:absolute;inset:0;z-index:95;display:none;align-items:center;justify-content:center;flex-direction:column;gap:28px;padding:calc(24px + env(safe-area-inset-top,0px)) 6% calc(24px + env(safe-area-inset-bottom,0px));
  background:radial-gradient(ellipse at 50% 55%,rgba(255,170,90,.34) 0%,rgba(120,60,40,.25) 28%,rgba(8,6,14,.96) 62%,#030206 100%)}
.creveal.is-on{display:flex}
.creveal h1{font-size:clamp(36px,6.4cqi,92px);text-align:center;max-width:13ch;text-wrap:balance}
.creveal .room-x{position:absolute;right:calc(18px + env(safe-area-inset-right,0px));top:calc(18px + env(safe-area-inset-top,0px))}
`;
let cssDone = false;

export function createChest({ mount, right = 28, top = 0 }) {
  if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; }
  const el = document.createElement('div'); el.className = 'cbox';
  el.innerHTML = `<canvas></canvas><button class="cbox-hit" aria-label="${TEXT.boxLabel}"></button><span class="cbox-tag">${TEXT.locked}</span>`;
  mount.appendChild(el);
  const canvas = el.querySelector('canvas'), hit = el.querySelector('.cbox-hit'), tag = el.querySelector('.cbox-tag');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  setupRenderer(renderer); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer); scene.environmentIntensity = 0.8;
  const Lg = addLights(scene); Lg.key.intensity = 2.6;
  const C = buildChest(); scene.add(C.group); C.group.rotation.y = -0.38;
  const key = buildKey(); key.visible = false; key.scale.setScalar(0.12); scene.add(key);
  const SPAN = 1.9; // canvas / box size (see CSS): fov widened by the same factor, so the box keeps its size and position
  const cam = new THREE.PerspectiveCamera(2 * THREE.MathUtils.radToDeg(Math.atan(SPAN * Math.tan(THREE.MathUtils.degToRad(15)))), 150 / 130, 0.01, 10); cam.position.set(0, 0.36, 0.86); cam.lookAt(0, 0.1, 0);
  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(size).observe(el); size();
  renderer.compileAsync(scene, cam).catch(() => {}); // the hidden key too: no compile when it appears
  const S = { open: false, busy: false };
  const kh = new THREE.Vector3();
  runLoop(t => {
    // idle glint: a small star sliding along the lid band every few seconds
    const ph = (t % 3.6) / 3.6;
    C.glint.position.set(-W / 2 + 0.01, HB + Math.sin(ph * Math.PI) * 0.1, -D / 2 + 0.005 + ph * D);
    C.glint.material.opacity = S.open ? 0 : Math.max(0, Math.sin(ph * Math.PI)) * 0.9;
    C.glint.scale.setScalar(0.05 + Math.sin(t * 20) * 0.01);
    if (!S.busy) C.group.position.y = Math.sin(t * 1.4) * 0.004;
    renderer.render(scene, cam);
  });
  const keyholeScreen = () => {
    C.group.updateMatrixWorld(true); kh.copy(C.keyhole).applyMatrix4(C.group.matrixWorld).project(cam);
    return { x: (kh.x * 0.5 + 0.5) * canvas.clientWidth + canvas.offsetLeft + el.offsetLeft, y: (-kh.y * 0.5 + 0.5) * canvas.clientHeight + canvas.offsetTop + el.offsetTop };
  };
  function shake() {
    gsap.killTweensOf([C.group.rotation, tag]);
    gsap.timeline().to(C.group.rotation, { z: 0.08, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }).set(C.group.rotation, { z: 0 })
      .fromTo(C.lid.rotation, { x: 0 }, { x: -0.06, duration: 0.05, repeat: 5, yoyo: true }, 0).set(C.lid.rotation, { x: 0 });
    gsap.timeline().fromTo(tag, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25 }).to(tag, { opacity: 0, duration: 0.4, delay: 1.2 });
  }
  function unlock({ from, keySrc, onOpen }) {
    S.busy = true;
    const tl = gsap.timeline();
    const to = keyholeScreen();
    tl.add(flyIcon(mount, keySrc, from, to, { dur: 0.8, size: 64, lift: 120 }), 0);
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
  function reset() {
    gsap.killTweensOf([C.lid.rotation, C.inner.material, C.glow.material, C.glow.scale, C.light, key.position, tag]);
    C.lid.rotation.x = 0; C.inner.material.opacity = 0; C.glow.material.opacity = 0; C.glow.scale.setScalar(0.5); C.light.intensity = 0;
    key.visible = false; S.open = false; S.busy = false; gsap.set(tag, { opacity: 0 });
  }
  return { el, hit, shake, unlock, reset, get open() { return S.open; }, get busy() { return S.busy; } };
}

export function createReveal({ mount, onEnter }) {
  const el = document.createElement('div'); el.className = 'creveal'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<h1 class="ch-title" data-text="${TEXT.revealTitle}">${TEXT.revealTitle}</h1><button class="ch-btn">${TEXT.revealButton}</button><button class="room-x" aria-label="${TEXT.close}"></button>`;
  mount.appendChild(el);
  const h = el.querySelector('h1'), b = el.querySelector('.ch-btn');
  if (onEnter) b.onclick = onEnter;
  const hide = () => gsap.to(el, { opacity: 0, duration: 0.4, onComplete: () => el.classList.remove('is-on') });
  el.querySelector('.room-x').onclick = hide;
  return {
    el, hide,
    show() {
      el.classList.add('is-on');
      return gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' })
        .fromTo(h, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, 0.3)
        .fromTo(b, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 1.0);
    },
    reset() { gsap.killTweensOf([el, h, b]); el.classList.remove('is-on'); },
  };
}
