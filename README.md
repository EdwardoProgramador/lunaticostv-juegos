# LunáticosTv · Juegos

Juego 1 "Los objetos del Cholo" (niveles 1 y 2) integrado sobre una copia del sitio de LunáticosTv, para desarrollarlo
y probarlo. El sitio de producción vive en otro proyecto: para llevar el juego allí solo se copia la carpeta `juegos/`
(ver `ENTREGA.md`).

## Estructura

| Ruta | Qué es |
| --- | --- |
| `juegos/` | **El juego.** `boot.js` + `config.js` (encender/apagar, versión, escondites…) y `j1/` con todo el Juego 1: código, estilos, sonido, texturas, fuentes, el video y las fotos del premio, Three.js y GSAP locales. |
| `*.html`, `styles.css`, `script.js`, `season-config.js`, `img/`, favicons | Copia del sitio, para probar el juego sobre las páginas reales. Cada página carga el juego con una línea: `<script type="module" src="juegos/boot.js"></script>`. |
| `vercel.json`, `_redirects` | Direcciones limpias (`/proyectos` → `proyectos.html`). |
| `servidor-local.py` | Servidor para probar en local con esas mismas direcciones. |

## Probar en local

```sh
python3 servidor-local.py
```

Abre http://127.0.0.1:8000. No uses `python3 -m http.server`: no entiende `/proyectos` y al cambiar de página da error.
Para empezar en una etapa concreta del juego, mira "Depuración" en `juegos/README.md`.

## Documentación

| Archivo | Para qué |
| --- | --- |
| `ENTREGA.md` | Cómo integrar el juego en el sitio de producción y qué se configura. |
| `juegos/README.md` | Referencia técnica del juego: archivos, configuración, sonido, contenido exclusivo, rendimiento, depuración. |
| `juegos/j1/INTEGRATION-N2.md` | Recorrido completo del juego, etapa por etapa. |

Ninguno de estos documentos se publica en el servidor: explican la solución del juego.
