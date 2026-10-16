// El Cuarto del Cholo en el sitio: overlay a pantalla completa (la X y Esc lo cierran) con el cuarto 3D y sus estados.
// La parte de página de "10 El Cuarto del Cholo" + 09/11/12/14/16B/17 del Design, sin la cabecera de demo ni el sitio falso.
// El estado sale de progress.js:
//   objects   → altar vacío, "Reúne los objetos del Cholo"
//   altar     → bandeja con los 5 objetos (y la hoja arrancada si ya se leyó), colocar en orden
//               acierto → el cristal sube, estalla, los fragmentos salen de pantalla, "Encuentra los fragmentos"
//   fragments → altar encendido, el vacío brilla frente al cuadro, "Encuentra los fragmentos"
//   puzzle    → puzzle de sombras (lunas gemelas) → el cristal se funde, entra al cuadro, el cuadro se abre, aparece la llave
//   key       → cuadro abierto con la llave, "Toma la llave"
//   box       → nicho vacío, la llave en la bandeja, "Ve a la caja en Inicio"
// Crear la UI ya crea el cuarto y lo prepara en segundo plano (room.ready): main.js la crea antes de que haga falta.
import * as THREE from './vendor/three-0.184.0/three.module.min.js';
import { gsap } from './vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [progress, { t, bindText }, { createRoom, prefetchRoom, PAINT, WALL_Z }, { createTray }, { createAltarOrder }, { createClue }, { createCrystal }, { createShadowPuzzle }, { playRiseShatter, crystalFX }, { buildKey }, { ALTAR_ORDER }, { sparks, flyIcon }, { asset }] = await Promise.all([
  import(`./progress.js${V}`),
  import(`./i18n.js${V}`),
  import(`./lib/room.js${V}`),
  import(`./lib/tray.js${V}`),
  import(`./lib/altar-order.js${V}`),
  import(`./lib/notebook-clue.js${V}`),
  import(`./lib/crystal.js${V}`),
  import(`./lib/shadow-puzzle.js${V}`),
  import(`./lib/crystal-fx.js${V}`),
  import(`./lib/key.js${V}`),
  import(`./lib/level2-data.js${V}`),
  import(`./lib/dom.js${V}`),
  import(`./lib/paths.js${V}`),
]);

export const prefetch = () => prefetchRoom();
const KEY_ICON = asset('hud/key.webp');

export function createRoomUI({ reduced = false, onProgress, onOpen, onClose } = {}) {
  // ── DOM ──
  const root = document.createElement('div');
  root.className = 'lj1-room is-closed';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'lj1-room-title');
  root.innerHTML = `<canvas class="lj1-room-gl"></canvas>
    <div class="lj1-room-ui">
      <h1 class="lj1-title lj1-room-title" id="lj1-room-title" data-text=""></h1>
      <button type="button" class="lj1-room-x"></button>
      <p class="lj1-room-hint" role="status" aria-live="polite"></p>
      <div class="lj1-room-big"><h2 class="lj1-title" data-text=""></h2></div>
    </div>`;
  document.body.appendChild(root);
  const canvas = root.querySelector('.lj1-room-gl'), ui = root.querySelector('.lj1-room-ui'), xBtn = root.querySelector('.lj1-room-x');
  const hintEl = root.querySelector('.lj1-room-hint'), bigEl = root.querySelector('.lj1-room-big h2');
  bindText(root.querySelector('.lj1-room-title'), 'roomTitle');
  bindText(xBtn, 'close', 'aria-label');
  root.__lj1Keep = true;

  // ── la "página" que esperan las librerías del Design (room-page.js) ──
  let hintKey = '', hintTw = null, bigKey = '';
  const P = {
    ui, canvas, roomEl: root,
    isMobile: () => root.clientWidth <= 640,
    hint(key, { delay = 0 } = {}) {
      hintKey = key || '';
      if (hintTw) hintTw.kill();
      if (!key) { hintTw = gsap.to(hintEl, { opacity: 0, duration: 0.3 }); return; }
      hintTw = gsap.timeline({ delay })
        .to(hintEl, { opacity: 0, duration: hintEl.textContent && +getComputedStyle(hintEl).opacity > 0 ? 0.25 : 0 })
        .call(() => { hintEl.textContent = t()[key]; })
        .fromTo(hintEl, reduced ? { opacity: 0 } : { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    },
    setHintBottom(px) { ui.style.setProperty('--lj1-hint-b', px + 'px'); },
    big(key, tl, at = 0) {
      bigKey = key; bigEl.textContent = t()[key]; bigEl.dataset.text = t()[key];
      return tl.fromTo(bigEl, reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }, at);
    },
    hideBig() { bigKey = ''; gsap.killTweensOf(bigEl); gsap.set(bigEl, { opacity: 0 }); },
  };

  // ── el cuarto y sus piezas ──
  const room = createRoom({ stage: root, canvas, reduced });
  const crystal = createCrystal(); crystal.group.visible = false;
  let clue = null, seq = null;
  const tray = createTray({ mount: ui, onRead: () => clue.open() });
  const keyTray = createTray({ mount: ui, items: [{ key: 'key', nameKey: 'keyName', src: KEY_ICON, sil: KEY_ICON }], labelKey: 'inventoryLabel' });
  tray.hide(true); keyTray.hide(true);
  clue = createClue({ mount: ui });
  const order = createAltarOrder({
    room, page: P, tray, clue,
    onClueTorn: () => progress.save({ clue: true }),
    onSolved: () => {
      progress.save({ altar: true }); if (onProgress) onProgress();
      tray.hide(); room.setPads({ top: P.isMobile() ? 64 : 76, bottom: 40 }); P.setHintBottom(34);
      seq = playRiseShatter(room, crystal, P, { reduced });
      seq.call(() => apply('fragments', { keepBig: true }), null, '+=0.6');
    },
  });
  const puzzle = createShadowPuzzle({
    room, crystal, page: P, variant: 'lunas',
    onSolved: () => { progress.save({ puzzle: true }); if (onProgress) onProgress(); P.hint(''); playKeyReveal(); },
  });
  puzzle.hide();
  room.onTick((tt) => { if (crystal.group.visible) crystal.tick(tt); });

  // ── la llave (de "17 El cuadro y la llave") ──
  const FX = crystalFX(room);
  const keyHolder = new THREE.Group(); room.niche.anchor.add(keyHolder);
  let key = null, canTake = false;
  const ensureKey = () => {
    if (key) return key;
    key = buildKey(); key.visible = false; key.position.y = -0.42; keyHolder.add(key);
    return key;
  };
  const keyHit = document.createElement('button'); keyHit.type = 'button'; keyHit.className = 'lj1-room-zone lj1-room-key'; keyHit.style.display = 'none';
  bindText(keyHit, 'keyName', 'aria-label'); ui.appendChild(keyHit);
  const keyCenter = new THREE.Vector3();
  const GL = room.painting.glow;
  function frameGlow() {
    const c = GL.ctx, W = GL.canvas.width, H = GL.canvas.height; c.clearRect(0, 0, W, H);
    c.save(); c.shadowColor = '#ff9a3c'; c.shadowBlur = 30; c.strokeStyle = '#ffc890'; c.lineWidth = 6; c.strokeRect(6, 6, W - 12, H - 12);
    const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(255,170,90,.55)'); g.addColorStop(1, 'rgba(255,120,50,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore(); GL.tex.needsUpdate = true;
  }
  const clearGlow = () => { GL.ctx.clearRect(0, 0, GL.canvas.width, GL.canvas.height); GL.tex.needsUpdate = true; GL.mat.opacity = 0; };
  room.onTick((tt) => {
    if (!key) return;
    keyHolder.rotation.y = reduced ? 0.2 : Math.sin(tt * 0.7) * 0.45; keyHolder.position.y = reduced ? 0 : Math.sin(tt * 1.3) * 0.02; keyHolder.rotation.z = 0.18;
    if (canTake) { keyCenter.set(0, 0, 0); keyHolder.localToWorld(keyCenter); const s = room.toScreen(keyCenter); keyHit.style.transform = `translate(${s.x}px,${s.y}px)`; }
    if (key.userData.halo) key.userData.halo.material.opacity = 0.3 + Math.sin(tt * 2) * 0.08;
  });
  const showKey = (on) => { canTake = on; keyHit.style.display = on ? '' : 'none'; };

  function playKeyReveal() {
    if (seq) seq.kill();
    ensureKey(); room.renderer.compileAsync(room.scene, room.cam).catch(() => {});
    showKey(false); P.hideBig();
    const C = room.clusterCenter.clone(), g = crystal.group;
    crystal.assemble(); room.scene.add(g); g.visible = true; g.position.copy(C); g.rotation.set(0, 0, 0); g.scale.setScalar(0.72); crystal.setCrackGlow(0.35);
    key.visible = false; key.scale.setScalar(0.001);
    const target = new THREE.Vector3(PAINT.cx, PAINT.cy, WALL_Z + 0.14);
    FX.light.flash.position.copy(target); FX.light.glow.position.copy(C); FX.light.light.position.copy(C);
    const tl = seq = gsap.timeline({ delay: 0.4 });
    tl.to(crystal.materials.crack, { emissiveIntensity: 3, duration: 0.6, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0)
      .fromTo(FX.light.light, { intensity: 0 }, { intensity: 2, duration: 0.6 }, 0)
      .to(g.position, { x: target.x, y: target.y, z: target.z, duration: 1.1, ease: 'power2.inOut' }, 1.0)
      .to(g.rotation, { y: reduced ? 0 : Math.PI * 2, duration: 1.1, ease: 'power2.inOut' }, 1.0)
      .to(g.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 1.1, ease: 'power2.inOut' }, 1.0)
      .to(FX.light.light.position, { x: target.x, y: target.y, z: target.z + 0.2, duration: 1.1, ease: 'power2.inOut' }, 1.0)
      .call(() => { frameGlow(); room.shake(0.025, 0.4); }, null, 2.1)
      .set(g, { visible: false }, 2.15)
      .fromTo(FX.light.flash.material, { opacity: 0 }, { opacity: 0.7, duration: 0.1 }, 2.1)
      .to(FX.light.flash.material, { opacity: 0, duration: 0.8 }, 2.2)
      .fromTo(GL.mat, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 2.1)
      .to(GL.mat, { opacity: 0, duration: 0.9 }, 2.6)
      .to(FX.light.light, { intensity: 0, duration: 0.8 }, 2.3)
      .call(() => room.setFocus('niche', 1.8), null, 2.6);
    room.flare(tl, 2.1);
    room.openPainting(tl, 2.7, 1.7);
    tl.set(key, { visible: true }, 3.3)
      .to(key.scale, { x: 0.52, y: 0.52, z: 0.52, duration: 0.9, ease: 'back.out(1.6)' }, 3.3)
      .call(() => { showKey(true); P.hint('hintTakeKey'); }, null, 4.1);
  }
  function takeKey() {
    if (!canTake) return; showKey(false);
    progress.save({ key: true }); if (onProgress) onProgress();
    keyCenter.set(0, 0, 0); keyHolder.localToWorld(keyCenter); const from = room.toScreen(keyCenter);
    sparks(ui, from.x, from.y, 18, 80);
    keyTray.setAll([]); keyTray.show(reduced);
    room.setPads({ top: P.isMobile() ? 64 : 76, bottom: keyTray.height() + 10 }); P.setHintBottom(keyTray.height() + 18);
    gsap.timeline()
      .to(key.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.35, ease: 'power2.in' }, 0)
      .to(room.niche.light, { intensity: 0.9, duration: 1 }, 0)
      .to(room.niche.glow.material, { opacity: 0.22, duration: 1 }, 0)
      .add(flyIcon(ui, KEY_ICON, from, keyTray.center('key'), { dur: 0.75, size: 90, lift: 60, onComplete: () => { key.visible = false; keyTray.set('key', true); keyTray.flash('key'); P.hint('hintBox'); } }), 0.15);
  }
  keyHit.addEventListener('click', takeKey);

  // ── estados ──
  const pads = (bottom) => room.setPads({ top: P.isMobile() ? 64 : 76, bottom });
  let state = '';
  function apply(st, { keepBig = false, autoSolve = false } = {}) {
    state = st;
    if (seq && !keepBig) seq.kill(); seq = null;
    if (!keepBig) P.hideBig();
    order.enable(false); puzzle.hide(); clue.close(); showKey(false);
    room.resetLights(); room.setVoid(0, 0); room.setPaintingOpen(false); clearGlow();
    crystal.group.visible = false;
    if (key) key.visible = false;
    keyTray.hide(true);
    const s = progress.load();
    if (st === 'objects') {
      tray.hide(true); room.clearObjects(); room.setPaintingLight(0.06); pads(40); room.setFocus('full', 0);
      P.setHintBottom(34); P.hint('hintGather');
      return;
    }
    if (st === 'altar') {
      order.reset({ clueTorn: s.clue }); tray.show(reduced); pads(tray.height() + 10); P.setHintBottom(tray.height() + 18);
      room.setPaintingLight(0.08); room.setFocus('altar', 0); order.enable(true);
      P.hint(P.isMobile() ? 'hintPlaceTap' : 'hintPlace', { delay: 0.6 });
      if (autoSolve) gsap.delayedCall(0.8, () => order.solveNow());
      return;
    }
    tray.hide(true); order.fill(ALTAR_ORDER, { lit: true }); pads(40); P.setHintBottom(34);
    if (st === 'fragments') { room.setPaintingLight(0.22); room.setVoid(1); room.setFocus('painting', keepBig ? 1.2 : 0); P.hint('hintFragments', { delay: keepBig ? 2.5 : 0 }); }
    else if (st === 'puzzle') { room.setPaintingLight(0.4); room.setFocus('painting', 0); P.setHintBottom(30); puzzle.start(); }
    else if (st === 'key') {
      room.setPaintingLight(0.4); room.setPaintingOpen(true); room.setFocus('niche', 0);
      ensureKey(); key.visible = true; key.scale.setScalar(0.52); showKey(true); P.hint('hintTakeKey');
    } else if (st === 'box') {
      room.setPaintingLight(0.4); room.setPaintingOpen(true); room.setFocus('niche', 0);
      keyTray.setAll(['key']); keyTray.show(true); pads(keyTray.height() + 10); P.setHintBottom(keyTray.height() + 18); P.hint('hintBox');
    }
  }
  // al cambiar el tamaño, la bandeja cambia de alto: se reencuadra
  new ResizeObserver(() => {
    if (!isOpen) return;
    const tr = state === 'altar' ? tray : state === 'box' || (state === 'key' && keyTray.shown) ? keyTray : null;
    if (tr && tr.shown) { pads(tr.height() + 10); P.setHintBottom(tr.height() + 18); }
  }).observe(root);

  // ── abrir / cerrar ──
  let isOpen = false, returnFocus = null, unlockScroll = null, openTw = null;
  const html = document.documentElement;
  function lockScroll() {
    const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter }, hasBar = innerWidth > html.clientWidth;
    html.style.overflow = 'hidden'; if (hasBar) html.style.scrollbarGutter = 'stable';
    const block = (e) => { if (!e.target.closest || !e.target.closest('.lj1-clue')) e.preventDefault(); };
    root.addEventListener('wheel', block, { passive: false }); root.addEventListener('touchmove', block, { passive: false });
    return () => { html.style.overflow = prev.overflow; html.style.scrollbarGutter = prev.gutter; root.removeEventListener('wheel', block); root.removeEventListener('touchmove', block); };
  }
  const visible = (el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' && el.style.display !== 'none';
  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); if (clue.isOpen) clue.close(); else close(); return; }
    if (e.key === 'Tab') {
      const scope = clue.isOpen ? clue.el : root;
      const f = [...scope.querySelectorAll('button')].filter((b) => !b.disabled && visible(b) && (clue.isOpen || !clue.el.contains(b)));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement); e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      return;
    }
    if (state === 'puzzle' && /^Arrow/.test(e.key)) {
      e.preventDefault();
      const k = 0.07; puzzle.nudge(e.key === 'ArrowLeft' ? -k : e.key === 'ArrowRight' ? k : 0, e.key === 'ArrowUp' ? -k : e.key === 'ArrowDown' ? k : 0);
    }
  }
  xBtn.addEventListener('click', () => close());

  function open({ instant = false, autoSolve = false } = {}) {
    if (isOpen) return;
    isOpen = true; returnFocus = document.activeElement;
    root.classList.remove('is-closed'); room.wake();
    unlockScroll = lockScroll();
    document.addEventListener('keydown', onKey, true);
    if (openTw) openTw.kill();
    openTw = instant || reduced ? gsap.fromTo(root, { opacity: instant ? 1 : 0 }, { opacity: 1, duration: instant ? 0 : 0.5 }) : gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
    xBtn.focus({ preventScroll: true });
    if (onOpen) onOpen();
    const st = progress.stage();
    room.ready.then(() => { if (isOpen) apply(st === 'off' ? 'objects' : st, { autoSolve }); }).catch(() => {});
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener('keydown', onKey, true);
    if (clue.isOpen) clue.close();
    order.enable(false); puzzle.stop();
    if (openTw) openTw.kill();
    openTw = gsap.to(root, { opacity: 0, duration: reduced ? 0.3 : 0.45, ease: 'power2.in', onComplete: () => {
      root.classList.add('is-closed');
      if (seq) { seq.kill(); seq = null; } // una secuencia a medias: al volver, el cuarto abre en el estado guardado
      P.hideBig(); P.hint('');
      if (unlockScroll) { unlockScroll(); unlockScroll = null; }
      if (returnFocus && returnFocus.isConnected && returnFocus.focus) returnFocus.focus({ preventScroll: true });
      if (onClose) onClose();
    } });
  }

  return {
    get isOpen() { return isOpen; },
    open, close,
    prepare() { /* crear la UI ya prepara el cuarto en segundo plano */ },
    sync() { if (isOpen) apply(progress.stage()); },
    relang() {
      tray.relang(); keyTray.relang(); order.relang(); clue.relang();
      if (hintKey && hintEl.textContent) hintEl.textContent = t()[hintKey];
      if (bigKey) { bigEl.textContent = t()[bigKey]; bigEl.dataset.text = t()[bigKey]; }
    },
    destroy() {
      if (isOpen) { isOpen = false; document.removeEventListener('keydown', onKey, true); if (unlockScroll) unlockScroll(); }
      if (seq) seq.kill();
      gsap.killTweensOf([root, hintEl, bigEl]);
      room.dispose(); root.remove();
    },
  };
}
