// LunáticosTv · juegos — único script que incluyen las páginas:
//   <script type="module" src="juegos/boot.js"></script>
// Lee config.js y, si hay juego activo para esta página, lo carga cuando la página ya terminó
// de cargar y el navegador está libre. Con activeGame = null no hace nada más.
import { activeGame, games } from './config.js';

const GAMES = { j1: () => import('./j1/main.js') };

function pageKey() {
  const last = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index';
  return last.replace(/\.html$/i, '') || 'index';
}

function whenIdle() {
  return new Promise((resolve) => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 2500 }) : setTimeout(resolve, 400));
    if (document.readyState === 'complete') idle();
    else addEventListener('load', idle, { once: true });
  });
}

const game = activeGame && games[activeGame];
const page = pageKey();
if (game && GAMES[activeGame] && Array.isArray(game.pages) && game.pages.includes(page)) {
  whenIdle()
    .then(GAMES[activeGame])
    .then((mod) => mod.start({ page, config: game }))
    .catch((e) => { if (/[?&]j1debug\b/.test(location.search)) console.error(e); }); // el juego es un extra: si falla, el sitio sigue intacto
}
