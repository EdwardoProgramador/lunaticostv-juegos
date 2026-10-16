// Altar with order (level 2): place the 5 objects from the tray on the 5 altar places.
// Desktop: drag. Mobile: tap an object, then tap a place (drag works too). Objects can be moved until all 5 are down.
// All 5 placed → wrong: tremble + cold candle + back to the tray · right: places light up one by one, candle flares, onSolved(tl).
//   const order = createAltarOrder({ room, page, tray, clue, onSolved });  order.enable(true)
import { ALTAR_ORDER, TEXT } from './level2-text.js';
import { HUD_ITEMS } from './hud.js';
import { sparks, flyIcon } from './room-page.js';

const icon = k => `assets/hud/${k}.png`;

export function createAltarOrder({ room, page, tray, clue, onSolved, base = 'assets/hud/' }) {
  const ui = page.ui, THREE = room.THREE;
  const zones = room.places.map((p, i) => {
    const b = document.createElement('button'); b.className = 'room-zone'; b.type = 'button';
    b.setAttribute('aria-label', `${TEXT.placeLabel} ${i + 1}`); b.style.display = 'none'; ui.appendChild(b);
    return b;
  });
  const tops = room.places.map(p => p.pos.clone().add(new THREE.Vector3(0, 0.07, 0)));
  const scr = room.places.map(() => ({ x: -999, y: -999 }));
  let enabled = false, busy = false, sel = null, drag = null, ghost = null, done = false;
  // the notebook's clue page: torn out on the first read, then kept in the tray as its own item
  if (clue) {
    clue.bind({ target: () => tray.slots.page && tray.center('page'), onTorn: () => tray.showPage(true, false), onStashed: () => { tray.set('page', true); tray.flash('page'); } });
    clue.ready.then(() => tray.setPageIcon(clue.icon));
  }
  const readNotebook = () => { clearSel(); clue.open({ tear: true }); };

  room.onTick(() => {
    if (!enabled) return;
    tops.forEach((v, i) => { const s = room.toScreen(v); scr[i] = s; zones[i].style.transform = `translate(${s.x}px,${s.y}px)`; });
  });
  const local = e => { const r = ui.getBoundingClientRect(), z = r.width / ui.offsetWidth || 1; return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z }; };
  const zoneAt = p => {
    const R = page.isMobile() ? 40 : 56; let best = -1, bd = R;
    scr.forEach((s, i) => { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) return best;
    const tr = tray.el.getBoundingClientRect(), u = ui.getBoundingClientRect(), z = u.width / ui.offsetWidth || 1;
    const tx = (tr.left - u.left) / z, ty = (tr.top - u.top) / z;
    return p.x > tx && p.x < tx + tr.width / z && p.y > ty && p.y < ty + tr.height / z ? 'tray' : null;
  };
  const mark = (target, selIdx = -1) => zones.forEach((z, i) => { z.classList.toggle('is-target', target === 'all' ? !room.places[i].key || true : target === i); z.classList.toggle('is-sel', selIdx === i); });
  const clearSel = () => { sel = null; tray.select(null); mark(null); };

  function put(key, i, from) {
    const occ = room.places[i].key;
    if (occ && occ !== key) { if (typeof from === 'number' && from >= 0) room.putObject(occ, from); else toTray(occ, i); }
    room.putObject(key, i); tray.set(key, false);
    sparks(ui, scr[i].x, scr[i].y, 12, 50);
    check();
  }
  function toTray(key, fromPlace = room.objects[key].place, animate = true) {
    const s = fromPlace >= 0 ? scr[fromPlace] : null;
    room.putObject(key, -1);
    if (animate && s) flyIcon(ui, icon(key), s, tray.center(key), { dur: 0.6, onComplete: () => { tray.set(key, true); tray.flash(key); } });
    else tray.set(key, true);
  }
  function check() {
    if (room.places.some(p => !p.key)) return;
    busy = true; clearSel();
    const ok = room.places.every((p, i) => p.key === ALTAR_ORDER[i]);
    gsap.delayedCall(0.55, ok ? correct : wrong);
  }
  function wrong() {
    const tl = gsap.timeline();
    room.places.forEach(p => {
      const h = room.objects[p.key].holder, x0 = h.position.x;
      tl.to(h.position, { x: () => x0 + gsap.utils.random(-0.008, 0.008), duration: 0.045, repeat: 13, yoyo: true, ease: 'none', repeatRefresh: true }, 0).set(h.position, { x: x0 }, 0.66);
      tl.to(h.rotation, { z: 0.06, duration: 0.05, repeat: 11, yoyo: true, ease: 'none' }, 0).set(h.rotation, { z: 0 }, 0.66);
    });
    room.coldFlicker(tl, 0.05);
    tl.call(() => page.hint(TEXT.hintWrong), null, 0.1);
    room.places.forEach((p, i) => {
      const key = p.key, h = room.objects[key].holder, at = 0.95 + i * 0.12;
      tl.to(h.position, { y: '+=0.22', duration: 0.6, ease: 'power2.in' }, at)
        .to(h.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power2.in' }, at + 0.1)
        .call(() => { const s = { ...scr[i] }; room.putObject(key, -1); flyIcon(ui, icon(key), { x: s.x, y: s.y - 30 }, tray.center(key), { dur: 0.55, onComplete: () => { tray.set(key, true); tray.flash(key); } }); }, null, at + 0.55);
    });
    tl.call(() => { busy = false; page.hint(page.isMobile() ? TEXT.hintPlaceTap : TEXT.hintPlace); }, null, 2.3);
  }
  function correct() {
    done = true; enable(false);
    const tl = gsap.timeline();
    room.places.forEach((p, i) => room.lightPlace(i, tl, 0.1 + i * 0.32));
    room.flare(tl, 1.75);
    tl.call(() => page.hint(''), null, 0.1);
    if (onSolved) tl.call(() => onSolved(), null, 2.3);
  }

  // ---------- input ----------
  function startGhost(key, p) {
    ghost = document.createElement('img'); ghost.className = 'room-ghost'; ghost.src = icon(key); ghost.alt = ''; ui.appendChild(ghost);
    moveGhost(p); gsap.fromTo(ghost, { scale: 0.7 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
  }
  const moveGhost = p => { ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px'; };
  function down(e, key, from) {
    if (!enabled || busy) return;
    e.preventDefault();
    drag = { key, from, p0: local(e), moved: false };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
  }
  function move(e) {
    if (!drag) return;
    const p = local(e);
    if (!drag.moved && Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) > 7) {
      drag.moved = true; clearSel();
      if (drag.from >= 0) room.putObject(drag.key, -1); else tray.set(drag.key, false);
      startGhost(drag.key, p);
    }
    if (drag.moved) { moveGhost(p); const z = zoneAt(p); mark(typeof z === 'number' ? z : null); }
  }
  function finish() { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); if (ghost) { ghost.remove(); ghost = null; } mark(sel && sel.from === 'tray' ? 'all' : null); }
  function cancel() { if (drag && drag.moved) { drag.from >= 0 ? room.putObject(drag.key, drag.from, { animate: false }) : tray.set(drag.key, true); } drag = null; finish(); }
  function up(e) {
    const d = drag; drag = null; if (!d) return finish();
    if (!d.moved) { finish(); return tap(d); }
    const z = zoneAt(local(e)); finish();
    if (typeof z === 'number') put(d.key, z, d.from);
    else if (z === 'tray' || d.from === 'tray') { if (d.from >= 0) toTray(d.key, d.from, false); else tray.set(d.key, true); }
    else room.putObject(d.key, d.from);
  }
  function tap(d) {
    if (d.from === 'tray') {
      if (d.key === 'notebook' && clue && !clue.torn) return readNotebook();
      if (sel && sel.key === d.key) return clearSel();
      sel = { key: d.key, from: 'tray' }; tray.select(d.key); mark('all');
      page.hint(TEXT.hintPlaceTap);
      return;
    }
    const i = d.from, occ = room.places[i].key;
    if (occ === 'notebook' && clue && !clue.torn && !sel) return readNotebook();
    if (sel && sel.key !== occ) { const s = sel; clearSel(); return put(s.key, i, s.from); }
    if (sel && sel.key === occ) return clearSel();
    if (occ) { sel = { key: occ, from: i }; tray.select(null); mark('all', i); }
  }
  Object.entries(tray.slots).forEach(([key, s]) => s.addEventListener('pointerdown', e => {
    if (!enabled || busy || !HUD_ITEMS.some(h => h.key === key)) return;
    if (tray.has(key)) return down(e, key, 'tray');
    e.preventDefault();
    if (room.objects[key].place >= 0) { clearSel(); toTray(key); }   // tap a silhouette → that object comes back
  }));
  zones.forEach((z, i) => z.addEventListener('pointerdown', e => { const k = room.places[i].key; if (k) down(e, k, i); else if (enabled && !busy) { e.preventDefault(); tap({ from: i }); } }));

  function enable(v) { enabled = v; zones.forEach(z => (z.style.display = v ? '' : 'none')); if (!v) clearSel(); }
  return {
    enable,
    readNotebook() { if (clue) readNotebook(); },
    reset() { busy = false; done = false; clearSel(); room.clearObjects(); room.resetLights(); tray.setAll(HUD_ITEMS.map(h => h.key)); if (clue) { clue.reset(); tray.showPage(false); } },
    // demo: put everything down at once (order = list of keys by place)
    fill(order = ALTAR_ORDER, { lit = false } = {}) { room.clearObjects(); order.forEach((k, i) => room.putObject(k, i, { animate: false })); tray.setAll([]); if (lit) room.places.forEach(p => { p.ring.material.emissiveIntensity = 1.6; p.glow.material.opacity = 0.25; p.eng.material.emissiveIntensity = 1.9; }); },
    get solved() { return done; },
  };
}
