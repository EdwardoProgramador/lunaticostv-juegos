// Mock website header (prototype only — the real site has its own): logo, nav, the room button slot,
// language switch and a button on the right; ≤ 640px collapses to logo · room button · hamburger.
//   const h = createSiteHeader({ mount, roomButton: true });  h.room → createRoomButton() handle
import { TEXT } from './level2-text.js';
import { createRoomButton } from './room-button.js';

const CSS = `
.csite{position:relative;z-index:3;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:20px;padding:12px 28px;background:rgba(6,8,20,.92);border-bottom:1px solid rgba(184,121,106,.18)}
.csite-logo{display:inline-flex;align-items:center;gap:10px;font:700 24px/1 var(--f-title);color:#F2D2BC;text-decoration:none}
.csite-moon{width:20px;height:20px;border-radius:50%;box-shadow:inset 6px -2px 0 0 #F2D2BC;transform:rotate(-18deg)}
.csite-mid{display:flex;align-items:center;justify-content:center;gap:26px;min-width:0}
.csite-nav{display:flex;gap:24px}
.csite-nav a{font:600 14px/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:#c9b8bf;text-decoration:none;white-space:nowrap}
.csite-nav a:hover{color:#fff}
.csite-right{display:flex;align-items:center;gap:12px}
.csite-lang{display:inline-flex;border:1px solid rgba(184,121,106,.45);padding:3px}
.csite-lang button{min-width:34px;min-height:30px;border:0;background:transparent;color:#8C7F8E;font:700 12px/1 var(--f-ui);letter-spacing:.12em;cursor:pointer}
.csite-lang button[aria-pressed="true"]{background:rgba(184,121,106,.22);color:#F2D2BC}
.csite-burger{display:none;width:44px;height:44px;border:1px solid rgba(184,121,106,.45);background:transparent;cursor:pointer;position:relative}
.csite-burger span,.csite-burger::before,.csite-burger::after{content:"";position:absolute;left:12px;right:12px;height:2px;background:#F2D2BC}
.csite-burger span{top:21px}.csite-burger::before{top:14px}.csite-burger::after{top:28px}
@container (max-width:1180px){.csite{gap:14px;padding:12px 20px}.csite-nav{gap:16px}.csite-nav a{font-size:13px;letter-spacing:.1em}.csite-mid{gap:14px}}
@container (max-width:1020px){.csite-nav a:nth-child(n+3){display:none}}
@container (max-width:820px){.csite-nav{display:none}.csite-mid{justify-content:flex-end}}
@container (max-width:640px){
  .csite{grid-template-columns:auto minmax(0,1fr) auto;padding:10px 14px;gap:8px}
  .csite-nav,.csite-right{display:none}
  .csite-mid{justify-content:flex-end}
  .csite-burger{display:block}
  .csite-logo{font-size:21px}
}
@media (max-width:640px){
  .csite{padding:10px 14px;gap:8px;padding-top:calc(10px + env(safe-area-inset-top,0px))}
  .csite-nav,.csite-right{display:none}
  .csite-mid{justify-content:flex-end}
  .csite-burger{display:block}
}`;
let cssDone = false;

export function createSiteHeader({ mount, roomButton = true, roomState = 'normal', onRoom } = {}) {
  if (!cssDone) { document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`); cssDone = true; }
  const el = document.createElement('header'); el.className = 'csite';
  const S = TEXT.site;
  el.innerHTML = `<a class="csite-logo" href="#" onclick="return false"><span class="csite-moon" aria-hidden="true"></span>${S.logo}</a>
    <div class="csite-mid"><nav class="csite-nav">${S.nav.map(n => `<a href="#" onclick="return false">${n}</a>`).join('')}</nav><span class="csite-room"></span></div>
    <div class="csite-right"><div class="csite-lang" role="group">${S.langs.map((l, i) => `<button aria-pressed="${i === 0}">${l}</button>`).join('')}</div><button class="ch-btn ch-btn--sm">${S.cta}</button></div>
    <button class="csite-burger" aria-label="${S.menu}"><span></span></button>`;
  mount.appendChild(el);
  el.querySelectorAll('.csite-lang button').forEach(b => b.onclick = () => el.querySelectorAll('.csite-lang button').forEach(x => x.setAttribute('aria-pressed', x === b)));
  const room = roomButton ? createRoomButton({ mount: el.querySelector('.csite-room'), state: roomState, onClick: onRoom }) : null;
  return { el, room, right: el.querySelector('.csite-right') };
}
