# Variantes de assets — LunáticosTv

## Dónde está cada cosa

| Carpeta | Qué es |
|---------|--------|
| **`img/`** | Archivos **activos** en el sitio. El HTML apunta aquí (`data-bg="img/nombre.png"`). |
| **`img/variants/shop/`** | **3 opciones por producto** de tienda para que elijas cuál publicar. |
| Cursor genera primero en su carpeta interna y luego se copia a `img/` — tú solo necesitas `img/` y `img/variants/`. |

## Tienda — elegir 1 de 3 por producto

Abre las carpetas en el explorador y compara en pantalla completa:

| Producto | Opción A (actual en web) | Opción B | Opción C |
|----------|--------------------------|----------|----------|
| Edición 01 | `variants/shop/shop-01-a.png` (= `img/shop-01.png`) | `shop-01-b.png` | `shop-01-c.png` |
| Edición 02 | `variants/shop/shop-02-a.png` (= `img/shop-02.png`) | `shop-02-b.png` | `shop-02-c.png` |
| Edición 03 | `variants/shop/shop-03-a.png` (= `img/shop-03.png`) | `shop-03-b.png` | `shop-03-c.png` |

### Publicar la que elijas

Copia la variante ganadora sobre el archivo activo, por ejemplo:

```powershell
Copy-Item img\variants\shop\shop-02-b.png img\shop-02.png -Force
```

Refresca el navegador con **Ctrl+F5**.

## Encuadre (caras / pies cortados)

No hace falta mover las imágenes a mano. En `styles.css` hay reglas por `data-asset-id`, por ejemplo:

- `home-closer` → `center 42%`
- `tienda-hero` → `center 32%` (pantallas anchas `34%`)
- `contacto-hero` → `center 38%`

Si una sección sigue mal, dime **qué página y qué bloque** y ajustamos solo ese porcentaje (subir número = baja el encuadre; bajar = sube).

## Lista completa de activos en `img/`

- Hero principal: `6a53ad55-e4c2-4b2c-a911-41d19ce44f43.png`
- Home: `quote-band.png`, `split-estudio.png`, `poster-01..03.png`, `home-closer.png`
- Estudio: `estudio-hero.png`, `estudio-quote.png`, `estudio-closer.png`
- Proyectos: `proyectos-hero.png`, `now-feature.png`, `proyectos-quote.png`
- Contacto: `contacto-hero.png`, `contacto-closer.png`
- Tienda: `tienda-hero.png`, `shop-01..03.png`, `tienda-closer.png`
- Marca: `brand-logo-reference.png`
