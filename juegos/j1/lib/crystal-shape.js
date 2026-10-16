// Crystal shard outline + cracks (port sin cambios), traced from the reference (assets/tex/crystal-face.webp, 1092×1092 px; 512 px copy in assets/tex/512/).
// Pure data + 2D polygon helpers (no three.js) — used by crystal.js (3D), fragment-hud.js (SVG), shadow-puzzle.js.
export const IMG = { w: 1092, h: 1092, cx: 567, cy: 540, height: 1050 };

export const OUTLINE = [[626,16],[648,52],[649,70],[666,106],[704,154],[710,214],[734,262],[770,286],[787,316],[817,340],[823,376],[833,400],[866,428],[868,436],[847,514],[837,526],[830,544],[840,574],[796,646],[782,688],[760,718],[755,736],[727,760],[721,796],[703,832],[688,850],[654,904],[615,982],[608,1018],[612,1058],[608,1062],[558,976],[564,964],[557,946],[543,928],[523,916],[500,868],[473,844],[445,832],[442,808],[416,742],[391,706],[351,670],[351,646],[336,604],[283,532],[284,490],[266,466],[279,448],[282,436],[274,388],[305,370],[350,322],[363,298],[381,292],[386,274],[419,268],[432,238],[439,202],[511,148],[540,106],[561,94],[569,70],[583,64]];

// The long central crack, then the smaller ones (each runs edge → edge or edge → main crack).
export const CRACKS = {
  main: [[641,38],[656,96],[668,150],[655,200],[645,250],[635,300],[630,350],[632,388],[620,450],[605,500],[590,550],[575,600],[560,640],[540,700],[520,750],[495,790],[462,822],[444,832]],
  left: [[352,660],[410,642],[485,627],[530,620],[571,610]],
  rightUpper: [[631,382],[720,400],[800,420],[866,432]],
  rightLower: [[551,672],[620,688],[700,702],[766,712]],
};

// Decorative relief on the copper frame (image px): crescents and 4-point stars.
export const ORNAMENTS = [
  { type: 'moon', x: 462, y: 218, r: 30, rot: 0.15 },
  { type: 'moon', x: 344, y: 414, r: 27, rot: 0.05 },
  { type: 'star', x: 318, y: 458, r: 34 },
  { type: 'star', x: 522, y: 846, r: 30 },
];

// ---------- 2D helpers ----------
export const area = P => { let a = 0; for (let i = 0; i < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
export function centroid(P) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < P.length; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
  if (Math.abs(a) < 1e-9) return [P[0][0], P[0][1]];
  return [cx / (3 * a), cy / (3 * a)];
}
function nearestEdge(P, q) {
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L)), p = [a[0] + dx * t, a[1] + dy * t];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (!best || d < best.d) best = { i, t, p, d, outer: !!(a.outer && b.outer) };
  }
  return best;
}
const tag = (p, outer) => { const q = [p[0], p[1]]; q.outer = outer; return q; };
// Split polygon P by polyline C whose two ends touch P's boundary. Vertices keep an `outer` flag
// (true = on the shard's original outline) so the copper frame only follows real outer edges.
export function splitPoly(P, C) {
  let a = nearestEdge(P, C[0]), b = nearestEdge(P, C[C.length - 1]), mid = C.slice(1, -1).map(p => tag(p, false));
  if (a.i > b.i || (a.i === b.i && a.t > b.t)) { [a, b] = [b, a]; mid = mid.reverse(); }
  const pa = tag(a.p, a.outer), pb = tag(b.p, b.outer), n = P.length;
  const r1 = [pa]; for (let k = a.i + 1; k <= b.i; k++) r1.push(P[k]); r1.push(pb); r1.push(...mid.slice().reverse());
  const r2 = [pb]; for (let k = b.i + 1; k < n; k++) r2.push(P[k]); for (let k = 0; k <= a.i; k++) r2.push(P[k]); r2.push(pa); r2.push(...mid);
  return [r1, r2];
}
// Sutherland–Hodgman: concave subject clipped by a convex clip polygon.
export function clipConvex(subject, clip) {
  let out = subject.slice();
  const s = Math.sign(area(clip)) || 1;
  for (let i = 0; i < clip.length && out.length; i++) {
    const A = clip[i], B = clip[(i + 1) % clip.length];
    const inside = p => s * ((B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0])) >= 0;
    const cut = (p, q) => { const x1 = p[0], y1 = p[1], x2 = q[0], y2 = q[1], x3 = A[0], y3 = A[1], x4 = B[0], y4 = B[1], den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den; return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; };
    const inp = out; out = [];
    for (let k = 0; k < inp.length; k++) {
      const p = inp[k], q = inp[(k + 1) % inp.length], ip = inside(p), iq = inside(q);
      if (ip) out.push(p);
      if (ip !== iq) out.push(cut(p, q));
    }
  }
  return out;
}

// The 5 fragments, numbered as the HUD and the website will use them:
// 1 tip (top right) · 2 upper left (left crescent) · 3 middle right · 4 lower left (star) · 5 lower right (water)
function build() {
  const O = OUTLINE.map(p => tag(p, true));
  const cx = P => centroid(P)[0], cy = P => centroid(P)[1];
  let [p, q] = splitPoly(O, CRACKS.main); const [Lh, Rh] = cx(p) < cx(q) ? [p, q] : [q, p];
  [p, q] = splitPoly(Lh, CRACKS.left); const [LT, LB] = cy(p) < cy(q) ? [p, q] : [q, p];
  [p, q] = splitPoly(Rh, CRACKS.rightUpper); const [RT, Rr] = cy(p) < cy(q) ? [p, q] : [q, p];
  [p, q] = splitPoly(Rr, CRACKS.rightLower); const [RM, RB] = cy(p) < cy(q) ? [p, q] : [q, p];
  return [RT, LT, RM, LB, RB].map(P => (area(P) > 0 ? P : P.slice().reverse()));
}
export const FRAGMENTS = build();
export const svgPath = P => 'M' + P.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
