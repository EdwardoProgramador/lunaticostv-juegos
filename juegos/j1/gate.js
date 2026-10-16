// Juego 1 · la "puerta": lo único que se carga antes de activar el juego (boot.js → gate.js + progress.js).
// · La luna del logo (svg.nav__mark) parpadea suave cada pocos segundos.
// · Un botón transparente encima de la luna (insertado en el <nav>, fuera del enlace del logo: el texto "LunáticosTv" sigue
//   llevando a Inicio) activa el juego. Es un <button> real: funciona con ratón, toque, teclado y lector de pantalla.
// · Activado (o si ya estaba activado en esta visita), se carga main.js. Al terminar el juego, main.js vuelve a llamar arm().
// Depuración (si config.debug.params): ?j1reset borra el progreso · ?j1stage=room|altar|fragments|puzzle|box salta a esa etapa.
import * as progress from './progress.js';

const STYLE = `
@keyframes lj1-moon-blink{0%,70%,100%{opacity:1;filter:none}79%{opacity:.35;filter:none}87%{opacity:1;filter:drop-shadow(0 0 5px rgba(255,154,60,.95)) drop-shadow(0 0 12px rgba(255,154,60,.5))}94%{opacity:1;filter:drop-shadow(0 0 2px rgba(255,154,60,.4))}}
.lj1-moon{animation:lj1-moon-blink 4.6s ease-in-out 1s infinite}
.lj1-moon.is-lit{animation:none;filter:drop-shadow(0 0 7px rgba(255,154,60,1)) drop-shadow(0 0 16px rgba(255,154,60,.6))}
.lj1-activator:hover~.nav__brand .lj1-moon,.lj1-activator:focus-visible~.nav__brand .lj1-moon{filter:drop-shadow(0 0 5px rgba(255,154,60,.9))}
@media (prefers-reduced-motion:reduce){.lj1-moon{animation-duration:7s}}
.lj1-activator{position:absolute;z-index:2;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;appearance:none;-webkit-appearance:none}
.lj1-activator:focus{outline:none}
.lj1-activator:focus-visible{outline:2px solid #FF9A3C;outline-offset:2px}
.lj1-activator--fixed{position:fixed;z-index:101}`;
const LABEL = { es: 'Activar el juego del Cholo', en: 'Start the Cholo game' };
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');

let ctx = null, main = null, armed = null;

function whenIdle() {
  return new Promise((resolve) => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 2500 }) : setTimeout(resolve, 400));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  });
}

function run(activated) {
  return import('./main.js')
    .then((m) => { main = m; return m.start({ ...ctx, activated }); })
    .catch(ctx.log);
}

// Pone la luna a parpadear y el botón encima. Devuelve false si la página no tiene la luna del logo.
export function arm() {
  if (armed) return true;
  const mark = document.querySelector('.nav__brand .nav__mark, svg.nav__mark');
  const link = mark && mark.closest('a');
  if (!mark || !link) return false;
  if (!document.getElementById('lj1-gate-style')) {
    const st = document.createElement('style'); st.id = 'lj1-gate-style'; st.textContent = STYLE; document.head.appendChild(st);
  }
  mark.classList.add('lj1-moon');
  const nav = link.closest('nav, header');
  const inside = nav && getComputedStyle(nav).position !== 'static';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'lj1-activator' + (inside ? '' : ' lj1-activator--fixed');
  const label = () => { btn.setAttribute('aria-label', LABEL[lang()]); btn.title = LABEL[lang()]; };
  label();
  if (inside) link.parentNode.insertBefore(btn, link); else document.body.appendChild(btn);
  const place = () => {
    const r = mark.getBoundingClientRect(), o = inside ? nav.getBoundingClientRect() : { left: 0, top: 0 };
    btn.style.transform = `translate(${(r.left - o.left + r.width / 2).toFixed(1)}px,${(r.top - o.top + r.height / 2).toFixed(1)}px)`;
  };
  place();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(place) : null;
  if (ro) { ro.observe(nav || document.body); ro.observe(mark); }
  addEventListener('resize', place, { passive: true });
  if (!inside) addEventListener('scroll', place, { passive: true });
  document.addEventListener('ltv:languagechange', label);
  const onClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    progress.save({ active: true });
    disarm({ lit: true });
    run(true);
  };
  btn.addEventListener('click', onClick);
  armed = { mark, btn, ro, place, label };
  return true;
}

export function disarm({ lit = false } = {}) {
  if (!armed) return;
  const { mark, btn, ro, place, label } = armed;
  armed = null;
  if (ro) ro.disconnect();
  removeEventListener('resize', place); removeEventListener('scroll', place);
  document.removeEventListener('ltv:languagechange', label);
  btn.remove();
  mark.classList.remove('lj1-moon');
  if (lit) { mark.classList.add('lj1-moon', 'is-lit'); setTimeout(() => mark.classList.remove('lj1-moon', 'is-lit'), 900); }
}

export function init({ page, config }) {
  const q = new URLSearchParams(location.search), dbg = config.debug || {};
  const log = (e) => { if (dbg.console || q.has('j1debug')) console.error(e); };
  // recargar o entrar de nuevo al sitio = juego nuevo; pasar de una página a otra conserva el progreso
  if ((dbg.params && q.has('j1reset')) || progress.isFreshVisit()) progress.reset();
  const stage = dbg.params ? q.get('j1stage') : null;
  if (stage && progress.DEBUG_STAGES[stage]) { progress.reset(); progress.save(progress.DEBUG_STAGES[stage]); }
  ctx = { page, config, log, debugStage: stage && progress.DEBUG_STAGES[stage] ? stage : null };

  if (progress.load().active) whenIdle().then(() => run(false));
  else arm();

  // vuelta con atrás/adelante desde la caché del navegador: el progreso pudo cambiar en otra página
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    if (main) { main.sync(); return; }
    if (progress.load().active) { disarm(); run(false); }
    else arm();
  });
}
