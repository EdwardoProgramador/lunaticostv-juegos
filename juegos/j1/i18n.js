// Textos ES/EN de todo el juego (nivel 1 + nivel 2). Sigue el selector de idioma del sitio: script.js escribe
// <html lang> y dispara "ltv:languagechange" en document; aquí solo se lee, nunca se cambia el idioma.
// Las fuentes del juego no traen → ni ✓: no usarlos en estos textos.
const STR = {
  es: {
    activate: 'Activar el juego del Cholo', // también en gate.js (LABEL): cambiar en los dos
    hudLabel: 'Objetos del Cholo',
    collect: (name) => `Recolectar: ${name}`,
    got: 'conseguido',
    close: 'Cerrar',
    names: { cassette: 'Cassette', microphone: 'Micrófono', candle: 'Vela', notebook: 'Libreta', medallion: 'Medalla' },

    roomTitle: 'El Cuarto del Cholo',
    roomButton: 'El Cuarto del Cholo',
    roomButtonShort: 'El Cuarto',
    roomNew: 'hay algo nuevo',
    roomCallout: 'Vuelve al cuarto',
    roomLoading: 'Encendiendo el cuarto',

    hintGather: 'Reúne los objetos del Cholo',
    hintPlace: 'Coloca los objetos en el altar',
    hintPlaceTap: 'Toca un objeto y luego un lugar del altar',
    hintWrong: 'El altar rechaza ese orden',
    hintFragments: 'Encuentra los fragmentos',
    hintRotate: 'Gira los fragmentos hasta que su sombra encaje en el cuadro',
    hintRotateKeys: 'Arrastra o usa las flechas para girar los fragmentos',
    hintTakeKey: 'Toma la llave',
    hintBox: 'Ve a la caja en Inicio',
    hintDone: 'Abriste la caja del Cholo',

    // instrucciones de cada etapa (lib/notice.js)
    tipObjects: 'Encuentra los 5 objetos del Cholo en todas las ventanas de la página.',
    tipAltar: 'Coloca los objetos en el orden correcto. La libreta guarda la pista.',
    tipFragments: 'Navega por todas las ventanas de la página para encontrar los fragmentos escondidos.',
    tipRoom: 'Tienes los 5 fragmentos. Vuelve al Cuarto del Cholo para terminar.',
    tipPuzzle: 'Gira los fragmentos hasta que su sombra encaje en el cuadro.',
    tipBox: 'Ve a la caja en Inicio.',

    trayLabel: 'Objetos del Cholo',
    placeLabel: 'Lugar del altar',
    inventoryLabel: 'Inventario',
    keyName: 'Llave',
    clueTitle: 'Hoja de la libreta',
    clueLine: 'De la oscuridad a la luz',

    fragmentsHud: 'Fragmentos del cristal',
    fragment: 'Fragmento',
    pickFragment: 'Recoger fragmento del cristal',

    boxLabel: 'Caja del Cholo',
    locked: 'Cerrada',
    revealTitle: 'Abriste la caja del Cholo',
    revealButton: 'Ver contenido exclusivo de CHOLO',

    // contenido exclusivo al terminar (reward.js): video de Alonso Ortiz y carrusel de fotos
    rewardTitle: 'Contenido exclusivo de CHOLO',
    rewardSkip: 'Saltar video',
    rewardSound: 'Activar sonido',
    rewardPlay: 'Reproducir video',
    rewardPause: 'Pausar video',
    rewardReplay: 'Ver el video otra vez',
    rewardSwipe: 'Desliza para ver las fotos',
    rewardPrev: 'Foto anterior',
    rewardNext: 'Foto siguiente',
    rewardPhoto: (n, total) => `Foto ${n} de ${total}`,
  },
  en: {
    activate: 'Start the Cholo game',
    hudLabel: 'Cholo’s objects',
    collect: (name) => `Collect: ${name}`,
    got: 'collected',
    close: 'Close',
    names: { cassette: 'Cassette', microphone: 'Microphone', candle: 'Candle', notebook: 'Notebook', medallion: 'Medallion' },

    roomTitle: 'Cholo’s Room',
    roomButton: 'Cholo’s Room',
    roomButtonShort: 'Room',
    roomNew: 'something new',
    roomCallout: 'Back to the room',
    roomLoading: 'Lighting the room',

    hintGather: 'Gather the Cholo’s objects',
    hintPlace: 'Place the objects on the altar',
    hintPlaceTap: 'Tap an object, then a place on the altar',
    hintWrong: 'The altar rejects that order',
    hintFragments: 'Find the fragments',
    hintRotate: 'Turn the fragments until their shadow fits the painting',
    hintRotateKeys: 'Drag or use the arrow keys to turn the fragments',
    hintTakeKey: 'Take the key',
    hintBox: 'Go to the box on the Home page',
    hintDone: 'You opened Cholo’s box',

    tipObjects: 'Find Cholo’s 5 objects in every window of the site.',
    tipAltar: 'Place the objects in the right order. The notebook holds the clue.',
    tipFragments: 'Browse every window of the site to find the hidden fragments.',
    tipRoom: 'You have all 5 fragments. Go back to Cholo’s Room to finish.',
    tipPuzzle: 'Turn the fragments until their shadow fits the painting.',
    tipBox: 'Go to the box on the Home page.',

    trayLabel: 'Cholo’s objects',
    placeLabel: 'Altar place',
    inventoryLabel: 'Inventory',
    keyName: 'Key',
    clueTitle: 'Notebook page',
    clueLine: 'From darkness to light',

    fragmentsHud: 'Crystal fragments',
    fragment: 'Fragment',
    pickFragment: 'Pick up crystal fragment',

    boxLabel: 'Cholo’s box',
    locked: 'Locked',
    revealTitle: 'You opened Cholo’s box',
    revealButton: 'See exclusive CHOLO content',

    rewardTitle: 'Exclusive CHOLO content',
    rewardSkip: 'Skip video',
    rewardSound: 'Turn sound on',
    rewardPlay: 'Play video',
    rewardPause: 'Pause video',
    rewardReplay: 'Watch the video again',
    rewardSwipe: 'Swipe to see the photos',
    rewardPrev: 'Previous photo',
    rewardNext: 'Next photo',
    rewardPhoto: (n, total) => `Photo ${n} of ${total}`,
  },
};

export function lang() {
  const l = document.documentElement.lang;
  if (l === 'en' || l === 'es') return l;
  try { return localStorage.getItem('ltv-lang') === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; }
}

export const t = () => STR[lang()];

// fn(t()) se llama cada vez que el usuario cambia de idioma. Devuelve la función para dejar de escuchar.
export function onLangChange(fn) {
  const h = () => fn(t());
  document.addEventListener('ltv:languagechange', h);
  return () => document.removeEventListener('ltv:languagechange', h);
}

// Texto vivo: escribe t()[key] en el elemento (o en un atributo) ahora y en cada cambio de idioma.
// Los elementos que ya no están en el documento se olvidan solos.
const bound = new Map();
let listening = false;
function paint(el, { key, attr, fn }) {
  const v = fn ? fn(t()) : t()[key];
  if (attr) el.setAttribute(attr, v);
  else { el.textContent = v; if (el.hasAttribute('data-text')) el.setAttribute('data-text', v); }
}
export function bindText(el, key, attr = null) {
  if (!el) return el;
  const spec = typeof key === 'function' ? { fn: key, attr } : { key, attr };
  const list = bound.get(el) || [];
  list.push(spec); bound.set(el, list); paint(el, spec);
  if (!listening) {
    listening = true;
    onLangChange(() => {
      for (const [node, specs] of bound) {
        if (!node.isConnected && !node.__lj1Keep) { bound.delete(node); continue; }
        specs.forEach((s) => paint(node, s));
      }
    });
  }
  return el;
}
