// Contenido variable de la temporada activa.
// Cambia este archivo para actualizar el hero sin tocar su estructura.
window.LTV_SEASON = {
  id: 'senal-naranja-2026',
  name: 'Señal naranja',
  interval: 7200,
  theme: {
    accent: '#ff5a1f',
    accentLight: '#ff9a62',
    accentHover: '#d94310',
    accentRgb: '255, 90, 31'
  },
  slides: [
    {
      type: 'season',
      label: { es: 'Temporada 01 · Señal naranja', en: 'Season 01 · Orange signal' },
      title: {
        es: 'Productora de contenido con <span class="accent">cabeza creativa</span>',
        en: 'Content production with a <span class="accent">creative spine</span>'
      },
      copy: {
        es: 'Películas, traducción cinematográfica, edición, web, identidad de marca y piezas con IA. Ideas propias y producción completa.',
        en: 'Film, cinematic translation, editing, web, brand identity and AI-driven work. Original ideas and full production.'
      },
      primary: { es: 'Platicar un proyecto', en: 'Start a conversation', href: '/contacto' },
      secondary: { es: 'Ver capacidades', en: 'See capabilities', href: '/estudio' },
      image: 'img/hero-season-orange.jpg'
    },
    {
      type: 'news',
      label: { es: 'Ya disponible · Película completa', en: 'Now streaming · Full film' },
      title: {
        es: 'El sueño se <span class="accent">cumplió</span>',
        en: 'The dream <span class="accent">came true</span>'
      },
      copy: {
        es: 'La película completa ya está disponible. Conoce la historia y mira el estreno oficial en YouTube.',
        en: 'The full film is now available. Discover the story and watch the official release on YouTube.'
      },
      primary: { es: 'Ver película', en: 'Watch film', href: 'https://www.youtube.com/watch?v=XUhC83s505s' },
      secondary: { es: 'Ver noticias', en: 'See news', href: '#noticias' },
      image: 'img/news-sueno-disponible.jpg'
    },
    {
      type: 'news',
      label: { es: 'Próximamente · Nueva historia', en: 'Coming soon · New story' },
      title: {
        es: 'Un nuevo mundo <span class="accent">comienza</span>',
        en: 'A new world <span class="accent">begins</span>'
      },
      copy: {
        es: 'Sigue todas las noticias, imágenes y actualizaciones de LunáticosTv en Instagram.',
        en: 'Follow every LunáticosTv update, image and announcement on Instagram.'
      },
      primary: { es: 'Seguir en Instagram', en: 'Follow on Instagram', href: 'https://www.instagram.com/oficial.lunaticos/' },
      secondary: { es: 'Ver teaser', en: 'Watch teaser', href: 'https://www.youtube.com/watch?v=SqasoWNdL8Y' },
      image: 'img/hero-new-world.jpg'
    },
    {
      type: 'shop',
      label: { es: 'Drop de temporada · Shop', en: 'Season drop · Shop' },
      title: {
        es: 'La nueva señal también se <span class="accent">puede llevar</span>',
        en: 'You can wear the <span class="accent">new signal</span>'
      },
      copy: {
        es: 'Piezas de LunáticosTv, lanzamientos limitados y objetos nacidos alrededor de nuestras historias.',
        en: 'LunáticosTv pieces, limited releases and objects born around our stories.'
      },
      primary: { es: 'Entrar a la tienda', en: 'Enter the shop', href: '/catalogo' },
      secondary: { es: 'Ver proyectos', en: 'See projects', href: '/proyectos' },
      image: 'img/tienda-shop.jpg'
    }
  ],
  news: [
    {
      category: { es: 'En rodaje', en: 'Now filming' },
      title: { es: 'Actualmente estamos grabando CHOLO', en: 'CHOLO is currently filming' },
      copy: {
        es: 'Todos ven al Cholo. Nadie conoce su historia. Sigue las imágenes, avances y noticias desde producción.',
        en: 'Everyone sees Cholo. Nobody knows his story. Follow images, previews and news from production.'
      },
      cta: { es: 'Seguir el rodaje', en: 'Follow production' },
      image: 'img/news-cholo-production.jpg',
      href: 'https://www.instagram.com/oficial.lunaticos/',
      featured: true
    },
    {
      category: { es: 'Próximamente', en: 'Coming soon' },
      title: { es: 'Un nuevo mundo comienza', en: 'A new world begins' },
      copy: {
        es: 'Mira el teaser con Alonso Ortiz y Memo Piña y descubre la siguiente señal.',
        en: 'Watch the teaser with Alonso Ortiz and Memo Piña and discover the next signal.'
      },
      cta: { es: 'Ver teaser', en: 'Watch teaser' },
      image: 'img/news-teaser.jpg',
      href: 'https://www.youtube.com/watch?v=SqasoWNdL8Y'
    },
    {
      category: { es: 'Detrás de cámaras', en: 'Behind the scenes' },
      title: { es: 'El sueño también tuvo bloopers', en: 'The dream had bloopers too' },
      copy: {
        es: 'Mira los momentos que no llegaron al corte final de El sueño se cumplió.',
        en: 'Watch the moments that did not make the final cut of The Dream Came True.'
      },
      cta: { es: 'Ver bloopers', en: 'Watch bloopers' },
      image: 'img/news-bloopers.jpg',
      href: 'https://www.youtube.com/watch?v=pXVVE1Ng2Bo'
    }
  ]
};
