// Efectos de sonido del juego, sintetizados en vivo con Web Audio: no hay archivos de audio que descargar (este módulo es
// todo el sonido) y cada efecto suena en el cuadro exacto de su animación (se llaman desde las líneas de tiempo de GSAP).
// · El navegador solo deja sonar después de un toque, clic o tecla en la página. gate.js crea el audio dentro del clic de la
//   luna (adopt); en las demás páginas se enciende con el primer gesto. Un efecto pedido antes de eso (p. ej. el "pop" de un
//   objeto que aparece sin que se haya tocado la página) no suena: nunca se acumulan efectos atrasados.
// · Todo pasa por un compresor (nada satura aunque se encimen) y una reverberación corta que les da "cuarto".
//   play('collect', { n: 3 })  ·  adopt(audioContext)
// Efectos:
//   start      luna: la ventana del Cholo aparece (brillo que sube + campanas en arpegio)
//   collect    objeto recogido: campana de dos notas, más aguda con cada objeto ({ n: 1…5 })
//   pop        aparece un objeto flotante
//   chain      5/5: cada ranura del HUD se enciende ({ i: 0…4 }); también las 5 piezas del altar al acertar
//   heartbeat  5/5: los objetos laten ({ k: 0…2 }, cada latido más fuerte)
//   confirm    acierto: acorde de campanas con brillos ({ big: true } más grande)
//   thunder    altar en orden incorrecto
//   place      un objeto se apoya en el altar
//   rise       el cristal sube y tiembla (tensión, { dur })      ·  shatter  el cristal estalla
//   fragment   fragmento recogido en una página                    ·  arrive   un fragmento llega al puzzle ({ n: 0…4 })
//   whoosh     algo vuela ({ dur })                                ·  impact   el cristal entra en el cuadro
//   fuse       el cristal se vuelve a unir                         ·  sparkle  brillitos sueltos ({ n })
//   creak      puerta que rechina ({ dur, lo, hi }: el cuadro de la llave, la tapa de la caja)
//   lock       la llave entra y gira en la cerradura               ·  locked   la caja cerrada se sacude
//   key        tomar la llave                                      ·  reveal   pantalla final
const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null, bus = null, verb = null, white = null, brown = null, wokeAt = -1e9;

function noiseBuffer(c, sec, brownian) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * sec), c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brownian) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}
function impulse(c, sec, decay) { // reverberación: ruido estéreo que se apaga
  const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
function wire(c) {
  ctx = c;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.25;
  const master = c.createGain(); master.gain.value = 0.9;
  comp.connect(master); master.connect(c.destination);
  bus = c.createGain(); bus.gain.value = 0.7; bus.connect(comp);
  verb = c.createConvolver(); verb.buffer = impulse(c, 2.2, 3);
  const wet = c.createGain(); wet.gain.value = 0.4; verb.connect(wet); wet.connect(comp);
  white = noiseBuffer(c, 2, false); brown = noiseBuffer(c, 4, true);
}
function create() {
  if (!ctx && AC) {
    try { wire(new AC({ latencyHint: 'interactive' })); } catch (e) { try { wire(new AC()); } catch (e2) { return null; } }
  }
  return ctx;
}
// encender el audio: solo dentro de un gesto (clic, toque, tecla)
function wake() {
  if (!create() || ctx.state === 'running' || ctx.state === 'closed') return;
  wokeAt = performance.now(); ctx.resume().catch(() => {});
}
// gate.js: el contexto creado dentro del clic de la luna (Safari solo lo deja sonar si nace en un gesto)
export function adopt(c) { if (!ctx && c) wire(c); wake(); }
// el primer gesto de cada página enciende el audio
['pointerdown', 'keydown', 'touchend'].forEach((ev) => addEventListener(ev, wake, { capture: true, passive: true }));

// ───────────────────────────── piezas ─────────────────────────────
function voice({ pan = 0, wet = 0 } = {}) { // ganancia → (paneo) → bus, con envío a la reverberación
  const g = ctx.createGain(); g.gain.value = 0;
  let node = g;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
  node.connect(bus);
  if (wet) { const s = ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(verb); }
  return g;
}
function env(g, t, peak, attack, decay) { // ataque lineal, caída exponencial
  const p = g.gain;
  p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + attack); p.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return t + attack + decay;
}
function osc(type, f, t, end, dest) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(end + 0.05); return o; }
function noise(t, dur, dest, buf = white) {
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
  s.connect(dest); s.start(t, Math.random() * (buf.duration - 0.2)); s.stop(t + dur + 0.05);
  return s;
}
function filter(type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
const rnd = (a, b) => a + Math.random() * (b - a);

// campana: parciales inarmónicos de campana pequeña; los agudos se apagan antes
const BELL = [[1, 1], [2, 0.3], [2.76, 0.42], [4.07, 0.16], [5.43, 0.1], [0.5, 0.12]];
function bell(t, f, vol, dur, { pan = 0, wet = 0.55 } = {}) {
  BELL.forEach(([r, a], k) => {
    const fr = f * r; if (fr > 16000) return;
    const g = voice({ pan, wet });
    const end = env(g, t, vol * a, 0.002, dur / (1 + k * 0.7));
    osc('sine', fr, t, end, g);
    if (k === 0) { const g2 = voice({ pan: -pan, wet }); osc('sine', fr * 1.004, t, env(g2, t, vol * 0.35, 0.002, dur), g2); } // batido suave
  });
}
function sparkle(t, n, vol, spread, lo = 2800, hi = 7500) {
  for (let i = 0; i < n; i++) {
    const at = t + Math.pow(Math.random(), 1.4) * spread, g = voice({ pan: rnd(-0.75, 0.75), wet: 0.7 });
    osc('sine', rnd(lo, hi), at, env(g, at, vol * rnd(0.4, 1), 0.002, rnd(0.05, 0.16)), g);
  }
}
function swell(t, dur, vol, f0, f1, q = 1.2, { wet = 0.4, buf = white } = {}) { // ruido filtrado que barre f0 → f1
  const bp = filter('bandpass', f0, q), g = voice({ wet });
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  bp.connect(g); noise(t, dur, bp, buf);
}
function thump(t, f0, f1, vol, dur, wet = 0.15) { // golpe grave: seno que cae de tono
  const g = voice({ wet }), o = osc('sine', f0, t, env(g, t, vol, 0.004, dur), g);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
}
function tick(t, f, q, vol, dur, wet = 0.3, pan = 0) { // chasquido: ráfaga de ruido muy corta y filtrada
  const bp = filter('bandpass', f, q), g = voice({ wet, pan });
  env(g, t, vol, 0.001, dur); bp.connect(g); noise(t, dur + 0.01, bp);
}
function pad(t, freqs, vol, attack, decay) { // colchón cálido debajo de los acordes
  const lp = filter('lowpass', 1100, 0.5), g = voice({ wet: 0.6 });
  const end = env(g, t, vol, attack, decay); lp.connect(g);
  freqs.forEach((f) => { osc('triangle', f, t, end, lp); osc('triangle', f * 1.006, t, end, lp); });
}

// Puerta que rechina: fricción "pega y suelta" de la madera. Un tren de chasquidos cuya frecuencia (el tono del rechinido)
// sube y baja entre lo y hi Hz, a veces se atora, pasa por las resonancias de una puerta de madera.
function creak(t, dur, lo, hi, vol) {
  const sr = ctx.sampleRate, n = Math.floor(sr * dur), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
  const ph = Math.random() * 10;
  let x = 0;
  while (x < dur) {
    const u = x / dur;
    const arc = Math.sin(Math.PI * Math.min(1, u * 1.1)); // abre: sube y baja
    const wob = 0.5 + 0.5 * Math.sin(ph + u * 8.7) * Math.sin(ph * 0.6 + u * 21.3);
    const f = lo + (hi - lo) * (0.45 * arc + 0.55 * wob);
    const amp = Math.min(1, u * 14) * Math.min(1, (1 - u) * 5) * (0.5 + 0.5 * Math.random()) * (0.55 + 0.45 * arc);
    const i0 = Math.floor(x * sr);
    for (let k = 0; k < 150 && i0 + k < n; k++) d[i0 + k] += amp * Math.exp(-k / 24) * (Math.cos(k * 0.14) + (Math.random() * 2 - 1) * 0.2);
    x += (1 / f) * rnd(0.9, 1.1);
    if (Math.random() < 0.006) x += rnd(0.015, 0.05); // se atora un instante
  }
  const src = ctx.createBufferSource(); src.buffer = b;
  const hp = filter('highpass', 180, 0.7), lp = filter('lowpass', 3600, 0.7), g = voice({ wet: 0.35 });
  src.connect(hp);
  [[480, 5, 1], [980, 7, 0.85], [1700, 8, 0.55], [2600, 6, 0.22]].forEach(([f, q, a]) => { const bp = filter('bandpass', f, q), ga = ctx.createGain(); ga.gain.value = a * 3; hp.connect(bp); bp.connect(ga); ga.connect(lp); });
  lp.connect(g);
  g.gain.setValueAtTime(vol * 1.15, t);
  src.start(t); src.stop(t + dur + 0.05);
}

// ───────────────────────────── efectos ─────────────────────────────
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]; // escala pentatónica: suena bien en cualquier orden
const SFX = {
  start(t) {
    swell(t, 0.75, 0.22, 500, 7500, 1.1);
    thump(t, 130, 62, 0.3, 0.55, 0.3);
    [784, 1047, 1319, 1568, 2093].forEach((f, i) => bell(t + 0.08 + i * 0.075, f, 0.2 - i * 0.015, 1.8, { pan: -0.4 + i * 0.2 }));
    sparkle(t + 0.3, 16, 0.06, 1.0);
  },
  collect(t, { n = 1 } = {}) {
    const root = 1047 * PENTA[Math.max(0, Math.min(5, n - 1))];
    bell(t, root, 0.26, 1.5);
    bell(t + 0.075, root * 1.5, 0.24, 1.9);
    sparkle(t + 0.05, 12, 0.055, 0.6);
  },
  pop(t) {
    const g = voice({ wet: 0.25 }), o = osc('sine', 1500, t, env(g, t, 1.0, 0.002, 0.1), g);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.06);
    tick(t, 2600, 1.5, 0.35, 0.012);
    bell(t + 0.03, 2637, 0.16, 0.5, { wet: 0.5 });
    sparkle(t + 0.04, 4, 0.08, 0.2);
  },
  chain(t, { i = 0 } = {}) {
    bell(t, 1319 * PENTA[Math.max(0, Math.min(5, i))], 0.2, 0.9, { pan: -0.5 + i * 0.25 });
    sparkle(t, 3, 0.06, 0.12);
  },
  heartbeat(t, { k = 0 } = {}) {
    const v = 0.55 + k * 0.18;
    thump(t, 78, 42, v, 0.24, 0.1);
    const lp = filter('lowpass', 170, 0.7), g = voice(); env(g, t, v * 0.5, 0.003, 0.05); lp.connect(g); noise(t, 0.08, lp);
    thump(t + 0.12, 92, 50, v * 0.72, 0.2, 0.1);
    if (k === 2) swell(t, 0.35, 0.08, 300, 2400, 1); // el último sube hacia el destello
  },
  confirm(t, { big = false } = {}) {
    const chord = big ? [523, 659, 784, 1047, 1319] : [784, 988, 1175, 1568];
    chord.forEach((f, i) => bell(t + i * 0.045, f, (big ? 0.15 : 0.13) - i * 0.01, big ? 2.6 : 1.9, { pan: -0.35 + i * 0.17, wet: 0.7 }));
    swell(t, 0.9, big ? 0.13 : 0.09, 1500, 9500, 1.2);
    sparkle(t + 0.12, big ? 22 : 14, 0.05, big ? 1.4 : 0.9);
    pad(t, big ? [131, 196, 262] : [196, 294], big ? 0.14 : 0.09, 0.06, big ? 2.2 : 1.4);
    if (big) thump(t, 110, 55, 0.35, 0.6, 0.3);
  },
  thunder(t) {
    // chasquido del rayo (dos), retumbo grave que va y viene, y el bajo de la tormenta
    const crack = (at, v) => { const hp = filter('highpass', 900, 0.7), g = voice({ wet: 0.5 }); env(g, at, v, 0.002, 0.4); hp.connect(g); noise(at, 0.45, hp); };
    crack(t, 0.5); crack(t + 0.08, 0.32);
    const lp = filter('lowpass', 260, 0.6), g = voice({ wet: 0.55 }), N = 96, curve = new Float32Array(N);
    for (let i = 0; i < N; i++) { const u = i / (N - 1); curve[i] = Math.min(1, i / 4) * Math.pow(1 - u, 1.5) * (0.55 + 0.45 * Math.abs(Math.sin(u * 17 + Math.random()))) * 1.1; }
    curve[N - 1] = 0;
    g.gain.setValueAtTime(0, t + 0.04); g.gain.setValueCurveAtTime(curve, t + 0.05, 2.9);
    lp.connect(g); noise(t + 0.04, 3.0, lp, brown);
    const sub = voice({ wet: 0.2 }), o = osc('sine', 52, t, env(sub, t + 0.03, 0.5, 0.06, 2.3), sub);
    o.frequency.exponentialRampToValueAtTime(33, t + 2.0);
  },
  place(t) {
    tick(t, 900, 2, 0.5, 0.05, 0.25);
    thump(t, 240, 150, 0.55, 0.12, 0.2);
  },
  rise(t, { dur = 2.3 } = {}) {
    swell(t, dur, 0.12, 300, 5000, 3, { wet: 0.5 });
    const g = voice({ wet: 0.5 }), o = osc('sine', 220, t, t + dur, g);
    o.frequency.exponentialRampToValueAtTime(880, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const depth = ctx.createGain(); depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(30, t + dur); // temblor: vibrato que crece
    osc('sine', 7, t, t + dur, depth); depth.connect(o.frequency);
    sparkle(t + dur * 0.4, 10, 0.035, dur * 0.6, 3000, 8000);
  },
  shatter(t) {
    const hp = filter('highpass', 2400, 0.7), g = voice({ wet: 0.6 }); env(g, t, 0.7, 0.002, 0.6); hp.connect(g); noise(t, 0.65, hp);
    for (let i = 0; i < 18; i++) {
      const at = t + Math.pow(Math.random(), 1.6) * 0.35, gg = voice({ pan: rnd(-0.9, 0.9), wet: 0.6 });
      osc('sine', rnd(2800, 9500), at, env(gg, at, rnd(0.1, 0.24), 0.001, rnd(0.05, 0.4)), gg);
    }
    thump(t, 95, 38, 0.8, 0.45, 0.3);
    sparkle(t + 0.2, 14, 0.04, 1.0);
  },
  fragment(t) {
    bell(t, 2349, 0.29, 1.3, { pan: -0.15 });
    bell(t + 0.06, 3136, 0.21, 1.1, { pan: 0.15 });
    sparkle(t, 12, 0.08, 0.5);
  },
  arrive(t, { n = 0 } = {}) {
    bell(t, 1568 * PENTA[Math.max(0, Math.min(5, n))], 0.2, 1.2, { pan: rnd(-0.5, 0.5) });
    sparkle(t, 5, 0.055, 0.25);
  },
  whoosh(t, { dur = 0.6, vol = 0.1 } = {}) { swell(t, dur, vol, 350, 2600, 0.9, { wet: 0.3 }); },
  impact(t) {
    thump(t, 120, 45, 0.5, 0.5, 0.35);
    swell(t, 0.7, 0.12, 2000, 8000, 1.2);
    bell(t, 392, 0.12, 2.2, { wet: 0.7 });
    sparkle(t + 0.05, 10, 0.045, 0.6);
  },
  fuse(t) {
    swell(t, 0.4, 0.1, 800, 6000, 1.5);
    [1047, 1568, 2093].forEach((f, i) => bell(t + i * 0.03, f, 0.12, 2.2, { pan: -0.3 + i * 0.3, wet: 0.7 }));
    thump(t, 100, 50, 0.3, 0.4, 0.3);
    sparkle(t + 0.05, 12, 0.045, 0.8);
  },
  sparkle(t, { n = 8 } = {}) { sparkle(t, n, 0.12, 0.5); },
  creak(t, { dur = 1.6, lo = 70, hi = 240, vol = 0.5 } = {}) { creak(t, dur, lo, hi, vol); },
  lock(t) { // la llave entra (clic) y gira (clac metálico)
    tick(t, 4200, 4, 0.4, 0.025, 0.2);
    bell(t, 3520, 0.07, 0.15, { wet: 0.2 });
    tick(t + 0.42, 2500, 3, 0.58, 0.04, 0.25);
    tick(t + 0.45, 1400, 2, 0.36, 0.05, 0.25);
    thump(t + 0.42, 220, 120, 0.32, 0.12, 0.2);
  },
  locked(t) { // sacudida de la caja cerrada: madera y herraje que golpetean
    for (let i = 0; i < 7; i++) { const at = t + i * 0.05 + rnd(0, 0.01); tick(at, rnd(220, 320), 3, rnd(0.55, 0.9), 0.04, 0.15, i % 2 ? 0.2 : -0.2); if (i % 2) tick(at + 0.01, 2800, 6, 0.18, 0.02, 0.15); }
    thump(t, 160, 90, 0.6, 0.15, 0.15);
  },
  key(t) {
    [1568, 2093, 2637].forEach((f, i) => bell(t + i * 0.06, f, 0.17, 1.6, { pan: -0.3 + i * 0.3 }));
    for (let i = 0; i < 5; i++) tick(t + 0.02 + i * 0.045, rnd(4200, 6500), 8, 0.05, 0.03, 0.4, rnd(-0.5, 0.5)); // tintineo metálico
    sparkle(t + 0.05, 14, 0.05, 0.7);
  },
  reveal(t) { SFX.confirm(t, { big: true }); },
};

// Dispara un efecto ahora. Sin audio encendido (sin gesto en la página) no hace nada, salvo que el navegador ya lo permita;
// justo después de pedir el encendido (dentro del mismo gesto) sí lo programa: suena en cuanto el navegador lo enciende.
export function play(name, opts) {
  const fx = SFX[name];
  if (!fx || !create()) return;
  if (ctx.state !== 'running' && performance.now() - wokeAt > 1000) return;
  try { fx(ctx.currentTime + 0.01, opts); } catch (e) { /* un efecto nunca rompe el juego */ }
}
