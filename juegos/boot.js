// LunáticosTv · juegos — único script que incluyen las páginas:
//   <script type="module" src="juegos/boot.js"></script>
// Lee config.js y, si hay juego activo para esta página, carga su "puerta" (para j1: j1/gate.js, unos pocos KB: la luna
// que parpadea y el botón que activa el juego). El juego completo solo se descarga al activarlo.
// Con activeGame = null no hace nada más.
// Caché: config.js se pide siempre fresco (es pequeño) y trae `version`; la puerta se carga con ?v=<version> y cada archivo
// del juego pasa ese mismo ?v= a todo lo que carga (scripts, estilos, texturas, iconos, fuentes). Al cambiar `version` en
// config.js, todo se descarga de nuevo. Este archivo no lleva versión: no debería cambiar entre versiones del juego.
const GATES = { j1: (q) => import(`./j1/gate.js${q}`) };

function pageKey() {
  const last = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index';
  return last.replace(/\.html$/i, '') || 'index';
}

// El juego es un extra: si algo falla, el sitio sigue intacto y no se escribe nada en la consola (salvo con debug: true).
import(`./config.js?t=${Date.now()}`)
  .then(({ activeGame, games, version, debug = false }) => {
    const game = activeGame && games[activeGame];
    const page = pageKey();
    if (!game || !GATES[activeGame] || !Array.isArray(game.pages) || !game.pages.includes(page)) return null;
    return GATES[activeGame](version ? `?v=${encodeURIComponent(version)}` : '')
      .then((mod) => mod.init({ page, config: game, debug: debug === true }))
      .catch((e) => { if (debug === true) console.error(e); });
  })
  .catch(() => {});
