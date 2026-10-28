// LunáticosTv · juegos — configuración central.
//
// version: versión publicada del juego. Se añade como ?v=… a TODOS los archivos del juego (scripts, estilos, texturas, iconos,
//          fuentes), así una versión nueva nunca se queda con archivos viejos en la caché del navegador.
//          CADA VEZ QUE PUBLIQUES CAMBIOS EN /juegos/, CAMBIA ESTE VALOR (cualquier texto distinto sirve; por costumbre,
//          la fecha + un número: '2026-10-16.2'). Las librerías de vendor/ no lo necesitan: su carpeta lleva su propia
//          versión (three-0.184.0, gsap-3.12.5) y nunca cambian de contenido.
//
// debug:   false en producción: el juego no acepta ningún atajo de prueba en la URL y no escribe nada en la consola.
//          true (solo para probar) activa: ?j1reset (borra el progreso), ?j1stage=room|altar|fragments|puzzle|box|done
//          (salta a esa etapa), ?calidad=alta|baja|minima (fuerza la calidad gráfica) y los errores del juego en la consola.
//          Antes de publicar, déjalo en false.
//
// activeGame: 'j1' activa "Los objetos del Cholo" (niveles 1 y 2). null = no se carga nada: el sitio queda como el original.
//
// Juego 1 (j1):
//   pages        páginas donde se carga el juego (luna que parpadea, botón del cuarto, HUD). La portada de la Tienda (tienda)
//                sí; el catálogo (catalogo) y cualquier página de producto, carrito o pago NO van aquí. En la Tienda el juego
//                queda siempre por debajo del carrito (botón 900, fondo 1099, cajón 1100) y no tapa sus botones.
//   objectMode   'random': cada partida reparte los 5 objetos del nivel 1 entre las páginas de objectPages, como máximo uno
//                por página (con 6 páginas, una se queda sin objeto). 'fixed': usa siempre el mapeo de objects.
//   objectPages  páginas que pueden tener objeto en modo 'random' (mínimo 5; deben estar también en pages).
//   objects      mapeo fijo página → objeto (solo con objectMode: 'fixed'). Objetos: cassette, microphone, candle, notebook,
//                medallion. Para usarlo: objectMode: 'fixed' y una página distinta para cada uno de los 5 objetos.
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
//   rewardLink   al abrir la caja se ve el contenido exclusivo dentro del juego (video de Alonso Ortiz + carrusel de fotos,
//                archivos en j1/assets/reward/). Si además pones aquí un destino, debajo del carrusel aparece el botón
//                "Ver contenido exclusivo de CHOLO" que lleva ahí ('#' = sin botón). Si es de otro dominio, abre en pestaña nueva.

export const version = '2026-10-28.1';

export const debug = false;

export const activeGame = 'j1';

export const games = {
  j1: {
    pages: ['index', 'estudio', 'proyectos', 'talento', 'contacto', 'tienda', 'alonso-ortiz'],
    objectMode: 'random',
    objectPages: ['index', 'estudio', 'proyectos', 'talento', 'contacto', 'tienda'],
    objects: {
      index: 'cassette',
      estudio: 'microphone',
      proyectos: 'notebook',
      talento: 'medallion',
      contacto: 'candle',
    },
    objectDelay: [0.5, 1],
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
      talento: [ // el hero ocupa una pantalla: casi todos los escondites van en el pie (hay que bajar)
        { anchor: '.talent-hero', x: 6, y: 98, size: 48, rotate: 24 },
        { anchor: '.foot', x: 95, y: 30, size: 48, rotate: 10 },
        { anchor: '.foot', x: 62, y: 78, size: 46, rotate: -14 },
        { anchor: '.foot', x: 77, y: 28, size: 46, rotate: 18 },
      ],
      contacto: [
        { anchor: '.contact-paths-band', x: 96, y: 93, size: 50, rotate: -22 },
        { anchor: '.form-band', x: 6, y: 92, size: 52, rotate: 14 },
        { anchor: '.home-closer', x: 93, y: 10, size: 50, rotate: 20 },
        { anchor: '.foot', x: 96, y: 34, size: 46, rotate: -12 },
      ],
      tienda: [ // igual que Talento: hero de una pantalla, el resto en el pie
        { anchor: '.shop-hero', x: 95, y: 98, size: 48, rotate: -16 },
        { anchor: '.foot', x: 60, y: 34, size: 46, rotate: 12 },
        { anchor: '.foot', x: 78, y: 28, size: 46, rotate: -20 },
        { anchor: '.foot', x: 96, y: 50, size: 46, rotate: 8 },
      ],
    },
    rewardLink: '#',
  },
};
