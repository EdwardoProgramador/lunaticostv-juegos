// Textos ES/EN. Sigue el selector de idioma del sitio: script.js escribe <html lang> y
// dispara "ltv:languagechange" en document; aquí solo se lee, nunca se cambia el idioma.
const STR = {
  es: {
    hudLabel: 'Objetos del Cholo',
    collect: (name) => `Recolectar: ${name}`,
    title: 'Conseguiste los objetos del Cholo',
    cta: 'Ver contenido exclusivo',
    close: 'Cerrar',
    names: { cassette: 'Cassette', microphone: 'Micrófono', candle: 'Vela', notebook: 'Libreta', medallion: 'Medalla' },
  },
  en: {
    hudLabel: 'Cholo’s objects',
    collect: (name) => `Collect: ${name}`,
    title: 'You found the Cholo’s objects',
    cta: 'See exclusive content',
    close: 'Close',
    names: { cassette: 'Cassette', microphone: 'Microphone', candle: 'Candle', notebook: 'Notebook', medallion: 'Medallion' },
  },
};

export function lang() {
  const l = document.documentElement.lang;
  if (l === 'en' || l === 'es') return l;
  try { return localStorage.getItem('ltv-lang') === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; }
}

export const t = () => STR[lang()];

// fn() se llama cada vez que el usuario cambia de idioma. Devuelve la función para dejar de escuchar.
export function onLangChange(fn) {
  const h = () => fn(t());
  document.addEventListener('ltv:languagechange', h);
  return () => document.removeEventListener('ltv:languagechange', h);
}
