// Atajos de prueba del juego (config.js → debug). gate.js lo enciende al arrancar; con debug: false (producción) ninguno
// hace efecto: ni los parámetros de la URL ni los mensajes de consola.
let on = false;
export const setDebug = (v) => { on = v === true; };
export const isDebug = () => on;
// ?calidad=alta|baja|minima → 'high' | 'low' | 'minimal' (null sin debug o sin el parámetro)
export const forcedQuality = () => (on ? { alta: 'high', baja: 'low', minima: 'minimal' }[new URLSearchParams(location.search).get('calidad')] || null : null);
