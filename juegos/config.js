// LunáticosTv · juegos — configuración central.
//
// version: versión publicada del juego. Se añade como ?v=… a TODOS los archivos del juego (scripts, estilos, texturas, iconos,
//          fuentes), así una versión nueva nunca se queda con archivos viejos en la caché del navegador.
//          CADA VEZ QUE PUBLIQUES CAMBIOS EN /juegos/, CAMBIA ESTE VALOR (cualquier texto distinto sirve; por costumbre,
//          la fecha + un número: '2026-10-16.2'). Las librerías de vendor/ no lo necesitan: su carpeta lleva su propia
//          versión (three-0.184.0, gsap-3.12.5) y nunca cambian de contenido.
//
// activeGame: 'j1' activa "Los objetos del Cholo" (niveles 1 y 2). null = no se carga nada: el sitio queda como el original.
//
// Juego 1 (j1):
//   pages        páginas donde se carga el juego (luna que parpadea, botón del cuarto, HUD). Tienda, catálogo y cualquier
//                página de la tienda NO van aquí.
//   objects      página → objeto del nivel 1 que flota en ella. Objetos: cassette, microphone, candle, notebook, medallion.
//   objectDelay  segundos [mín, máx] desde que la página está lista (o desde que se activa el juego) hasta que aparece el objeto.
//   fragments    página → escondites de su fragmento de cristal (nivel 2). Un fragmento por página (Inicio no lleva) y el orden
//                de las páginas aquí es el número del fragmento. Cada página tiene una lista ("pool") de 3–4 escondites a
//                distintas alturas de la página; cada partida elige UNO al azar por página (se recuerda mientras dure la
//                visita). Si el elegido no existe en esa pantalla o taparía algo interactivo, se prueba el siguiente.
//                Cada escondite:
//                  anchor   selector CSS de una sección o elemento real de la página (así funciona en cualquier pantalla)
//                  x, y     posición del centro del fragmento dentro de ese elemento, en % de su ancho / alto
//                           (pueden salir de 0–100 para asomarse por un borde)
//                  size     tamaño visible en px (el área de toque nunca baja de 48 px)
//                  rotate   giro en grados
//                  tuck     'top' | 'bottom' | 'left' | 'right' (opcional): el borde del elemento por el que se asoma; la parte
//                           que queda fuera de ese borde se oculta, como si estuviera metido detrás
//                Nunca se coloca bajo el menú, encima de enlaces, botones, formularios o controles de la tienda, ni fuera del
//                documento. Para mover un escondite cambia x / y (o el anchor); para añadir uno, añade una línea a la lista.
//   rewardLink   destino del botón "Ver contenido exclusivo de CHOLO" de la caja ('#' = todavía sin destino: no hace nada).
//                Si es de otro dominio, abre en pestaña nueva.
//   debug        params: acepta ?j1reset, ?j1stage=… y ?calidad=… en la URL · console: muestra en consola los errores del juego
//                (también con ?j1debug).

export const version = '2026-10-16.1';

export const activeGame = 'j1';

export const games = {
  j1: {
    pages: ['index', 'estudio', 'proyectos', 'talento', 'contacto', 'alonso-ortiz'],
    objects: {
      index: 'cassette',
      estudio: 'microphone',
      proyectos: 'notebook',
      talento: 'medallion',
      contacto: 'candle',
    },
    objectDelay: [2, 4],
    // 1.º estudio · 2.º proyectos · 3.º talento · 4.º contacto · 5.º tienda (Inicio no lleva fragmento).
    // Escondites de arriba a abajo; los últimos de cada lista están cerca del final de la página.
    fragments: {
      estudio: [
        { anchor: '.def-grid', x: 96, y: 93, size: 50, rotate: 18 },
        { anchor: '.quote-band', x: 5, y: 86, size: 52, rotate: -14 },
        { anchor: '.steps', x: 95, y: 5, size: 50, rotate: 26 },
        { anchor: '.home-closer', x: 6, y: 90, size: 52, rotate: -22 },
      ],
      proyectos: [
        { anchor: '.page-lead', x: 96, y: 84, size: 50, rotate: -10 },
        { anchor: '.work-band', x: 3, y: 97, size: 50, rotate: 16 },
        { anchor: '.quote-band', x: 94, y: 90, size: 52, rotate: -24 },
        { anchor: '.home-strip', x: 4, y: 50, size: 48, rotate: 12 },
      ],
      talento: [
        { anchor: '.talent-hero', x: 6, y: 95, size: 50, rotate: 24 },
        { anchor: '.talent-hero', x: 95, y: 91, size: 50, rotate: -18 },
        { anchor: '.foot', x: 95, y: 30, size: 48, rotate: 10 },
        { anchor: '.foot', x: 62, y: 78, size: 46, rotate: -14 },
      ],
      contacto: [
        { anchor: '.contact-paths-band', x: 96, y: 93, size: 50, rotate: -22 },
        { anchor: '.form-band', x: 6, y: 92, size: 52, rotate: 14 },
        { anchor: '.home-closer', x: 93, y: 10, size: 50, rotate: 20 },
        { anchor: '.foot', x: 96, y: 34, size: 46, rotate: -12 },
      ],
      tienda: [
        { anchor: '.shop-hero', x: 6, y: 94, size: 50, rotate: 20 },
        { anchor: '.shop-hero', x: 95, y: 90, size: 50, rotate: -16 },
        { anchor: '.foot', x: 60, y: 34, size: 46, rotate: 12 },
        { anchor: '.foot', x: 94, y: 84, size: 46, rotate: -20 },
      ],
    },
    rewardLink: '#',
    debug: { params: true, console: false },
  },
};
