// Juego 1 · Los objetos del Cholo — punto de entrada (lo importa juegos/boot.js).
import * as progress from './progress.js';

export async function start({ objectKey }) {
  const collected = progress.load();
  if (collected.includes(objectKey)) return;
}
