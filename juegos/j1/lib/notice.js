// Instrucciones del juego en los momentos clave: una frase corta con el estilo del título de la marca.
// No bloquea nada: solo el propio texto recibe clics (un clic o toque lo cierra), aparece con un fundido, se queda unos
// segundos (según su largo) y se va. Una a la vez: la nueva sustituye a la anterior. Cada instrucción se muestra una sola
// vez por partida (progress.tips).
//   tip('tipAltar', { mount, delay, onHide })  → false si ya se mostró en esta partida
//   remind('tipRoom', { delay })               → igual, pero puede repetirse (recordatorio en cada página)
//   hideTip()                                  → cierra la que esté a la vista (p. ej. al cerrar el cuarto)
// mount: document.body (en la página: capa fija abajo, debajo del menú) o la capa de UI del cuarto (arriba, bajo el título).
import { gsap } from '../vendor/gsap-3.12.5/gsap.min.js';
const V = new URL(import.meta.url).search; // ?v=… (config.js → version): el mismo en todos los archivos del juego
const [progress, { t, bindText }, { prefersReduced }] = await Promise.all([
  import(`../progress.js${V}`),
  import(`../i18n.js${V}`),
  import(`./dom.js${V}`),
]);

let current = null;

function show(key, { mount = document.body, delay = 0, onHide } = {}) {
  if (current) current.hide(true);
  const reduced = prefersReduced();
  const el = document.createElement('div');
  el.className = 'lj1-scope lj1-notice' + (mount === document.body ? ' lj1-notice--page' : '');
  el.setAttribute('role', 'status');
  el.innerHTML = '<p class="lj1-title lj1-notice__text" data-text=""></p>';
  bindText(el.firstChild, key);
  el.title = t().close;
  mount.appendChild(el);
  const hold = Math.min(9, 3.4 + t()[key].length * 0.05); // segundos a la vista: ~5–7 s para estas frases
  let gone = false, timer = null;
  const me = {
    hide(now = false) {
      if (gone) return; gone = true;
      if (current === me) current = null;
      if (timer) timer.kill();
      gsap.killTweensOf(el);
      const done = () => { el.remove(); if (onHide) onHide(); };
      if (now) { done(); return; }
      gsap.to(el, { opacity: 0, y: reduced ? 0 : -6, duration: 0.45, ease: 'power1.in', onComplete: done });
    },
  };
  gsap.set(el, { opacity: 0 });
  gsap.fromTo(el, reduced ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: reduced ? 0.5 : 0.7, ease: 'power2.out', delay, clearProps: 'filter' });
  timer = gsap.delayedCall(delay + hold, () => me.hide());
  el.addEventListener('click', () => me.hide());
  current = me;
  return me;
}

export function tip(key, opts) {
  const shown = progress.load().tips;
  if (shown.includes(key)) return false;
  progress.save({ tips: shown.concat(key) });
  return show(key, opts);
}

// Recordatorio: la misma instrucción, pero se puede repetir (no queda registrada en progress.tips).
export function remind(key, opts) { return show(key, opts); }

export function hideTip() { if (current) current.hide(); }
