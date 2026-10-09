// LunáticosTv · juegos — configuración central.
//
// activeGame: 'j1' activa "Los objetos del Cholo". null = no se carga nada (el sitio queda como el original).
// pages:      página → objeto que flota en ella. Una página que no aparece aquí no tiene juego.
//             Objetos válidos: 'cassette', 'microphone', 'candle', 'notebook', 'medallion'.
// rewardLink: a dónde lleva el botón "Ver contenido exclusivo" al completar 5/5 ('#' = todavía sin destino).

export const activeGame = 'j1';

export const games = {
  j1: {
    pages: {
      index: 'cassette',
      estudio: 'microphone',
      proyectos: 'notebook',
      talento: 'medallion',
      contacto: 'candle',
    },
    rewardLink: '#',
  },
};
