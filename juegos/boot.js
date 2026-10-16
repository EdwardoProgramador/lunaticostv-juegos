// LunáticosTv · juegos — único script que incluyen las páginas:
//   <script type="module" src="juegos/boot.js"></script>
// Lee config.js y, si hay juego activo para esta página, carga su "puerta" (para j1: j1/gate.js, unos pocos KB: la luna
// que parpadea y el botón que activa el juego). El juego completo solo se descarga al activarlo.
// Con activeGame = null no hace nada más.
import { activeGame, games } from './config.js';

const GATES = { j1: () => import('./j1/gate.js') };

function pageKey() {
  const last = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index';
  return last.replace(/\.html$/i, '') || 'index';
}

const game = activeGame && games[activeGame];
const page = pageKey();
if (game && GATES[activeGame] && Array.isArray(game.pages) && game.pages.includes(page)) {
  GATES[activeGame]()
    .then((mod) => mod.init({ page, config: game }))
    .catch((e) => { if ((game.debug && game.debug.console) || /[?&]j1debug\b/.test(location.search)) console.error(e); }); // el juego es un extra: si falla, el sitio sigue intacto
}
