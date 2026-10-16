// LunáticosTv · juegos — configuración central.
//
// activeGame: 'j1' activa "Los objetos del Cholo" (niveles 1 y 2). null = no se carga nada: el sitio queda como el original.
//
// Juego 1 (j1):
//   pages        páginas donde se carga el juego (luna que parpadea, botón del cuarto, HUD). Tienda, catálogo y cualquier
//                página de la tienda NO van aquí.
//   objects      página → objeto del nivel 1 que flota en ella. Objetos: cassette, microphone, candle, notebook, medallion.
//   objectDelay  segundos [mín, máx] desde que la página está lista (o desde que se activa el juego) hasta que aparece el objeto.
//   fragments    página → dónde se esconde su fragmento de cristal (nivel 2). Cada página lleva una lista de lugares; se usa
//                el primero que exista en la página y no tape nada interactivo:
//                  anchor   selector CSS del elemento junto al que se coloca
//                  x, y     posición del centro del fragmento dentro de ese elemento, en % de su ancho / alto
//                           (pueden salir de 0–100 para asomarse por un borde)
//                  size     tamaño visible en px (el área de toque nunca baja de 48 px)
//                  rotate   giro en grados
//                  tuck     'top' | 'bottom' | 'left' | 'right' (opcional): el borde del elemento por el que se asoma; la parte
//                           que queda fuera de ese borde se oculta, como si estuviera metido detrás
//   rewardLink   destino del botón "Ver contenido exclusivo de CHOLO" de la caja ('#' = todavía sin destino: no hace nada).
//                Si es de otro dominio, abre en pestaña nueva.
//   debug        params: acepta ?j1reset, ?j1stage=… y ?calidad=… en la URL · console: muestra en consola los errores del juego
//                (también con ?j1debug).

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
    // El orden de las páginas aquí es el número del fragmento (1.º index … 5.º contacto).
    fragments: {
      index: [
        { anchor: '#home-estudio .split__media', x: 9, y: 106, size: 66, rotate: -16, tuck: 'bottom' },
        { anchor: '#home-estudio', x: 92, y: 100, size: 60, rotate: -16, tuck: 'bottom' },
      ],
      estudio: [
        { anchor: '.quote-band', x: 90, y: 16, size: 60, rotate: 18 },
        { anchor: '.def-grid', x: 94, y: 6, size: 56, rotate: 18 },
      ],
      proyectos: [
        { anchor: '.page-lead', x: 93, y: 0, size: 62, rotate: -8, tuck: 'top' },
        { anchor: '.work-band', x: 95, y: 4, size: 56, rotate: -8 },
      ],
      talento: [
        { anchor: '.talent-hero', x: 10, y: 86, size: 62, rotate: 24 },
        { anchor: '.talent-hero', x: 88, y: 12, size: 56, rotate: 24 },
      ],
      contacto: [
        { anchor: '.contact-paths-band', x: 94, y: 12, size: 60, rotate: -22 },
        { anchor: '.form-band', x: 6, y: 8, size: 56, rotate: -22 },
      ],
    },
    rewardLink: '#',
    debug: { params: true, console: false },
  },
};
