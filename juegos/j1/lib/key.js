// The ornate gothic key (level 2): dark iron + worn copper, crescent moon on the bow. 1 unit long, bow up (+y), bit at y≈0.
//   const key = buildKey();  (el icono de la bandeja es un WebP pre-renderizado: assets/hud/key.webp)
import * as THREE from '../vendor/three.module.min.js';
import { crescentGeo, mergeGeos, glowSprite } from './objects.js';
import { surfaces } from './surfaces.js';

const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

export function buildKey() {
  const m = surfaces(); // aged iron + aged copper
  const g = new THREE.Group(); g.name = 'llave';
  const iron = [], cop = [];
  // bow: ring with three gothic lobes, a crescent moon inside
  iron.push([new THREE.TorusGeometry(0.15, 0.024, 12, 64), M4(0, 0.78, 0)]);
  for (const a of [0, Math.PI / 2, Math.PI]) iron.push([new THREE.TorusGeometry(0.05, 0.016, 10, 32), M4(Math.cos(a) * 0.19, 0.78 + Math.sin(a) * 0.19, 0)]);
  for (const a of [Math.PI / 4, Math.PI * 3 / 4]) iron.push([new THREE.OctahedronGeometry(1, 0), M4(Math.cos(a) * 0.2, 0.78 + Math.sin(a) * 0.2, 0, 0, 0, a - Math.PI / 2, 0.016, 0.05, 0.014)]);
  cop.push([crescentGeo(0.1, 0.03), M4(-0.01, 0.78, 0, 0, 0, 0.35)]);
  cop.push([new THREE.OctahedronGeometry(1, 0), M4(0.06, 0.82, 0, 0, 0, 0, 0.012, 0.04, 0.012)], [new THREE.OctahedronGeometry(1, 0), M4(0.06, 0.82, 0, 0, 0, 0, 0.035, 0.012, 0.012)]);
  cop.push([new THREE.TorusGeometry(0.128, 0.007, 8, 64), M4(0, 0.78, 0.012)]);
  // collar + shaft
  iron.push([new THREE.CylinderGeometry(0.04, 0.03, 0.06, 20), M4(0, 0.6, 0)], [new THREE.SphereGeometry(0.045, 20, 14), M4(0, 0.56, 0, 0, 0, 0, 1, 0.6, 1)]);
  cop.push([new THREE.TorusGeometry(0.042, 0.009, 8, 28), M4(0, 0.535, 0, Math.PI / 2)], [new THREE.TorusGeometry(0.034, 0.008, 8, 28), M4(0, 0.43, 0, Math.PI / 2)], [new THREE.TorusGeometry(0.034, 0.008, 8, 28), M4(0, 0.2, 0, Math.PI / 2)]);
  iron.push([new THREE.CylinderGeometry(0.026, 0.028, 0.54, 20), M4(0, 0.27, 0)]);
  // bit with wards
  iron.push([new THREE.BoxGeometry(0.06, 0.17, 0.026), M4(0.05, 0.095, 0)], [new THREE.BoxGeometry(0.05, 0.11, 0.026), M4(0.1, 0.065, 0)], [new THREE.BoxGeometry(0.035, 0.05, 0.026), M4(0.14, 0.04, 0)], [new THREE.BoxGeometry(0.02, 0.17, 0.03), M4(0.165, 0.095, 0)]);
  iron.push([new THREE.SphereGeometry(0.03, 16, 10), M4(0, 0.0, 0)]);
  g.add(Object.assign(new THREE.Mesh(mergeGeos(iron), m.iron), { name: 'llave_hierro' }));
  g.add(Object.assign(new THREE.Mesh(mergeGeos(cop), m.copper), { name: 'llave_cobre' }));
  const fx = new THREE.Group(); fx.name = '__fx';
  const halo = glowSprite(0xffa060, 0.9, 0.35); halo.position.y = 0.6; fx.add(halo);
  g.add(fx);
  g.userData.halo = halo;
  return g;
}
