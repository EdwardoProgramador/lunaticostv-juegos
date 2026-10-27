// Contenido exclusivo al terminar el juego (dentro de la pantalla final de box.js): primero el video de Alonso Ortiz, que se
// reproduce solo, y al terminar (o con "Saltar video") un carrusel con las 5 fotos que se desliza con el dedo, flechas,
// puntos o el teclado.
// · Archivos en assets/reward/: video.mp4 (H.264 720×1280, ~3 MB, se reproduce en cualquier navegador) + poster.jpg, y cada
//   foto en AVIF (800 y 1200 px de ancho) con JPEG de respaldo (1200 px) para navegadores sin AVIF.
// · Nada se descarga antes de abrir la caja: prime() (llamado en el clic que abre la caja) empieza a bajar el video y lo
//   "desbloquea" para que después pueda sonar (iOS/Safari solo dejan reproducir con sonido desde un toque). Si aun así el
//   navegador no deja sonar, el video arranca en silencio con el botón "Activar sonido".
//   const r = createReward({ link, reduced });  r.prime();  r.play();  r.onKey(e);  r.destroy()
import { gsap } from './vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [{ asset }, { t, bindText }] = await Promise.all([import(`./lib/paths.js${V}`), import(`./i18n.js${V}`)]);

const PHOTOS = 5;
const photo = (n) => `<picture><source type="image/avif" srcset="${asset(`reward/foto-${n}-800.avif`)} 800w, ${asset(`reward/foto-${n}-1200.avif`)} 1200w" sizes="(max-width: 640px) 70vw, 38vh"><img src="${asset(`reward/foto-${n}-1200.jpg`)}" width="1200" height="1800" alt="" decoding="async" loading="${n <= 2 ? 'eager' : 'lazy'}" draggable="false"></picture>`;

export function createReward({ link = '#', reduced = false } = {}) {
  const hasLink = !!link && link !== '#';
  const el = document.createElement('div');
  el.className = 'lj1-reward'; el.hidden = true;
  el.innerHTML = `<div class="lj1-reward__stage lj1-reward__movie">
      <div class="lj1-reward__frame">
        <video playsinline preload="none" disablepictureinpicture></video>
        <button type="button" class="lj1-reward__toggle"><span aria-hidden="true"></span></button>
        <span class="lj1-reward__bar" aria-hidden="true"><i></i></span>
      </div>
      <div class="lj1-reward__actions">
        <button type="button" class="lj1-btn lj1-reward__sound" hidden></button>
        <button type="button" class="lj1-btn lj1-reward__skip"></button>
      </div>
    </div>
    <div class="lj1-reward__stage lj1-reward__gallery" hidden>
      <h2 class="lj1-title lj1-reward__title" data-text=""></h2>
      <div class="lj1-reward__carousel">
        <div class="lj1-reward__track" tabindex="0" role="region">${Array.from({ length: PHOTOS }, (_, i) => `<div class="lj1-reward__slide" role="group">${photo(i + 1)}</div>`).join('')}</div>
        <button type="button" class="lj1-reward__arrow lj1-reward__arrow--prev"></button>
        <button type="button" class="lj1-reward__arrow lj1-reward__arrow--next"></button>
      </div>
      <div class="lj1-reward__dots">${'<button type="button"><i></i></button>'.repeat(PHOTOS)}</div>
      <p class="lj1-reward__swipe"></p>
      <div class="lj1-reward__actions">
        <button type="button" class="lj1-btn lj1-reward__replay"></button>
        ${hasLink ? '<a class="lj1-btn lj1-reward__cta"></a>' : ''}
      </div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const movie = $('.lj1-reward__movie'), gallery = $('.lj1-reward__gallery'), video = $('video'), toggle = $('.lj1-reward__toggle');
  const bar = $('.lj1-reward__bar i'), sound = $('.lj1-reward__sound'), skip = $('.lj1-reward__skip'), replay = $('.lj1-reward__replay');
  const track = $('.lj1-reward__track'), slides = [...el.querySelectorAll('.lj1-reward__slide')];
  const prev = $('.lj1-reward__arrow--prev'), next = $('.lj1-reward__arrow--next'), dots = [...el.querySelectorAll('.lj1-reward__dots button')];

  bindText($('.lj1-reward__title'), 'rewardTitle'); bindText(sound, 'rewardSound'); bindText(skip, 'rewardSkip'); bindText(replay, 'rewardReplay');
  bindText($('.lj1-reward__swipe'), 'rewardSwipe'); bindText(prev, 'rewardPrev', 'aria-label'); bindText(next, 'rewardNext', 'aria-label');
  bindText(track, 'rewardTitle', 'aria-label');
  slides.forEach((s, i) => bindText(s, (tx) => tx.rewardPhoto(i + 1, PHOTOS), 'aria-label')); // la foto (alt="") la nombra su grupo
  dots.forEach((d, i) => bindText(d, (tx) => tx.rewardPhoto(i + 1, PHOTOS), 'aria-label'));
  bindText(toggle, (tx) => (video.paused ? tx.rewardPlay : tx.rewardPause), 'aria-label');
  if (hasLink) {
    const cta = $('.lj1-reward__cta');
    bindText(cta, 'revealButton'); cta.href = link;
    try { const u = new URL(cta.href, location.href); if (u.origin !== location.origin) { cta.target = '_blank'; cta.rel = 'noopener'; } } catch (e) { /* href relativo raro: se queda */ }
  }

  let primed = false, stage = null, gone = false;
  const label = () => toggle.setAttribute('aria-label', video.paused ? t().rewardPlay : t().rewardPause);

  // ── video ──
  function prime() {
    if (primed || gone) return;
    primed = true;
    video.poster = asset('reward/poster.jpg');
    video.preload = 'auto';
    video.src = asset('reward/video.mp4');
    // reproducir y pausar dentro del clic deja el video "desbloqueado" para sonar después (Safari/iOS)
    video.muted = true;
    const p = video.play();
    if (p && p.then) p.then(() => { if (stage !== 'movie') { video.pause(); video.currentTime = 0; } }, () => {});
  }
  function start() {
    prime();
    video.currentTime = 0;
    video.muted = false; sound.hidden = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => { // sin permiso para sonar: en silencio, con el botón para activar el sonido
      if (stage !== 'movie') return;
      video.muted = true; sound.hidden = false;
      video.play().catch(() => { toggle.classList.add('is-paused'); label(); });
    });
  }
  const onTime = () => { if (video.duration) bar.style.transform = `scaleX(${(video.currentTime / video.duration).toFixed(4)})`; };
  const onState = () => { toggle.classList.toggle('is-paused', video.paused && stage === 'movie'); label(); };
  video.addEventListener('timeupdate', onTime);
  video.addEventListener('play', onState); video.addEventListener('pause', onState);
  video.addEventListener('ended', () => { if (stage === 'movie') show('gallery'); });
  video.addEventListener('error', () => { if (stage === 'movie') show('gallery'); }); // sin video: directo a las fotos
  toggle.addEventListener('click', () => {
    if (video.paused) { video.play().catch(() => {}); } else video.pause();
  });
  sound.addEventListener('click', () => { video.muted = false; sound.hidden = true; if (video.paused) video.play().catch(() => {}); });
  skip.addEventListener('click', () => show('gallery'));
  replay.addEventListener('click', () => show('movie'));

  // ── carrusel ──
  let current = 0, raf = 0;
  const center = (i) => slides[i].offsetLeft + slides[i].offsetWidth / 2 - track.clientWidth / 2;
  function paint(i) {
    current = i;
    dots.forEach((d, k) => d.toggleAttribute('aria-current', k === i));
    prev.disabled = i === 0; next.disabled = i === PHOTOS - 1;
  }
  function goTo(i, smooth = true) {
    i = Math.max(0, Math.min(PHOTOS - 1, i));
    track.scrollTo({ left: center(i), behavior: smooth && !reduced ? 'smooth' : 'auto' });
    paint(i);
  }
  track.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      slides.forEach((s, k) => { if (Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid) < Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - mid)) best = k; });
      if (best !== current) paint(best);
    });
  }, { passive: true });
  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  // arrastrar con el ratón (en táctil ya se desliza solo)
  let drag = null;
  track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { x: e.clientX, left: track.scrollLeft, moved: false }; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; track.classList.add('is-dragging'); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null; track.classList.remove('is-dragging');
    if (moved) { const mid = track.scrollLeft + track.clientWidth / 2; goTo(slides.reduce((b, s, k) => (Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid) < Math.abs(slides[b].offsetLeft + slides[b].offsetWidth / 2 - mid) ? k : b), 0)); }
  };
  track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);
  const onResize = () => { if (stage === 'gallery') goTo(current, false); };
  addEventListener('resize', onResize, { passive: true });

  // ── etapas ──
  function show(name) {
    if (gone || name === stage) return;
    const from = stage === 'movie' ? movie : stage === 'gallery' ? gallery : null;
    const to = name === 'movie' ? movie : gallery;
    stage = name;
    if (name === 'gallery') { video.pause(); toggle.classList.remove('is-paused'); }
    const enter = () => {
      if (from) from.hidden = true;
      to.hidden = false;
      if (name === 'movie') start();
      else { goTo(0, false); track.focus({ preventScroll: true }); }
      if (reduced) gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      else gsap.fromTo(to, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    };
    if (from) gsap.to(from, { opacity: 0, duration: reduced ? 0.2 : 0.35, onComplete: enter });
    else enter();
  }

  return {
    el,
    prime,
    play() { el.hidden = false; show('movie'); },
    // teclado de la pantalla final: flechas en el carrusel, espacio para pausar el video. true = tecla usada.
    onKey(e) {
      if (stage === 'gallery' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { goTo(current + (e.key === 'ArrowLeft' ? -1 : 1)); return true; }
      // espacio pausa el video, salvo sobre un botón o enlace (que se activa a sí mismo)
      if (stage === 'movie' && e.key === ' ' && !(document.activeElement && document.activeElement.closest('button, a'))) { toggle.click(); return true; }
      return false;
    },
    destroy() {
      if (gone) return; gone = true;
      removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf([movie, gallery]);
      video.pause(); video.removeAttribute('src'); video.load(); // corta la descarga
      el.remove();
    },
  };
}
