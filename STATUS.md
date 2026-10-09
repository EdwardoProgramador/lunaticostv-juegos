# Estado de la integración Shopify — LunáticosTv

**Fecha de pausa:** 2026-05-25
**Sesión:** local (no persiste en la nube, este doc es la fuente de verdad)

---

## ✅ HECHO

### 1. Productos creados en Shopify
Tienda: **Lunaticos Shop** (`lunaticos-shop-2.myshopify.com`) · Plan Basic · MXN

| Producto | Variant ID (numérico) | Precio | Inventario | Status |
|---|---|---|---|---|
| Primos A White | `52425361588536` | $999 MXN | 50 unidades | ACTIVE, publicado a Online Store + Shop |
| Los Primos Black | `52425361621304` | $999 MXN | 50 unidades | ACTIVE, publicado a Online Store + Shop |

Ambas son unitalla, con descripción larga ya escrita. **Sin imágenes todavía** (faltan fotos).

### 2. Archivos modificados
- **`tienda.html`** → restaurado a hero pantalla completa (como estaba originalmente). Botón "Ver productos" ahora apunta a `catalogo.html`.
- **`catalogo.html`** → NUEVO archivo con grid de 2 productos. Botones "Comprar →" usan **cart permalinks de Shopify** (`https://lunaticos-shop-2.myshopify.com/cart/{variantId}:1`) — Shopify maneja TODO (carrito, checkout, pagos, envíos). Sin tokens, sin JS extra.
- **`shop.js`** → existe pero ya no se usa (era para el approach anterior con Storefront API). Se puede borrar.

### 3. Approach final elegido
**Cart permalinks** en lugar de Storefront API. Razón: la mutación `storefrontAccessTokenCreate` está bloqueada para IAs (seguridad), y el token `atkn_...` que pasaste era de Admin API, no Storefront. Los cart permalinks no requieren token y Shopify maneja todo de su lado.

---

## ⚠️ FALTA HACER (en orden de prioridad)

### A. **CRÍTICO — Desactivar protección por contraseña** (TÚ desde admin)
Tu tienda redirige todo a `/password` — visitantes no pueden comprar. La API no expone esta config.

**Pasos:**
1. Entra a [admin.shopify.com/store/lunaticos-shop-2](https://admin.shopify.com/store/lunaticos-shop-2)
2. **Canales de venta** (sidebar) → **Tienda en línea** → **Preferencias**
3. Hasta abajo, sección **"Restringir acceso"** o **"Protección con contraseña"**
4. Desmarca la casilla → **Guardar**

Sin esto los clientes no pueden completar la compra, solo verán una página de contraseña.

### B. **CSS sin terminar** (clases nuevas sin estilos)
`catalogo.html` usa clases que NO existen aún en `styles.css`:
- `.catalog`, `.catalog__head`, `.catalog__back`, `.catalog__eyebrow`, `.catalog__title`, `.catalog__sub`, `.catalog__grid`, `.catalog__foot`, `.catalog__foot-line`
- `.prod-card`, `.prod-card__media`, `.prod-card__placeholder`, `.prod-card__placeholder--white`, `.prod-card__placeholder--black`, `.prod-card__body`, `.prod-card__kicker`, `.prod-card__name`, `.prod-card__desc`, `.prod-card__foot`, `.prod-card__price`, `.prod-card__cta`

**Sin estos estilos `catalogo.html` se va a ver feo (HTML sin formato).** Hay que agregarlos al final de `styles.css`.

### C. **CSS para limpiar** (clases viejas que ya no se usan)
En `styles.css` entre líneas **2600 y ~2950** quedó código del approach anterior (cart drawer, FAB, shop-card del Storefront API). No rompe nada pero está sin usar:
- `.shop-hero--sm`, `.shop-catalog*`, `.shop-grid`, `.shop-skeleton`, `.shop-card*`, `.shop-empty*`
- `.cart-fab*`, `.cart-scrim`, `.cart-drawer*`, `.cart-total-row`, `.cart-empty`, `.cart-line*`, `body.cart-open`

Recomendado: borrarlos. Pero no urgente.

### D. **i18n keys faltantes** en `script.js`
`catalogo.html` usa estos `data-i18n` que NO existen en el objeto STR de script.js:
- `doc_catalog`, `cat_back`, `cat_k`, `cat_h`, `cat_p`, `cat_buy`, `cat_foot`, `cat_full`

Si no se agregan, los textos se quedan como están escritos en el HTML (en español). El switch ES/EN no traducirá el catálogo. Hay que añadirlos a `STR.es` y `STR.en` en [script.js](script.js).

### E. **Imágenes de productos**
Los productos no tienen foto en Shopify. Actualmente se ven con placeholders de texto ("P · A" y "P · B"). Para arreglar:
- Opción 1 (tú): Shopify admin → Productos → click en gorra → subir foto → guardar. Aparecen automáticamente en cuanto agregues imágenes a las cards del catálogo.
- Opción 2 (next session): subir las imágenes que ya tienes en `img/variants/shop/*.png` via MCP, luego actualizar `catalogo.html` para usar `<img>` en vez del placeholder.

---

## 🔑 Datos clave (referencia)

```
SHOPIFY_DOMAIN   = lunaticos-shop-2.myshopify.com
LOCATION_ID      = gid://shopify/Location/113848582456  (Sucursal de la tienda)
PUBLICATION_OS   = gid://shopify/Publication/299907514680  (Online Store)
PUBLICATION_SHOP = gid://shopify/Publication/299907580216  (Shop)

PRIMOS_A_WHITE:
  product_id = gid://shopify/Product/10709790523704
  variant_id = gid://shopify/ProductVariant/52425361588536  (numérico: 52425361588536)
  inventory  = gid://shopify/InventoryItem/54488545460536
  cart_url   = https://lunaticos-shop-2.myshopify.com/cart/52425361588536:1
  shop_url   = https://lunaticos-shop-2.myshopify.com/products/primos-a-white

LOS_PRIMOS_BLACK:
  product_id = gid://shopify/Product/10709790556472
  variant_id = gid://shopify/ProductVariant/52425361621304  (numérico: 52425361621304)
  inventory  = gid://shopify/InventoryItem/54488545493304
  cart_url   = https://lunaticos-shop-2.myshopify.com/cart/52425361621304:1
  shop_url   = https://lunaticos-shop-2.myshopify.com/products/los-primos-black
```

---

## 🧭 PRÓXIMA SESIÓN — lo primero que hay que hacer

1. Confirmar que el usuario desactivó la protección por contraseña (probar `https://lunaticos-shop-2.myshopify.com/products/primos-a-white` en incógnito)
2. **Agregar los estilos CSS** de `.catalog` y `.prod-card` al final de [styles.css](styles.css)
3. Borrar el bloque viejo de `styles.css` (líneas ~2600-2950, todo lo de `.cart-*` y `.shop-card*` del approach Storefront)
4. Agregar i18n keys a [script.js](script.js)
5. (Opcional) Subir fotos reales de las gorras a Shopify
