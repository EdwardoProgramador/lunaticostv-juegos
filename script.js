// LunáticosTv — nav, tienda, imágenes, filtros, contacto, idioma ES/EN

(function () {
  const LTV_EMAIL = 'contacto@lunaticostv.com';
  const shopUrl = typeof window.LTV_SHOP_URL === 'string' ? window.LTV_SHOP_URL.trim() : '';
  const shopOk = /^https?:\/\//i.test(shopUrl);

  document.querySelectorAll('a.ltv-shop-link').forEach((a) => {
    if (shopOk) {
      a.href = shopUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else {
      a.href =
        'mailto:' + LTV_EMAIL + '?subject=' + encodeURIComponent('LunáticosTv — interés en la tienda');
    }
  });

  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.style.visibility = 'hidden';
      const wrap = img.parentElement;
      if (wrap) wrap.classList.add('img-missing');
    });
  });

  const STR = {
    es: {
      nav_home: 'Inicio',
      nav_studio: 'Estudio',
      nav_projects: 'Proyectos',
      nav_talent: 'Talento',
      nav_contact: 'Contacto',
      nav_shop: 'Tienda',
      btn_talk: 'Escríbenos',
      btn_write: 'Escribir',
      doc_index: 'LunáticosTv — productora creativa',
      doc_studio: 'Estudio — LunáticosTv',
      doc_projects: 'Proyectos — LunáticosTv',
      doc_contact: 'Contacto — LunáticosTv',
      doc_shop: 'Tienda — LunáticosTv',
      doc_talent: 'Talento — LunáticosTv',
      talent_k: 'Representación',
      talent_h: 'Talento LunáticosTv',
      talent_p: 'Las personas que representamos. Un solo lugar para conocer el roster y empezar la conversación.',
      talent_b1: 'Contáctanos',
      talent_b2: 'Ver talentos',
      talent_b2_open: 'Ocultar roster',
      idx_talent_n: 'Por anunciar',
      idx_talent_r: 'Talento representado',
      ao_role: 'Música · Cine',
      doc_ao: 'Alonso Ortiz — Talento LunáticosTv',
      ao_back: 'Talento',
      ao_k: 'Música · Cine',
      ao_line: 'Canta corridos y regional mexicano, y protagoniza las películas que el público ve completas en YouTube. Dieciocho películas, una canción con la luna y una comunidad que no deja de crecer.',
      ao_cta: 'Trabaja con Alonso Ortiz',
      ao_go_film: 'Ver sus películas',
      ao_go_music: 'Escuchar',
      ao_still: 'Fotograma',
      ao_fig_h: 'Alonso en números',
      ao_fig1: 'Vistas de sus películas en YouTube',
      ao_fig2: 'Platicando con la Luna en YouTube',
      ao_fig3: 'Seguidores en TikTok',
      ao_fig4: 'Oyentes mensuales en Spotify',
      ao_fig5: 'Seguidores en Instagram',
      ao_fig6: 'Suscriptores en YouTube',
      ao_fig_src: 'Cifras públicas de YouTube, Spotify, TikTok e Instagram, octubre de 2026.',
      ao_two_m: 'La música',
      ao_two_mp: 'Más de 29 lanzamientos desde 2020: corridos, románticas y colaboraciones con Ysrael Barajas, Gabriel Ssoe y Virlan García.',
      ao_two_f: 'El cine',
      ao_two_fp: 'Dieciocho películas completas desde 2022, de Los Envidiosos a El sueño se cumplió, su película más personal.',
      ao_luna_k: 'Su canción más escuchada',
      ao_luna_views: 'reproducciones en YouTube entre el video con letra y el audio oficial',
      ao_luna_yt: 'Ver el video con letra',
      ao_m_k: 'Música',
      ao_m_h: 'Más canciones',
      ao_video: 'Video oficial',
      ao_lyric: 'Video con letra',
      ao_tracks_note: 'Vistas en YouTube.',
      ao_film_k: 'Cine · Estreno 2026',
      ao_film_credit: 'Una película de Alonso Ortiz. Con Ysrael Barajas, Memo Piña, Marivic Cárdenas y Crecer Germán.',
      ao_film_p: 'Ortiz es un joven cansado de sentirse estancado y de decepcionar a quienes lo rodean. ¿Hasta dónde llegarías para cumplir tu sueño?',
      ao_film_f1: 'vistas en siete semanas',
      ao_film_f2: 'minutos',
      ao_film_b1: 'Ver la película',
      ao_film_b2: 'Ver el tráiler',
      ao_filmo_k: 'Filmografía',
      ao_filmo_h: '18 películas, 180 millones de vistas',
      ao_filmo_p: 'Todas completas y gratis en YouTube. Ordenadas de la más reciente a la primera.',
      ao_next_k: 'Próximamente',
      ao_next_t: 'Un nuevo mundo comienza, con Alonso Ortiz y Memo Piña',
      ao_next_b: 'Ver teaser',
      ao_portrait: 'Retrato',
      ao_r_k: 'Redes',
      ao_r_h: 'Dónde seguirlo',
      ao_monthly: 'oyentes mensuales',
      ao_c_k: 'Booking y colaboraciones',
      ao_c_h: '¿Alonso en tu próximo proyecto?',
      ao_c_p: 'Shows, colaboraciones musicales, campañas y cine. La representación es a través de LunáticosTv.',
      idx_hero_k: 'Proyecto · México · Tijuana',
      idx_hero_h: 'Productora de contenido con <span class="accent">cabeza creativa</span>',
      idx_hero_p:
        'Películas, traducción cinematográfica, edición, web, identidad de marca y piezas con IA. Proyectos propios y producción para quien quiera rodar con equipo y equipo completo.',
      idx_hero_a1: 'Platicar un proyecto',
      idx_hero_a2: 'Ver capacidades',
      idx_bridge:
        'Cine, traducción, web y marca en un mismo tejido.<br>No vendemos palabras vacías: el trabajo y la forma de contarlo hablan solos.<br><strong>Buscamos alianzas con quien quiera otra mirada al cine mexicano.</strong>',
      idx_quote_q: 'La ventaja no es tener más cámaras. <strong>Es saber qué historia merece existir.</strong>',
      idx_quote_lead: 'LunáticosTv es el lugar donde eso se diseña, se rueda y se entrega.',
      idx_l1: 'Un mismo lugar para <strong>cine, traducción audiovisual y piezas digitales</strong>.',
      idx_l2: 'Proyectos propios y producción para terceros con el mismo cuidado visual.',
      idx_l3: 'Experimentos con IA cuando el concepto lo amerita — nunca como relleno.',
      idx_cap_link: 'Ver capacidades',
      idx_work_deck: 'Placeholders hasta tener pósters finales. Sustituye poster-01.jpg … poster-06.png en img/.',
      idx_p1: 'Pieza en escritura',
      idx_p2: 'Pieza en rodaje',
      idx_p3: 'Pieza en post',
      idx_p4: 'Proyecto',
      idx_p5: 'Proyecto',
      idx_p6: 'Proyecto',
      idx_closer_q: '¿Listo para empezar?<br><strong>Platicamos tu proyecto.</strong>',
      idx_closer_p: 'Brief, calendario tentativo y referencias. Respondemos en menos de 48 horas hábiles.',
      idx_closer_a: 'contacto@lunaticostv.com',
      idx_cities: 'México · Tijuana · Remoto',
      idx_f_k: 'Qué somos',
      idx_f_h: 'Un mismo lugar para varias disciplinas',
      idx_f_p:
        'No vendemos la palabra “disruptivo”: la idea es que al ver el trabajo y la forma de contarlo, quede claro. Buscamos alianzas con marcas y con quien quiera impulsar cine independiente mexicano con otra mirada.',
      idx_c1t: 'Cine y narrativas',
      idx_c1p: 'Largometrajes, piezas seriadas y formatos que requieran cámara, sonido y post serios.',
      idx_c2t: 'Traducción y piezas audiovisuales',
      idx_c2p: 'Adaptación y traducción orientadas a cine; edición de video para campañas y redes.',
      idx_c3t: 'Web, marca y laboratorio',
      idx_c3p: 'Sitios, identidad visual y experimentos con IA cuando el concepto lo amerita.',
      idx_st_h: 'Estudio, obra y tienda',
      idx_st_p: 'Cada bloque tiene su página. La tienda vive aparte, con el mismo cuidado visual.',
      idx_st_b1: 'Ver estudio',
      idx_st_b2: 'Ver proyectos',
      idx_talent_k: '03 · Talento',
      idx_talent_h: 'A quienes <span class="accent">representamos</span>',
      idx_talent_p: 'El roster de LunáticosTv. Aquí van las personas que representamos: retrato, nombre y disciplina.',
      idx_team_k: 'Equipo',
      idx_team_h: 'Quién hace que esto exista',
      idx_team_p: 'Fotos de placeholder: sustituye por retratos reales cuando tengas sesión hecha.',
      idx_t1n: 'Nombre',
      idx_t1r: 'Rol · placeholder',
      idx_t2n: 'Nombre',
      idx_t2r: 'Rol · placeholder',
      idx_t3n: 'Nombre',
      idx_t3r: 'Rol · placeholder',
      foot_tag:
        'LunáticosTv es un proyecto creativo con base de operaciones en México; Tijuana es parte de la historia que queremos contar.',
      foot_col_site: 'Sitio',
      foot_col_mail: 'Correo',
      foot_col_shop: 'Tienda',
      foot_col_social: 'Social',
      est_h1: '<span class="accent">Capacidades</span> del taller',
      est_lead:
        'De la idea a la entrega: cine, servicios audiovisuales, web y marca. Puedes traer tu proyecto o sumarte a los nuestros.',
      est_sk: 'Mapa de servicios',
      est_sh: 'Lo que podemos hacer contigo',
      est_sp: 'Si falta algo en la lista, pregunta: el menú crece con los proyectos.',
      est_p1t: 'Películas',
      est_p1p: 'Producción propia o para terceros: desarrollo, rodaje, post y masters.',
      est_p2t: 'Traducción para cine',
      est_p2p: 'Adaptación y traducción audiovisual con criterio de exhibición y festival.',
      est_p3t: 'Edición de video',
      est_p3p: 'Offline, online, piezas para redes y versiones por plataforma.',
      est_p4t: 'Sitios web',
      est_p4p: 'Páginas y experiencias digitales alineadas a la identidad del proyecto.',
      est_p5t: 'Identidad de marca',
      est_p5p: 'Sistemas visuales y narrativa gráfica para estudios y campañas.',
      est_p6t: 'Cine con IA',
      est_p6p: 'Cuando el concepto lo pide: piezas y pruebas con flujos creativos con IA.',
      est_p7t: 'Tu película, nuestro equipo',
      est_p7p: 'Material humano y técnico para producir lo que ya llevas escrito o en preproducción.',
      est_p8t: 'Equipo completo',
      est_p8p: 'Cámara, sonido, luces, post y producción ejecutiva bajo un mismo techo.',
      est_proc_k: 'Proceso',
      est_proc_h: 'Cuatro fases, sin sorpresas',
      est_proc_p: 'Sabes qué toca en cada etapa y qué necesitamos de tu lado.',
      est_faq_k: 'FAQ',
      est_faq_h: 'Preguntas frecuentes',
      est_f1q: '¿Solo cine o también comercial?',
      est_f1a: 'Ambos: ficción, documental, branded y piezas web. Lo acotamos en la propuesta.',
      est_f2q: '¿Dónde operan?',
      est_f2a: 'México, con foco creativo en narrativas desde Tijuana y rutas con CDMX y foráneo según proyecto.',
      est_f3q: '¿Qué mandan para cotizar?',
      est_f3a: 'Referencias, duración tentativa, fecha deseada y un párrafo de objetivo.',
      est_f4q: '¿La tienda es oficial?',
      est_f4a: 'Sí: merch y producto físico están en nuestra tienda oficial. Aquí no hay catálogo OTT.',
      est_st1t: 'Descubrimiento',
      est_st1p: 'Brief, objetivo y supuestos. Alineamos tono, alcance y calendario tentativo.',
      est_st2t: 'Propuesta',
      est_st2p: 'Alcance por escrito, hitos y responsables. Acuerdos antes de set cuando aplique.',
      est_st3t: 'Producción',
      est_st3p: 'Rodaje, post o entregas parciales con revisiones en fechas acordadas.',
      est_st4t: 'Entrega',
      est_st4p: 'Masters, adaptaciones y cierre del ciclo con tu equipo o distribuidor.',
      est_closer_q: 'Del taller a tu mesa.<br><strong>Escríbenos con tu brief.</strong>',
      est_closer_p: 'Fechas tentativas y referencias. Respondemos en menos de 48 horas hábiles.',
      est_closer_a: 'contacto@lunaticostv.com',
      est_cta_h: '¿Siguiente paso?',
      est_cta_p: 'Manda brief y calendario tentativo desde contacto.',
      est_cta_b: 'Ir a contacto',
      pr_hero_k: 'Obra',
      pr_hero_h: 'Lo que estamos <span class="accent">rodando</span>',
      pr_hero_p:
        'No publicamos catálogo. Aquí solo aparece la obra que está viva: en escritura, en rodaje o en post.',
      pr_pipe1_t: 'Escritura',
      pr_pipe1_s: 'Guion, tono y estructura antes de preproducción.',
      pr_pipe2_t: 'Rodaje',
      pr_pipe2_s: 'Captura en set con equipo y calendario acordado.',
      pr_pipe3_t: 'Post',
      pr_pipe3_s: 'Montaje, color y entrega para estreno o festival.',
      pr_hero_a1: 'Platicar un proyecto',
      pr_hero_a2: 'Ver estudio',
      pr_sp_k: 'Destacado',
      pr_sp_h: 'Formato de presentación',
      pr_sp_tag1: 'Ejemplo',
      pr_sp_tag2: 'Key visual',
      pr_sp_t: 'Pieza principal (placeholder)',
      pr_sp_p: 'Aquí irá un still o key art de un proyecto real cuando lo tengas listo para mostrar.',
      pr_sp_m: 'Aspecto 16:9 · imagen de prueba',
      pr_r1t: 'Bloque secundario A',
      pr_r1p: 'Placeholder de carta horizontal para campaña o largo.',
      pr_r2t: 'Bloque secundario B',
      pr_r2p: 'Placeholder de pieza vertical o serializada.',
      pr_cat_k: 'Rejilla',
      pr_cat_h: 'Espacios para portada',
      pr_cat_p: 'Seis huecos con filtros por tipo de entrega. Nombres genéricos hasta tener OK de prensa.',
      pr_f1: 'Todo',
      pr_f2: 'Cine',
      pr_f3: 'Video',
      pr_f4: 'Web',
      pr_f5: 'Marca',
      pr_s1: 'OUT NOW',
      pr_s2: 'En rodaje',
      pr_s3: 'Próximamente',
      pr_ph1k: 'Cine · ejemplo',
      pr_ph1t: 'Placeholder 01',
      pr_ph2k: 'Cine · ejemplo',
      pr_ph2t: 'Placeholder 02',
      pr_ph3k: 'Video · ejemplo',
      pr_ph3t: 'Placeholder 03',
      pr_ph4k: 'Web · ejemplo',
      pr_ph4t: 'Placeholder 04',
      pr_ph5k: 'Marca · ejemplo',
      pr_ph5t: 'Placeholder 05',
      pr_ph6k: 'Cine · ejemplo',
      pr_ph6t: 'Placeholder 06',
      pr_strip_h: '¿Colaboración o servicio?',
      pr_strip_p: 'Cuéntanos qué necesitas: producción, post, web o marca.',
      pr_strip_b: 'Contacto',
      co_hero_k: 'Contacto',
      co_hero_h: 'Hablemos de tu <span class="accent">proyecto</span>',
      co_hero_p:
        'Marcas, coproductores, prensa o equipos que necesiten manos. Escríbenos a <strong>contacto@lunaticostv.com</strong>.',
      co_hero_a1: 'Enviar correo',
      co_hero_a2: 'Ver formulario',
      co_paths_deck: 'Un solo correo para todo. Indica en el asunto si es proyecto o prensa.',
      co_closer_q: 'Tu proyecto empieza con<br><strong>un solo correo.</strong>',
      co_closer_p: 'Brief, calendario tentativo y referencias. Sin formularios raros: escribes y respondemos.',
      co_closer_a: 'contacto@lunaticostv.com',
      co_g_k: 'General',
      co_g_h: 'Correo del proyecto',
      co_g_p: 'Brief, fechas tentativas y referencias.',
      co_g_b: 'contacto@lunaticostv.com',
      co_g_li1: 'Marcas, coproducción y equipos que buscan producir o postear.',
      co_g_li2: 'Proyectos propios: condiciones según la etapa del desarrollo.',
      co_pr_k: 'Prensa',
      co_pr_h: 'Kit y stills',
      co_pr_p: 'Materiales cuando haya título público.',
      co_pr_b: 'contacto@lunaticostv.com',
      co_pr_li1: 'Festivales y notas cuando haya título público.',
      co_pr_li2: 'Entrevistas coordinadas con producción.',
      co_shop_hint: 'Tienda y merch:',
      co_f_k: 'Formulario',
      co_f_h: 'Resumen',
      co_f_p: 'Genera un borrador en tu app de correo (no guardamos nada en servidor).',
      co_f_name: 'Nombre',
      co_f_email: 'Correo',
      co_f_msg: 'Mensaje',
      co_f_note:
        'Al enviar se abre mailto: con este texto. Para la tienda visita la página Tienda o configura window.LTV_SHOP_URL.',
      co_f_submit: 'Abrir correo',
      shop_hero_h: 'La tienda <span class="cholo-strike" data-spray>LunáticosTv<span class="cholo-strike__new" aria-hidden="true">del Cholo</span></span>',
      shop_hero_p: 'Merch oficial con la marca en la prenda. Compra segura y envíos a todo México.',
      shop_b1: 'Ver productos',
      shop_b2: 'Edición especial',
    },
    en: {
      nav_home: 'Home',
      nav_studio: 'Studio',
      nav_projects: 'Projects',
      nav_talent: 'Talent',
      nav_contact: 'Contact',
      nav_shop: 'Shop',
      btn_talk: 'Get in touch',
      btn_write: 'Email us',
      doc_index: 'LunáticosTv — creative production',
      doc_studio: 'Studio — LunáticosTv',
      doc_projects: 'Projects — LunáticosTv',
      doc_contact: 'Contact — LunáticosTv',
      doc_shop: 'Shop — LunáticosTv',
      doc_talent: 'Talent — LunáticosTv',
      talent_k: 'Representation',
      talent_h: 'LunáticosTv Talent',
      talent_p: 'The people we represent. One place to browse the roster and start the conversation.',
      talent_b1: 'Contact us',
      talent_b2: 'View talent',
      talent_b2_open: 'Hide roster',
      idx_talent_n: 'To be announced',
      idx_talent_r: 'Represented talent',
      ao_role: 'Music · Film',
      doc_ao: 'Alonso Ortiz — LunáticosTv Talent',
      ao_back: 'Talent',
      ao_k: 'Music · Film',
      ao_line: 'He sings corridos and regional Mexican music, and stars in the films audiences watch in full on YouTube. Eighteen films, one song with the moon and a community that keeps growing.',
      ao_cta: 'Work with Alonso Ortiz',
      ao_go_film: 'See his films',
      ao_go_music: 'Listen',
      ao_still: 'Film still',
      ao_fig_h: 'Alonso by the numbers',
      ao_fig1: 'YouTube views of his films',
      ao_fig2: 'Platicando con la Luna on YouTube',
      ao_fig3: 'TikTok followers',
      ao_fig4: 'Monthly listeners on Spotify',
      ao_fig5: 'Instagram followers',
      ao_fig6: 'YouTube subscribers',
      ao_fig_src: 'Public YouTube, Spotify, TikTok and Instagram figures, October 2026.',
      ao_two_m: 'The music',
      ao_two_mp: 'More than 29 releases since 2020: corridos, love songs and collaborations with Ysrael Barajas, Gabriel Ssoe and Virlan García.',
      ao_two_f: 'The films',
      ao_two_fp: 'Eighteen full-length films since 2022, from Los Envidiosos to El sueño se cumplió, his most personal film.',
      ao_luna_k: 'His most played song',
      ao_luna_views: 'YouTube plays across the lyric video and the official audio',
      ao_luna_yt: 'Watch the lyric video',
      ao_m_k: 'Music',
      ao_m_h: 'More songs',
      ao_video: 'Official video',
      ao_lyric: 'Lyric video',
      ao_tracks_note: 'YouTube views.',
      ao_film_k: 'Film · 2026 release',
      ao_film_credit: 'A film by Alonso Ortiz. With Ysrael Barajas, Memo Piña, Marivic Cárdenas and Crecer Germán.',
      ao_film_p: 'Ortiz is a young man tired of feeling stuck and of letting down the people around him. How far would you go to make your dream come true?',
      ao_film_f1: 'views in seven weeks',
      ao_film_f2: 'minutes',
      ao_film_b1: 'Watch the film',
      ao_film_b2: 'Watch the trailer',
      ao_filmo_k: 'Filmography',
      ao_filmo_h: '18 films, 180 million views',
      ao_filmo_p: 'All free and in full on YouTube. Listed from newest to first.',
      ao_next_k: 'Coming soon',
      ao_next_t: 'A new world begins, with Alonso Ortiz and Memo Piña',
      ao_next_b: 'Watch teaser',
      ao_portrait: 'Portrait',
      ao_r_k: 'Social',
      ao_r_h: 'Where to follow him',
      ao_monthly: 'monthly listeners',
      ao_c_k: 'Booking and collaborations',
      ao_c_h: 'Alonso on your next project?',
      ao_c_p: 'Shows, music collaborations, campaigns and film. Representation is handled by LunáticosTv.',
      idx_hero_k: 'Project · Mexico · Tijuana',
      idx_hero_h: 'Content production with a <span class="accent">creative spine</span>',
      idx_hero_p:
        'Film, cinematic translation, editing, web, brand identity and AI-driven pieces when it fits. Our own slate and full production for your project — crew and gear included.',
      idx_hero_a1: 'Start a conversation',
      idx_hero_a2: 'See capabilities',
      idx_bridge:
        'Film, translation, web and brand in one weave.<br>We do not sell empty words: the work and how we frame it speak for themselves.<br><strong>We seek partners who want a different lens on Mexican cinema.</strong>',
      idx_quote_q: 'The edge is not more cameras. <strong>It is knowing which story deserves to exist.</strong>',
      idx_quote_lead: 'LunáticosTv is where that gets designed, shot and delivered.',
      idx_l1: 'One place for <strong>film, audiovisual translation and digital pieces</strong>.',
      idx_l2: 'Own projects and production for others with the same visual care.',
      idx_l3: 'AI experiments when the concept calls for it — never as filler.',
      idx_cap_link: 'See capabilities',
      idx_work_deck: 'Placeholders until final posters land. Replace poster-01.jpg … poster-06.png in img/.',
      idx_p1: 'In writing',
      idx_p2: 'In production',
      idx_p3: 'In post',
      idx_p4: 'Project',
      idx_p5: 'Project',
      idx_p6: 'Project',
      idx_closer_q: 'Ready to start?<br><strong>Let’s talk about your project.</strong>',
      idx_closer_p: 'Brief, tentative dates and references. We reply within two business days.',
      idx_closer_a: 'contacto@lunaticostv.com',
      idx_cities: 'Mexico · Tijuana · Remote',
      idx_f_k: 'What we are',
      idx_f_h: 'One roof, several crafts',
      idx_f_p:
        'We will not brag about being “disruptive”: we would rather let the work and how we tell it do the talking. We like brands and partners who want bold independent Mexican stories.',
      idx_c1t: 'Film and story',
      idx_c1p: 'Features, series and formats that need real camera, sound and post.',
      idx_c2t: 'Translation and moving image',
      idx_c2p: 'Film-minded translation and adaptation; video editing for campaigns and social.',
      idx_c3t: 'Web, brand and lab',
      idx_c3p: 'Sites, identity systems and AI-assisted experiments when the idea calls for it.',
      idx_st_h: 'Studio, work and shop',
      idx_st_p: 'Each theme has its page. The shop lives on its own channel with the same visual care.',
      idx_st_b1: 'Open studio',
      idx_st_b2: 'Open projects',
      idx_talent_k: '03 · Talent',
      idx_talent_h: 'The people <span class="accent">we represent</span>',
      idx_talent_p: 'The LunáticosTv roster. This is where the people we represent will live: portrait, name and discipline.',
      idx_team_k: 'Team',
      idx_team_h: 'The people behind it',
      idx_team_p: 'Placeholder portraits — swap for real photos after a shoot.',
      idx_t1n: 'Name',
      idx_t1r: 'Role · placeholder',
      idx_t2n: 'Name',
      idx_t2r: 'Role · placeholder',
      idx_t3n: 'Name',
      idx_t3r: 'Role · placeholder',
      foot_tag:
        'LunáticosTv is a creative project based in Mexico; Tijuana is part of the story we want to tell.',
      foot_col_site: 'Site',
      foot_col_mail: 'Email',
      foot_col_shop: 'Shop',
      foot_col_social: 'Social',
      est_h1: 'Studio <span class="accent">capabilities</span>',
      est_lead:
        'From idea to delivery: film, audiovisual services, web and brand. Bring your project or join ours.',
      est_sk: 'Service map',
      est_sh: 'What we can do with you',
      est_sp: 'If something is missing, ask — the menu grows with the work.',
      est_p1t: 'Films',
      est_p1p: 'In-house or for clients: development, shoot, post and masters.',
      est_p2t: 'Film translation',
      est_p2p: 'Adaptation and translation with exhibition and festival sense.',
      est_p3t: 'Video editing',
      est_p3p: 'Offline, online, social cuts and platform versions.',
      est_p4t: 'Websites',
      est_p4p: 'Sites and digital experiences aligned with the project identity.',
      est_p5t: 'Brand identity',
      est_p5p: 'Visual systems and graphic narrative for studios and campaigns.',
      est_p6t: 'AI-assisted cinema',
      est_p6p: 'When the concept asks for it: pieces and tests with creative AI workflows.',
      est_p7t: 'Your film, our crew',
      est_p7p: 'Human and technical capacity for what you already have in script or prep.',
      est_p8t: 'Full kit',
      est_p8p: 'Camera, sound, lighting, post and executive production under one roof.',
      est_proc_k: 'Process',
      est_proc_h: 'Four clear phases',
      est_proc_p: 'You know what happens when and what we need from you.',
      est_faq_k: 'FAQ',
      est_faq_h: 'Common questions',
      est_f1q: 'Only film or also commercial?',
      est_f1a: 'Both: fiction, documentary, branded and web pieces. We scope it in the proposal.',
      est_f2q: 'Where do you work?',
      est_f2a: 'Mexico, with creative focus from Tijuana and routes through CDMX and beyond as needed.',
      est_f3q: 'What do you need to quote?',
      est_f3a: 'References, rough duration, target date and a short objective paragraph.',
      est_f4q: 'Is the shop official?',
      est_f4a: 'Yes: merch and physical goods are in our official store. No OTT catalogue here.',
      est_st1t: 'Discovery',
      est_st1p: 'Brief, goals and assumptions. We align tone, scope and a tentative schedule.',
      est_st2t: 'Proposal',
      est_st2p: 'Written scope, milestones and owners. Agreements before set when needed.',
      est_st3t: 'Production',
      est_st3p: 'Shoot, post or partial deliveries with reviews on agreed dates.',
      est_st4t: 'Delivery',
      est_st4p: 'Masters, adaptations and cycle closeout with your team or distributor.',
      est_closer_q: 'From the studio to your desk.<br><strong>Send us your brief.</strong>',
      est_closer_p: 'Tentative dates and references. We reply within two business days.',
      est_closer_a: 'contacto@lunaticostv.com',
      est_cta_h: 'Next step?',
      est_cta_p: 'Send a brief and a tentative calendar from contact.',
      est_cta_b: 'Go to contact',
      pr_hero_k: 'Work',
      pr_hero_h: 'What we are <span class="accent">shooting</span>',
      pr_hero_p:
        'No full catalogue here — only work that is live: in writing, on set or in post.',
      pr_pipe1_t: 'Writing',
      pr_pipe1_s: 'Script, tone and structure before pre-production.',
      pr_pipe2_t: 'Shoot',
      pr_pipe2_s: 'On-set capture with crew and an agreed schedule.',
      pr_pipe3_t: 'Post',
      pr_pipe3_s: 'Edit, grade and delivery for premiere or festival.',
      pr_hero_a1: 'Start a project',
      pr_hero_a2: 'Studio',
      pr_sp_k: 'Spotlight',
      pr_sp_h: 'Presentation format',
      pr_sp_tag1: 'Sample',
      pr_sp_tag2: 'Key visual',
      pr_sp_t: 'Main tile (placeholder)',
      pr_sp_p: 'A real still or key art will live here when you are ready to publish it.',
      pr_sp_m: '16:9 layout · test image',
      pr_r1t: 'Secondary block A',
      pr_r1p: 'Horizontal card placeholder for campaign or feature.',
      pr_r2t: 'Secondary block B',
      pr_r2p: 'Vertical or serialized piece placeholder.',
      pr_cat_k: 'Grid',
      pr_cat_h: 'Cover slots',
      pr_cat_p: 'Six slots with filters by delivery type. Generic labels until press OK.',
      pr_f1: 'All',
      pr_f2: 'Film',
      pr_f3: 'Video',
      pr_f4: 'Web',
      pr_f5: 'Brand',
      pr_s1: 'OUT NOW',
      pr_s2: 'Now filming',
      pr_s3: 'Coming soon',
      pr_ph1k: 'Film · sample',
      pr_ph1t: 'Placeholder 01',
      pr_ph2k: 'Film · sample',
      pr_ph2t: 'Placeholder 02',
      pr_ph3k: 'Video · sample',
      pr_ph3t: 'Placeholder 03',
      pr_ph4k: 'Web · sample',
      pr_ph4t: 'Placeholder 04',
      pr_ph5k: 'Brand · sample',
      pr_ph5t: 'Placeholder 05',
      pr_ph6k: 'Film · sample',
      pr_ph6t: 'Placeholder 06',
      pr_strip_h: 'Collaboration or service?',
      pr_strip_p: 'Tell us what you need: production, post, web or brand.',
      pr_strip_b: 'Contact',
      co_hero_k: 'Contact',
      co_hero_h: 'Let’s talk about your <span class="accent">project</span>',
      co_hero_p:
        'Brands, coproducers, press or crews who need hands. Write to <strong>contacto@lunaticostv.com</strong>.',
      co_hero_a1: 'Send email',
      co_hero_a2: 'Use form',
      co_paths_deck: 'One inbox for everything. Use the subject line for project or press.',
      co_closer_q: 'Your project starts with<br><strong>one email.</strong>',
      co_closer_p: 'Brief, tentative dates and references. Write to us and we reply.',
      co_closer_a: 'contacto@lunaticostv.com',
      co_g_k: 'General',
      co_g_h: 'Project inbox',
      co_g_p: 'Brief, tentative dates and references.',
      co_g_b: 'contacto@lunaticostv.com',
      co_g_li1: 'Brands, coproduction and crews looking to produce or post.',
      co_g_li2: 'Our own slate: terms depend on development stage.',
      co_pr_k: 'Press',
      co_pr_h: 'Kit and stills',
      co_pr_p: 'Materials when there is a public title.',
      co_pr_b: 'contacto@lunaticostv.com',
      co_pr_li1: 'Festivals and coverage when there is a public title.',
      co_pr_li2: 'Interviews coordinated with production.',
      co_shop_hint: 'Shop and merch:',
      co_f_k: 'Form',
      co_f_h: 'Summary',
      co_f_p: 'Opens a draft in your mail app (we do not store anything on a server).',
      co_f_name: 'Name',
      co_f_email: 'Email',
      co_f_msg: 'Message',
      co_f_note:
        'Submit opens mailto: with this text. For the shop open the Shop page or set window.LTV_SHOP_URL.',
      co_f_submit: 'Open email',
      shop_hero_h: 'The <span class="cholo-strike" data-spray>LunáticosTv<span class="cholo-strike__new" aria-hidden="true">Cholo’s</span></span> Store',
      shop_hero_p: 'Official merch with the mark on every piece. Secure checkout and shipping across Mexico.',
      shop_b1: 'Shop products',
      shop_b2: 'Special edition',
    },
  };

  function getLang() {
    const s = localStorage.getItem('ltv-lang');
    return s === 'en' ? 'en' : 'es';
  }

  function setLangButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const l = btn.getAttribute('data-set-lang');
      const on = l === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function applyI18n() {
    const lang = getLang();
    document.documentElement.lang = lang;
    const pack = STR[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key && pack[key] != null) {
        if (/<[a-z][\s\S]*>/i.test(pack[key])) el.innerHTML = pack[key];
        else el.textContent = pack[key];
      }
    });
    const docKey = document.body.getAttribute('data-i18n-doc');
    if (docKey && pack[docKey]) document.title = pack[docKey];
    setLangButtons(lang);
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const l = btn.getAttribute('data-set-lang');
      if (l === 'es' || l === 'en') {
        localStorage.setItem('ltv-lang', l);
        applyI18n();
        document.dispatchEvent(new CustomEvent('ltv:languagechange', { detail: { lang: l } }));
      }
    });
  });

  applyI18n();

  // Hero editorial: contenido y tema controlados desde season-config.js.
  const season = window.LTV_SEASON;
  const seasonHero = document.getElementById('home-hero');
  if (season && seasonHero && Array.isArray(season.slides) && season.slides.length) {
    const root = document.documentElement;
    const theme = season.theme || {};
    if (theme.accent) root.style.setProperty('--accent', theme.accent);
    if (theme.accentLight) root.style.setProperty('--accent-light', theme.accentLight);
    if (theme.accentHover) root.style.setProperty('--accent-hover', theme.accentHover);
    if (theme.accentRgb) root.style.setProperty('--accent-rgb', theme.accentRgb);

    const media = document.getElementById('hero-season-image');
    const copy = seasonHero.querySelector('.hero-copy');
    const label = document.getElementById('hero-season-label');
    const title = document.getElementById('hero-season-title');
    const body = document.getElementById('hero-season-copy');
    const primary = document.getElementById('hero-season-primary');
    const secondary = document.getElementById('hero-season-secondary');
    const nav = document.getElementById('hero-season-nav');
    let activeSlide = 0;
    let seasonTimer;

    const localized = (value) => {
      if (typeof value === 'string') return value;
      return value?.[getLang()] || value?.es || '';
    };

    const paintSlide = (index) => {
      const slide = season.slides[index];
      activeSlide = index;
      seasonHero.dataset.story = slide.type || 'season';
      if (media && slide.image) {
        media.src = slide.image;
        media.alt = '';
      }
      if (label) label.textContent = localized(slide.label);
      if (title) title.innerHTML = localized(slide.title);
      if (body) body.textContent = localized(slide.copy);
      if (primary && slide.primary) {
        primary.textContent = localized(slide.primary);
        primary.href = slide.primary.href;
        if (/^https?:\/\//i.test(slide.primary.href)) {
          primary.target = '_blank';
          primary.rel = 'noopener noreferrer';
        } else {
          primary.removeAttribute('target');
          primary.removeAttribute('rel');
        }
      }
      if (secondary && slide.secondary) {
        secondary.textContent = localized(slide.secondary);
        secondary.href = slide.secondary.href;
        if (/^https?:\/\//i.test(slide.secondary.href)) {
          secondary.target = '_blank';
          secondary.rel = 'noopener noreferrer';
        } else {
          secondary.removeAttribute('target');
          secondary.removeAttribute('rel');
        }
      }
      nav?.querySelectorAll('button').forEach((dot, dotIndex) => {
        const selected = dotIndex === index;
        dot.classList.toggle('is-active', selected);
        dot.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    };

    const showSlide = (index, immediate = false) => {
      const next = (index + season.slides.length) % season.slides.length;
      if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        paintSlide(next);
        return;
      }
      copy?.classList.add('is-changing');
      seasonHero.classList.add('is-changing');
      window.setTimeout(() => {
        paintSlide(next);
        copy?.classList.remove('is-changing');
        seasonHero.classList.remove('is-changing');
      }, 260);
    };

    const stopSeasonTimer = () => window.clearInterval(seasonTimer);
    const startSeasonTimer = () => {
      stopSeasonTimer();
      seasonTimer = window.setInterval(
        () => showSlide(activeSlide + 1),
        Math.max(4500, Number(season.interval) || 7200)
      );
    };

    if (nav) {
      season.slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-season__dot';
        dot.setAttribute('aria-label', `${index + 1}: ${localized(slide.label)}`);
        dot.addEventListener('click', () => {
          showSlide(index);
          startSeasonTimer();
        });
        nav.appendChild(dot);
        if (slide.image) {
          const preload = new Image();
          preload.src = slide.image;
        }
      });
    }

    seasonHero.addEventListener('mouseenter', stopSeasonTimer);
    seasonHero.addEventListener('mouseleave', startSeasonTimer);
    seasonHero.addEventListener('focusin', stopSeasonTimer);
    seasonHero.addEventListener('focusout', startSeasonTimer);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopSeasonTimer();
      else startSeasonTimer();
    });
    document.addEventListener('ltv:languagechange', () => showSlide(activeSlide, true));
    showSlide(0, true);
    startSeasonTimer();
  }

  const newsGrid = document.getElementById('news-feed-grid');
  const newsEyebrow = document.getElementById('news-feed-eyebrow');
  const newsTitle = document.getElementById('news-feed-title');
  const renderSeasonNews = () => {
    if (!newsGrid || !season?.news?.length) return;
    const lang = getLang();
    const local = (value) => (typeof value === 'string' ? value : value?.[lang] || value?.es || '');
    if (newsEyebrow) newsEyebrow.textContent = lang === 'en' ? 'On the signal' : 'En la señal';
    if (newsTitle) newsTitle.textContent = lang === 'en' ? 'LunáticosTv news' : 'Noticias de LunáticosTv';
    newsGrid.replaceChildren();

    season.news.forEach((item) => {
      const card = document.createElement('a');
      card.className = `news-card${item.featured ? ' news-card--featured' : ''}`;
      card.href = item.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('aria-label', `${local(item.title)} — ${local(item.cta)}`);

      const mediaWrap = document.createElement('span');
      mediaWrap.className = 'news-card__media';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      mediaWrap.appendChild(image);

      const body = document.createElement('span');
      body.className = 'news-card__body';
      const category = document.createElement('span');
      category.className = 'news-card__category';
      category.textContent = local(item.category);
      const heading = document.createElement('strong');
      heading.className = 'news-card__title';
      heading.textContent = local(item.title);
      const copyText = document.createElement('span');
      copyText.className = 'news-card__copy';
      copyText.textContent = local(item.copy);
      const cta = document.createElement('span');
      cta.className = 'news-card__cta';
      cta.innerHTML = `${local(item.cta)} <span aria-hidden="true">↗</span>`;
      body.append(category, heading, copyText, cta);
      card.append(mediaWrap, body);
      newsGrid.appendChild(card);
    });
  };
  renderSeasonNews();
  document.addEventListener('ltv:languagechange', renderSeasonNews);

  const pageSlug = () => {
    const raw = window.location.pathname.replace(/\/+$/, '') || '/';
    if (raw === '/' || raw === '/index.html') return '';
    return raw.split('/').pop().replace(/\.html$/, '');
  };

  const setActiveNav = () => {
    const slug = document.body.dataset.nav || pageSlug();
    const onHome = slug === '';
    document.querySelectorAll('.nav__link').forEach((link) => {
      const href = (link.getAttribute('href') || '').replace(/^\//, '').replace(/\.html$/, '');
      const active = href === slug;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const brand = document.querySelector('.nav__brand');
    if (brand) {
      brand.classList.toggle('is-active', onHome);
      if (onHome) brand.setAttribute('aria-current', 'page');
      else brand.removeAttribute('aria-current');
    }
  };
  setActiveNav();

  const header = document.getElementById('site-header');
  const toggle = document.getElementById('nav-toggle');
  const scrim = document.getElementById('nav-scrim');

  const closeMenu = () => {
    if (!header) return;
    header.classList.remove('is-menu-open');
    if (window.scrollY <= 8 && !header.classList.contains('is-scrolled')) {
      header.classList.remove('is-light');
    }
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  const openMenu = () => {
    if (!header) return;
    header.classList.add('is-menu-open', 'is-light');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };

  if (toggle && header) {
    toggle.addEventListener('click', () => {
      if (header.classList.contains('is-menu-open')) closeMenu();
      else openMenu();
    });
  }
  if (scrim) scrim.addEventListener('click', () => closeMenu());

  document.querySelectorAll('#site-nav a').forEach((a) => {
    a.addEventListener('click', () => closeMenu());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener(
    'resize',
    () => {
      if (window.innerWidth > 960) closeMenu();
    },
    { passive: true }
  );

  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const bgUrl = (path) => (path.includes(' ') ? path.replace(/ /g, '%20') : path);

  document.querySelectorAll('[data-bg]').forEach((el) => {
    const url = el.dataset.bg;
    if (!url) return;
    const loadUrl = bgUrl(url);
    if (!el.style.backgroundImage) {
      el.style.backgroundImage = `url('${loadUrl}')`;
    }
    const markLoaded = () => el.classList.add('is-loaded');
    const img = new Image();
    img.onload = markLoaded;
    img.onerror = () => {};
    img.src = loadUrl;
    if (img.complete) markLoaded();
  });

  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el) => {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      io.observe(el);
    } else {
      el.classList.add('is-in');
    }
  });

  const filters = document.querySelectorAll('.catalog-filters .filter');
  const items = document.querySelectorAll('.portfolio-item');
  if (filters.length && items.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const key = btn.getAttribute('data-filter') || 'all';
        items.forEach((item) => {
          const tags = (item.getAttribute('data-tags') || '').toLowerCase();
          const show = key === 'all' || tags.includes(key);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const lang = getLang();
      const name = document.querySelector('#cf-name')?.value?.trim() || '';
      const email = document.querySelector('#cf-email')?.value?.trim() || '';
      const message = document.querySelector('#cf-msg')?.value?.trim() || '';
      const L = lang === 'en';
      const body = L
        ? [`Name: ${name}`, `Email: ${email}`, '', message].join('\n')
        : [`Nombre: ${name}`, `Correo: ${email}`, '', message].join('\n');
      const subj = L ? 'LunáticosTv contact' : 'Contacto LunáticosTv';
      window.location.href =
        'mailto:' + LTV_EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    });
  }

  const rosterToggle = document.getElementById('talent-roster-toggle');
  const rosterPanel = document.getElementById('talent-roster');
  if (rosterToggle && rosterPanel) {
    const syncRosterLabel = () => {
      const open = rosterToggle.getAttribute('aria-expanded') === 'true';
      const pack = STR[getLang()] || STR.es;
      const label = open ? pack.talent_b2_open : pack.talent_b2;
      if (label) rosterToggle.textContent = label;
    };
    rosterToggle.addEventListener('click', () => {
      const open = rosterToggle.getAttribute('aria-expanded') === 'true';
      const next = !open;
      rosterToggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      rosterPanel.hidden = !next;
      syncRosterLabel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (rosterToggle.getAttribute('aria-expanded') !== 'true') return;
      rosterToggle.setAttribute('aria-expanded', 'false');
      rosterPanel.hidden = true;
      syncRosterLabel();
    });
    document.addEventListener('ltv:languagechange', syncRosterLabel);
  }

  // La intro se controla en index.html; aquí solo evitamos reiniciarla.
  const introVideo = document.getElementById('site-intro-video');
  if (
    introVideo &&
    document.documentElement.classList.contains('has-intro') &&
    !window.__ltvIntroFinished &&
    !window.__ltvIntroReady &&
    introVideo.paused &&
    introVideo.currentTime < 0.2
  ) {
    introVideo.muted = true;
    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (typeof window.__ltvFinishIntro === 'function') window.__ltvFinishIntro();
      });
    }
  }
  // Intervención CHOLO: tags a mano con escurridos que aparecen con un barrido de aerosol.
  // La página del artista tiene su propio tono y queda fuera.
  if (!document.body.classList.contains('page-artist')) {
    const fontHref = 'https://fonts.googleapis.com/css2?family=Sedgwick+Ave+Display&display=swap';
    if (!document.querySelector(`link[href="${fontHref}"]`)) {
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = fontHref;
      document.head.appendChild(font);
    }

    // Borde áspero de aerosol para el texto.
    const svgNS = 'http://www.w3.org/2000/svg';
    if (!document.getElementById('cholo-rough')) {
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.innerHTML =
        '<filter id="cholo-rough" x="-5%" y="-5%" width="110%" height="110%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>' +
        '</filter>' +
        '<filter id="cholo-spray" x="-25%" y="-25%" width="150%" height="150%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="rough"/>' +
        '<feGaussianBlur in="rough" stdDeviation="2.4" result="halo"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="9" result="grain"/>' +
        '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -4.6" result="dots"/>' +
        '<feComposite in="halo" in2="dots" operator="in" result="mist"/>' +
        '<feMerge><feMergeNode in="mist"/><feMergeNode in="rough"/></feMerge>' +
        '</filter>';
      document.body.appendChild(svg);
    }

    // Firma en el pie de todas las páginas.
    const footInner = document.querySelector('.foot .foot__inner');
    if (footInner && !footInner.querySelector('.cholo-tag--foot')) {
      const sign = document.createElement('p');
      sign.className = 'cholo-tag cholo-tag--foot';
      sign.setAttribute('data-spray', '');
      sign.setAttribute('aria-hidden', 'true');
      sign.innerHTML = 'Cholo<small>estuvo aquí</small>';
      footInner.parentNode.appendChild(sign);
    }

    // Un tag en la portada de cada ruta, cada uno con su frase.
    const slugNow = (window.location.pathname.replace(/\/+$/, '').split('/').pop() || '').replace(/\.html$/, '');
    const pageTags = {
      estudio: ['.fs--short', 'pasó por aquí'],
      proyectos: ['.fs--short', 'en rodaje'],
      contacto: ['.fs--short', 'márcale'],
      tienda: ['.shop-hero', 'lo quiero'],
      catalogo: ['.cat-list__top', 'fiado'],
      talento: ['.talent-hero', 'también actúa'],
    };
    const pageTag = pageTags[slugNow];
    const pageHost = pageTag && document.querySelector(pageTag[0]);
    if (pageHost && !pageHost.querySelector('.cholo-tag--page')) {
      if (getComputedStyle(pageHost).position === 'static') pageHost.style.position = 'relative';
      const tag = document.createElement('p');
      tag.className = 'cholo-tag cholo-tag--page';
      tag.setAttribute('data-spray', '');
      tag.setAttribute('aria-hidden', 'true');
      tag.innerHTML = `Cholo<small>${pageTag[1]}</small>`;
      pageHost.appendChild(tag);
    }

    // Escurridos: líneas de largo y grosor irregulares bajo cada tag.
    document.querySelectorAll('.cholo-tag').forEach((tag, t) => {
      if (tag.querySelector('.cholo-drips')) return;
      const drips = document.createElementNS(svgNS, 'svg');
      drips.setAttribute('class', 'cholo-drips');
      drips.setAttribute('viewBox', '0 0 100 30');
      drips.setAttribute('preserveAspectRatio', 'none');
      drips.setAttribute('aria-hidden', 'true');
      const xs = [14 + t * 3, 37, 58 - t * 2, 81];
      const lens = [22, 11, 28, 15];
      xs.forEach((x, i) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('x2', x);
        line.setAttribute('y1', 0);
        line.setAttribute('y2', lens[(i + t) % lens.length]);
        line.setAttribute('stroke-width', i % 2 ? 1.4 : 2.2);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        drips.appendChild(line);
      });
      tag.appendChild(drips);
    });

    // Se pinta al entrar en pantalla; la pieza del hero espera a que termine la intro.
    const sprayEls = document.querySelectorAll('[data-spray]');
    const spray = (el) => el.classList.add('is-sprayed');
    const whenIntroDone = (fn) => {
      const root = document.documentElement;
      if (!root.classList.contains('has-intro')) return fn();
      const mo = new MutationObserver(() => {
        if (root.classList.contains('has-intro')) return;
        mo.disconnect();
        window.setTimeout(fn, 500);
      });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    };
    whenIntroDone(() => {
      if (!('IntersectionObserver' in window)) {
        sprayEls.forEach(spray);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            spray(entry.target);
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.35 }
      );
      sprayEls.forEach((el) => io.observe(el));
    });
  }
  // Tienda invadida: bigotes, lágrima, estrella y corona pintados sobre las caras de los modelos,
  // más rosas en aerosol. Las coordenadas están en píxeles de la foto original y se recalculan
  // según cómo la recorta el contenedor (cover + object-position + escala).
  const DOODLE_SVG = {
    mustache:
      '<svg viewBox="0 0 200 48"><path class="cholo-ink" d="M100 22 C 92 12, 78 10, 64 16 C 50 22, 40 28, 28 26 C 18 24, 12 16, 16 8 C 18 4, 24 4, 24 10 C 22 6, 18 8, 20 14 C 24 24, 40 34, 58 34 C 76 34, 90 30, 100 32 C 110 30, 124 34, 142 34 C 160 34, 176 24, 180 14 C 182 8, 178 6, 176 10 C 176 4, 182 4, 184 8 C 188 16, 182 24, 172 26 C 160 28, 150 22, 136 16 C 122 10, 108 12, 100 22 Z"/><path class="cholo-hair" d="M70 20 L 66 30 M80 18 L 78 30 M90 20 L 90 30 M110 20 L 110 30 M120 18 L 122 30 M130 20 L 134 30"/></svg>',
    tear:
      '<svg viewBox="0 0 20 30"><path class="cholo-ink" d="M10 1 C 14 10, 18 15, 18 21 A 8 8 0 0 1 2 21 C 2 15, 6 10, 10 1 Z"/><path class="cholo-shine" d="M6.5 19 C 6.5 16, 8 13.5, 9 12"/></svg>',
    star:
      '<svg viewBox="0 0 40 40"><path class="cholo-line" d="M20 3 L24.5 15 L37 15 L27 23 L31 36 L20 28 L9 36 L13 23 L3 15 L15.5 15 Z"/></svg>',
    crown:
      '<svg viewBox="0 0 200 100"><path class="cholo-line cholo-line--accent" d="M14 88 L 22 30 L 62 64 L 100 14 L 138 64 L 178 30 L 186 88 Z"/><circle class="cholo-dot" cx="22" cy="24" r="6"/><circle class="cholo-dot" cx="100" cy="8" r="6"/><circle class="cholo-dot" cx="178" cy="24" r="6"/></svg>',
  };
  const ROSE_SVG =
    '<svg class="cholo-rose" viewBox="0 0 140 230" aria-hidden="true">' +
    '<path class="cholo-rose__outline" d="M70 96 C 66 132, 76 168, 66 222 M70 150 C 46 132, 22 136, 12 152 C 30 160, 52 160, 70 150 Z M71 182 C 94 168, 116 172, 126 186 C 108 194, 88 194, 71 182 Z M70 18 C 98 12, 122 32, 120 60 C 118 84, 96 100, 70 100 C 44 100, 20 84, 20 60 C 20 32, 42 22, 70 18 Z" />' +
    '<path class="cholo-rose__stem" d="M70 96 C 66 132, 76 168, 66 222" />' +
    '<path class="cholo-rose__thorn" d="M68 120 l -7 -3 M72 140 l 7 -4 M69 200 l -7 -2" />' +
    '<path class="cholo-rose__leaf" d="M70 150 C 46 132, 22 136, 12 152 C 30 160, 52 160, 70 150 Z M71 182 C 94 168, 116 172, 126 186 C 108 194, 88 194, 71 182 Z" />' +
    '<path class="cholo-rose__vein" d="M66 150 C 50 148, 34 148, 18 152 M75 182 C 92 180, 106 180, 120 186" />' +
    '<path class="cholo-rose__bloom" d="M70 18 C 98 12, 122 32, 120 60 C 118 84, 96 100, 70 100 C 44 100, 20 84, 20 60 C 20 32, 42 22, 70 18 Z" />' +
    '<path class="cholo-rose__petal" d="M24 66 C 34 86, 56 92, 70 100 C 84 92, 106 86, 116 66 C 104 80, 86 84, 70 84 C 54 84, 36 80, 24 66 Z" />' +
    '<path class="cholo-rose__fold" d="M70 34 C 86 30, 96 44, 92 58 C 86 74, 62 74, 56 62 C 50 50, 62 42, 72 50 C 78 56, 72 62, 66 58 M30 46 C 38 38, 46 36, 52 40 M110 46 C 102 38, 94 36, 88 40 M36 74 C 48 84, 60 86, 70 84 M104 74 C 92 84, 80 86, 70 84" />' +
    '<path class="cholo-rose__shine" d="M42 34 C 48 28, 56 26, 62 26 M100 54 C 102 62, 100 70, 96 76" />' +
    '<path class="cholo-rose__drip" d="M48 96 L 48 112 M86 98 L 86 120 M98 92 L 98 104" />' +
    '</svg>';
  // Coordenadas en la foto original: centro (x, y) y ancho (w).
  const DOODLES = {
    'PHOTO-2026-05-25-23-51-17.jpg': [
      { type: 'tear', x: 400, y: 496, w: 28 },
    ],
    'PHOTO-2026-05-25-23-56-00.jpg': [
      { type: 'mustache', x: 512, y: 604, w: 225 },
      { type: 'star', x: 614, y: 568, w: 40 },
    ],
    'tienda-hero-orange.jpg': [
      { type: 'mustache', x: 808, y: 317, w: 138 },
      { type: 'crown', x: 798, y: 100, w: 190 },
    ],
  };

  const pct = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n / 100 : fallback;
  };
  // Punto de la foto -> punto del contenedor para un recorte tipo cover.
  const coverPoint = (cw, ch, iw, ih, px, py, posX, posY, scale, shiftY) => {
    const s = Math.max(cw / iw, ch / ih);
    let x = (cw - iw * s) * posX + px * s;
    let y = (ch - ih * s) * posY + py * s + shiftY;
    x = cw / 2 + (x - cw / 2) * scale;
    y = ch / 2 + (y - ch / 2) * scale;
    return { x, y, unit: s * scale };
  };

  const decorate = (host, file, measure) => {
    const marks = DOODLES[file];
    if (!marks || host.querySelector(':scope > .cholo-doodles')) return;
    const layer = document.createElement('div');
    layer.className = 'cholo-doodles';
    layer.setAttribute('aria-hidden', 'true');
    marks.forEach((m, i) => {
      const el = document.createElement('span');
      el.className = `cholo-doodle cholo-doodle--${m.type}`;
      el.style.setProperty('--i', i);
      el.innerHTML = DOODLE_SVG[m.type];
      layer.appendChild(el);
    });
    host.appendChild(layer);
    const place = () => {
      const m = measure();
      if (!m) return;
      marks.forEach((mark, i) => {
        const p = coverPoint(m.cw, m.ch, m.iw, m.ih, mark.x, mark.y, m.posX, m.posY, m.scale, m.shiftY);
        const el = layer.children[i];
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.style.width = `${mark.w * p.unit}px`;
      });
    };
    place();
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(host);
    else window.addEventListener('resize', place);
    sprayWhenVisible(layer);
    return place;
  };

  const sprayWhenVisible = (el) => {
    if (!('IntersectionObserver' in window)) return el.classList.add('is-sprayed');
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.classList.add('is-sprayed');
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
  };

  // Hero de la tienda (fondo con background-size: cover).
  const shopBg = document.querySelector('.shop-hero__bg[data-bg]');
  if (shopBg) {
    const file = (shopBg.getAttribute('data-bg') || '').split('/').pop();
    const probe = new Image();
    probe.onload = () => {
      const place = decorate(shopBg.parentNode, file, () => {
        const r = shopBg.getBoundingClientRect();
        const cs = getComputedStyle(shopBg);
        const [bx, by] = cs.backgroundPosition.split(' ');
        return { cw: r.width, ch: r.height, iw: probe.naturalWidth, ih: probe.naturalHeight, posX: pct(bx, 0.5), posY: pct(by, 0.5), scale: 1, shiftY: 0 };
      });
      if (place) place();
    };
    probe.src = shopBg.getAttribute('data-bg');
    const hero = shopBg.parentNode;
    if (!hero.querySelector('.cholo-rose')) {
      hero.insertAdjacentHTML('beforeend', ROSE_SVG);
      const rose = hero.querySelector('.cholo-rose');
      rose.classList.add('cholo-rose--hero');
      sprayWhenVisible(rose);
    }
  }

  // Tarjetas del catálogo: los dibujos van sobre la foto del modelo y solo se ven cuando está esa foto.
  const catGrid = document.getElementById('cat-grid');
  if (catGrid) {
    const decorateCards = () => {
      catGrid.querySelectorAll('.cat-card__img--model').forEach((img) => {
        const media = img.closest('.cat-card__media');
        if (!media) return;
        const file = decodeURIComponent((img.getAttribute('src') || '').split('/').pop());
        const run = () =>
          decorate(media, file, () => {
            if (!img.naturalWidth) return null;
            const r = media.getBoundingClientRect();
            const cs = getComputedStyle(img);
            const [ox, oy] = cs.objectPosition.split(' ');
            const scale = parseFloat(cs.getPropertyValue('--card-img-scale')) || 1;
            const shiftY = (parseFloat(cs.getPropertyValue('--card-img-y')) || 0) / 100 * r.height;
            return { cw: r.width, ch: r.height, iw: img.naturalWidth, ih: img.naturalHeight, posX: pct(ox, 0.5), posY: pct(oy, 0.5), scale, shiftY };
          });
        if (img.complete && img.naturalWidth) run();
        else img.addEventListener('load', run, { once: true });
      });
    };
    const tagPrice = (price) => {
      if (!price || (price.nextElementSibling && price.nextElementSibling.classList.contains('cholo-price-tag'))) return;
      const tag = document.createElement('span');
      tag.className = 'cholo-price-tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.textContent = '¡qué barato!';
      price.insertAdjacentElement('afterend', tag);
      sprayWhenVisible(tag);
    };
    const decorateAll = () => {
      decorateCards();
      catGrid.querySelectorAll('.cat-card__price').forEach(tagPrice);
    };
    decorateAll();
    new MutationObserver(decorateAll).observe(catGrid, { childList: true, subtree: true });
    tagPrice(document.getElementById('cat-pdp-price'));

    // En el detalle, una rosa chica junto al nombre del producto (fuera de la foto).
    const pdpInfo = document.querySelector('.cat-pdp__info');
    if (pdpInfo && !pdpInfo.querySelector('.cholo-rose')) {
      if (getComputedStyle(pdpInfo).position === 'static') pdpInfo.style.position = 'relative';
      pdpInfo.insertAdjacentHTML('afterbegin', ROSE_SVG);
      const rose = pdpInfo.querySelector('.cholo-rose');
      rose.classList.add('cholo-rose--pdp');
      sprayWhenVisible(rose);
    }

    const body = catGrid.closest('.cat-list__body') || catGrid.parentNode;
    if (body && !body.querySelector('.cholo-rose')) {
      if (getComputedStyle(body).position === 'static') body.style.position = 'relative';
      body.insertAdjacentHTML('beforeend', ROSE_SVG);
      const rose = body.querySelector('.cholo-rose');
      rose.classList.add('cholo-rose--catalog');
      sprayWhenVisible(rose);
    }
  }

  // Al cambiar de idioma el título se vuelve a escribir: el tachón ya debe verse pintado.
  document.addEventListener('ltv:languagechange', () => {
    document.querySelectorAll('.cholo-strike').forEach((el) => el.classList.add('is-sprayed'));
  });
})();
