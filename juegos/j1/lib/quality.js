// Calidad inicial del dispositivo (separada del render del cuarto para que el objeto flotante y la caja la usen
// sin cargar el post-proceso del cuarto).
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const { forcedQuality } = await import(`./debug.js${V}`);
// ---------- adaptive quality ----------
// detectQuality(renderer) → the starting level: 'high' | 'low' | 'minimal'. URL ?calidad=alta|baja|minima forces it (only with config.js → debug: true).
// Software GPUs, max texture < 4096, or phones with < 4 cores / < 3 GB → minimal; every other phone/tablet → low (the room's
// frame-rate watch steps it up when the device can take it); desktops with < 4 cores, < 4 GB or max texture < 8192 → low; else high.
export function detectQuality(renderer) {
  const forced = forcedQuality(); if (forced) return forced;
  const gl = renderer.getContext(); let gpu = '';
  // RENDERER primero: Firefox ya da ahí el nombre real (y avisa en consola si se pide la extensión); Chrome/Safari dan uno
  // genérico, y solo entonces se pide WEBGL_debug_renderer_info
  try { gpu = String(gl.getParameter(gl.RENDERER)); if (/^webkit webgl$|^mozilla$/i.test(gpu.trim())) { const ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)); } } catch (e) { /* oculto */ }
  const coarse = matchMedia('(pointer: coarse)').matches, cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || (coarse ? 3 : 8);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpu) || maxTex < 4096) return 'minimal';
  if (coarse) return cores < 4 || (navigator.deviceMemory && navigator.deviceMemory < 3) ? 'minimal' : 'low';
  if (cores < 4 || mem < 4 || maxTex < 8192) return 'low';
  return 'high';
}

// Pixel ratio máximo por nivel (el mismo tope que usa el cuarto).
export const PIXEL_RATIO = { high: 2, low: 1.25, minimal: 1 };
