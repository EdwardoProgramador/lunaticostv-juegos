// LunáticosTv · juegos — configuración central.
//
// activeGame: 'j1' activa "Los objetos del Cholo". null = no se carga nada (el sitio queda como el original).
// pages:      páginas donde aparecen objetos. Cualquier objeto que falte puede salir en cualquiera de ellas
//             (rotan: si no lo recolectas, se va y llega otro). Una página que no está aquí no tiene juego.
// timing:     segundos [mínimo, máximo]; cada vez se elige un valor al azar dentro del rango.
//               firstAppear   espera desde que la página está lista hasta que aparece el primer objeto
//               visibleFor    cuánto se queda un objeto en pantalla si nadie lo recolecta
//               pauseBetween  pausa entre que se va un objeto y llega el siguiente
//               afterCollect  pausa entre recolectar uno y que aparezca otro en la misma página
//             Solo cuenta el tiempo con la pestaña visible.
// rewardLink: a dónde lleva el botón "Ver contenido exclusivo" al completar 5/5 ('#' = todavía sin destino).

export const activeGame = 'j1';

export const games = {
  j1: {
    pages: ['index', 'estudio', 'proyectos', 'talento', 'contacto', 'alonso-ortiz', 'tienda', 'catalogo'],
    timing: {
      firstAppear: [3, 6],
      visibleFor: [25, 35],
      pauseBetween: [8, 14],
      afterCollect: [12, 20],
    },
    rewardLink: '#',
  },
};
