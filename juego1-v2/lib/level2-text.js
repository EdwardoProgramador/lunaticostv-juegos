// Level 2 · El Cuarto del Cholo — every on-screen text (Spanish) and the puzzle data, in one list.
// To translate: copy TEXT, change the strings, keep the keys.
export const TEXT = {
  roomTitle: 'El Cuarto del Cholo',
  roomButton: 'El Cuarto del Cholo',
  roomButtonShort: 'El Cuarto',
  close: 'Cerrar',
  roomLoading: 'Encendiendo el cuarto',
  replay: 'Repetir',
  desktop: 'Escritorio',
  mobile: 'Móvil',
  view: 'Vista',
  state: 'Estado',
  states: 'Estados',
  quality: 'Calidad',
  qualityModes: ['Calidad: auto', 'Calidad: alta', 'Calidad: baja', 'Calidad: mínima'], // demo control on page 10
  qualityLevels: { high: 'alta', low: 'baja', minimal: 'mínima' },
  sizeOnWeb: 'Tamaño en la web',
  triangles: 'triángulos',

  hintGather: 'Reúne los objetos del Cholo',
  hintPlace: 'Coloca los objetos en el altar',
  hintPlaceTap: 'Toca un objeto y luego un lugar del altar',
  hintWrong: 'El altar rechaza ese orden',
  hintFragments: 'Encuentra los fragmentos',
  hintRotate: 'Gira los fragmentos hasta que su sombra encaje en el cuadro',
  hintTakeKey: 'Toma la llave',
  hintBox: 'Ve a la caja en Inicio',

  trayLabel: 'Objetos del Cholo',
  placeLabel: 'Lugar del altar',
  inventoryLabel: 'Inventario',
  keyName: 'Llave',
  clueTitle: 'Hoja de la libreta',
  clueLine: 'De la oscuridad a la luz',

  fragmentsHud: 'Fragmentos del cristal',
  fragment: 'Fragmento',
  fullShard: 'Cristal completo',

  locked: 'Cerrada',
  haveKey: 'Tengo la llave',
  revealTitle: 'Ver contenido exclusivo de CHOLO',
  revealButton: 'Entrar',
  boxLabel: 'Caja del Cholo',

  site: {
    logo: 'LunaticosTv',
    nav: ['Inicio', 'Películas', 'Detrás de cámaras', 'Contacto'],
    langs: ['ES', 'EN'],
    cta: 'Escríbenos',
    menu: 'Menú',
  },

  roomStates: ['Recién activado', 'Objetos listos', 'Después de la explosión', 'Fragmentos listos', 'Llave tomada'],
  buttonStates: { hidden: 'Oculto', appear: 'Aparecer', normal: 'Normal', new: 'Algo nuevo' },
  demo: {
    next: 'Recolectar siguiente', reset: 'Reiniciar', assembled: 'Ensamblado', exploded: 'Separado',
    glb: 'GLB', glbAll: 'GLB cristal completo', solve: 'Resolver', drag: 'Arrastra para girar',
  },

  pages: {
    '09': '09 · Completado 5/5 → El Cuarto del Cholo',
    10: '10 · El Cuarto del Cholo',
    11: '11 · Altar con orden',
    12: '12 · Hoja de la libreta',
    13: '13 · Fragmentos de cristal',
    14: '14 · Explosión de cristales',
    15: '15 · HUD de fragmentos',
    '16B': '16B · Puzzle de sombras — lunas',
    17: '17 · El cuadro y la llave',
    18: '18 · La caja y el final',
    19: '19 · Botón del cuarto',
  },
  notes: {
    13: 'Cristal ahumado y agrietado con las lunas gemelas, nubes y agua de la referencia. Marco de cobre con lunas y estrellas en los bordes exteriores; las grietas brillan en cobre. Cada fragmento se exporta por separado.',
    15: 'Oculto por defecto. Al recolectar un fragmento entra por arriba a la derecha (arriba al centro en móvil), la pieza nueva se enciende en cobre y ocupa su lugar en el cristal. Sale sola a los 3 segundos.',
  },
};

// Correct altar order, left → right, from the new moon to the full moon. Change here only.
export const ALTAR_ORDER = ['candle', 'notebook', 'cassette', 'microphone', 'medallion'];

// Moon phase drawn next to each object on the notebook page (0 = new … 1 = full) and on each altar place.
export const MOON_PHASE = { candle: 0, notebook: 0.22, cassette: 0.5, microphone: 0.76, medallion: 1 };
