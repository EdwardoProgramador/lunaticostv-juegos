// Cinematic rendering for the room: HDR pass → bloom (candle flames, copper highlights, glowing cracks) → filmic output
// (the renderer's ACES tone mapping + sRGB, applied once at the end), and an environment map captured from the room itself
// so metal, copper and glass reflect the real walls, painting and candles.
//   const R = createRoomRenderer({ renderer, scene, cam });  R.setSize(w, h);  R.render();  R.captureEnv(pos, hide)  R.setBloom(on)
// Also the adaptive-quality helpers used by room.js: detectQuality, and the Low-quality light bake (BAKE, bakeLightMap, bakeVertexLight, bakedMaterial).
import * as THREE from '../vendor/three.module.min.js';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';

// threshold is in HDR scene units: candle light makes the wax ~100× brighter than 1, so only flames, hot copper and
// glowing cracks pass. The high-pass is patched to bloom only the excess over the threshold, Reinhard-capped (CAP), so
// very hot pixels give a soft halo instead of washing out the frame.
export { detectQuality } from './quality.js';

// Baked candle light for Low quality. Light sources = [{ pos (world), color (linear), intensity, decay }]: Lambert,
// inverse-power falloff, no shadows. BAKE.value scales it in every baked material (0 = High: real lights instead).
export const BAKE = { value: 0 };
const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Color(), _nm = new THREE.Matrix3();
function irradiance(p, n, src, out) {
  out.setRGB(0, 0, 0);
  for (const L of src) {
    _d.subVectors(L.pos, p); const d = _d.length(), dot = Math.max(0, n.dot(_d) / d);
    if (dot) out.add(_c.copy(L.color).multiplyScalar(L.intensity * dot / Math.max(Math.pow(d, L.decay), 0.01)));
  }
  return out;
}
// per-vertex bake (meshes without a clean uv layout: altar, frame, candles): writes attribute `bakedLight`
export function bakeVertexLight(mesh, src) {
  let geo = mesh.geometry; if (!geo.attributes.normal) return false;
  if (geo.userData.bakedBy && geo.userData.bakedBy !== mesh) mesh.geometry = geo = geo.clone(); // shared geometry: own copy
  geo.userData.bakedBy = mesh;
  mesh.updateMatrixWorld(true); _nm.getNormalMatrix(mesh.matrixWorld);
  const P = geo.attributes.position, N = geo.attributes.normal, out = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) {
    _p.fromBufferAttribute(P, i).applyMatrix4(mesh.matrixWorld); _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
    irradiance(_p, _n, src, c); out[i * 3] = c.r; out[i * 3 + 1] = c.g; out[i * 3 + 2] = c.b;
  }
  geo.setAttribute('bakedLight', new THREE.BufferAttribute(out, 3));
  return true;
}
// material copy that adds the baked attribute to the indirect diffuse light (keeps any existing shader patch)
export function bakedMaterial(mat) {
  const m = mat.clone(), prev = mat.onBeforeCompile, key = mat.customProgramCacheKey();
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r); s.uniforms.uBake = BAKE;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 bakedLight;\nvarying vec3 vBaked;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBaked = bakedLight;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uBake;\nvarying vec3 vBaked;')
      .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\n#if defined( RE_IndirectDiffuse )\nirradiance += vBaked * uBake;\n#endif');
  };
  m.customProgramCacheKey = () => key + '|baked';
  return m;
}
// light-map bake for flat meshes with a clean uv (back wall, floor): toLocal(s, t, v3) maps texture coords → local point.
// Returns a half-float DataTexture (linear) to use as material.lightMap (repeat/offset = the uv → texture transform).
export function bakeLightMap(mesh, src, toLocal, W, H, repeat = [1, 1], offset = [0, 0]) {
  mesh.updateMatrixWorld(true); _nm.getNormalMatrix(mesh.matrixWorld);
  const n = new THREE.Vector3(0, 0, 1).applyMatrix3(_nm).normalize(), data = new Uint16Array(W * H * 4), c = new THREE.Color();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    toLocal((x + 0.5) / W, (y + 0.5) / H, _p); _p.applyMatrix4(mesh.matrixWorld); irradiance(_p, n, src, c);
    const k = (y * W + x) * 4; data[k] = THREE.DataUtils.toHalfFloat(c.r); data[k + 1] = THREE.DataUtils.toHalfFloat(c.g); data[k + 2] = THREE.DataUtils.toHalfFloat(c.b); data[k + 3] = THREE.DataUtils.toHalfFloat(1);
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.repeat.set(...repeat); t.offset.set(...offset); t.needsUpdate = true;
  return t;
}

export const BLOOM = { strength: 0.75, radius: 0.3, threshold: 8, cap: 1.5 };

export function createRoomRenderer({ renderer, scene, cam }) {
  let composer = null, bloomPass = null, bloomOn = true, w = 1, h = 1, fitted = false;
  // created once at 64 px (warm-up compiles its passes there); sized to the canvas only while bloom is on
  function ensure() {
    if (composer) return;
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }); // MSAA kept in the HDR pass
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, cam));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
    const hp = bloomPass.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace(/gl_FragColor\s*=\s*mix\(\s*outputColor,\s*texel,\s*alpha\s*\);/,
      `vec3 ex = texel.rgb * (max(v - luminosityThreshold, 0.0) / max(v, 1e-4)); ex /= 1.0 + luminance(ex) / ${BLOOM.cap.toFixed(2)}; gl_FragColor = vec4(ex, 1.0);`);
    hp.needsUpdate = true;
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    shrink();
  }
  function shrink() { composer.setPixelRatio(1); composer.setSize(64, 64); fitted = false; } // frees the full-size targets
  function fit() { if (fitted) return; composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); fitted = true; }
  let room = null; // the room's own environment (null until captured)
  return {
    get bloom() { return bloomOn; }, get bloomPass() { return bloomPass; },
    setBloom(on) { if (on === bloomOn) return; bloomOn = on; if (!on && composer) shrink(); },
    setSize(W, H) { w = W; h = H; renderer.setSize(W, H, false); fitted = false; },
    render() { if (bloomOn) { ensure(); fit(); composer.render(); } else renderer.render(scene, cam); },
    // warm-up: the HDR target the High path renders into (materials compile against it: no tone mapping, linear),
    // and one 64 px composer frame, which compiles the bloom + output passes
    hdrTarget() { ensure(); return composer.readBuffer; },
    warmPasses() { ensure(); if (fitted) return; composer.render(); },
    // render the room into a cube from `pos`, prefilter it (PMREM); same 128 px cube-uv size as makeEnv(), so swapping
    // between the two never changes a shader
    captureEnv(pos, hide = [], size = 128) {
      const was = hide.map(o => o.visible); hide.forEach(o => (o.visible = false));
      const cubeRT = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType });
      const cc = new THREE.CubeCamera(0.05, 30, cubeRT); cc.position.copy(pos); cc.updateMatrixWorld(true);
      cc.update(renderer, scene);
      const pm = new THREE.PMREMGenerator(renderer), env = pm.fromCubemap(cubeRT.texture).texture;
      pm.dispose(); cubeRT.dispose();
      hide.forEach((o, i) => (o.visible = was[i]));
      if (room) room.dispose();
      room = env; return env;
    },
    get roomEnv() { return room; },
    dispose() { if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer.passes.forEach(p => p.dispose && p.dispose()); composer = null; } if (room) room.dispose(); room = null; },
  };
}
