// LunáticosTv — Shopify Storefront API
(function () {
  const DOMAIN = 'shop.lunaticostv.com';
  const TOKEN  = (typeof window.LTV_STOREFRONT_TOKEN === 'string') ? window.LTV_STOREFRONT_TOKEN.trim() : '';
  const API    = `https://${DOMAIN}/api/2024-01/graphql.json`;

  // ── GraphQL helper ──────────────────────────────────────────────────────────
  async function gql(query, variables) {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    return res.json();
  }

  // ── Fetch products ──────────────────────────────────────────────────────────
  async function fetchProducts() {
    const { data } = await gql(`{
      products(first: 20) {
        edges { node {
          id title description
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
          variants(first: 5) { edges { node {
            id title availableForSale
            price { amount currencyCode }
          } } }
        } }
      }
    }`);
    return data.products.edges.map(e => e.node);
  }

  // ── Cart (stored in localStorage) ──────────────────────────────────────────
  let cartId = localStorage.getItem('ltv-cart-id') || null;

  const CART_FIELDS = `
    id checkoutUrl
    lines(first: 30) { edges { node {
      id quantity
      merchandise { ... on ProductVariant {
        id title
        price { amount currencyCode }
        product { title images(first:1) { edges { node { url altText } } } }
      } }
    } } }
    cost { totalAmount { amount currencyCode } }
  `;

  async function getCart() {
    if (!cartId) return null;
    const { data } = await gql(`query($id:ID!){ cart(id:$id){ ${CART_FIELDS} } }`, { id: cartId });
    return data.cart;
  }

  async function addToCart(variantId) {
    const lines = [{ merchandiseId: variantId, quantity: 1 }];
    if (!cartId) {
      const { data } = await gql(
        `mutation($lines:[CartLineInput!]!){ cartCreate(input:{lines:$lines}){ cart{ ${CART_FIELDS} } } }`,
        { lines }
      );
      const cart = data.cartCreate.cart;
      cartId = cart.id;
      localStorage.setItem('ltv-cart-id', cartId);
      return cart;
    }
    const { data } = await gql(
      `mutation($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId,lines:$lines){ cart{ ${CART_FIELDS} } } }`,
      { cartId, lines }
    );
    return data.cartLinesAdd.cart;
  }

  async function removeFromCart(lineId) {
    const { data } = await gql(
      `mutation($cartId:ID!,$lineIds:[ID!]!){ cartLinesRemove(cartId:$cartId,lineIds:$lineIds){ cart{ ${CART_FIELDS} } } }`,
      { cartId, lineIds: [lineId] }
    );
    return data.cartLinesRemove.cart;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmt(amount, currency) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN' }).format(amount);
  }

  // ── Render products ─────────────────────────────────────────────────────────
  function renderProducts(products) {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    if (!products.length) {
      grid.innerHTML = '<p class="shop-empty">Colección en camino — pronto aquí.</p>';
      return;
    }

    grid.innerHTML = products.map(p => {
      const img     = p.images.edges[0]?.node;
      const variant = p.variants.edges[0]?.node;
      const price   = fmt(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode);
      const avail   = variant?.availableForSale;

      return `<article class="shop-card reveal">
        <div class="shop-card__img-wrap">
          ${img
            ? `<img src="${img.url}" alt="${img.altText || p.title}" loading="lazy" />`
            : '<div class="shop-card__img-empty"></div>'}
          ${!avail ? '<span class="shop-card__sold">Agotado</span>' : ''}
        </div>
        <div class="shop-card__body">
          <h3 class="shop-card__name">${p.title}</h3>
          <p class="shop-card__price">${price}</p>
          <button
            class="btn btn--solid shop-card__cta${!avail ? ' is-disabled' : ''}"
            data-variant-id="${variant?.id}"
            ${!avail ? 'disabled' : ''}
          >${avail ? 'Agregar al carrito' : 'Sin stock'}</button>
        </div>
      </article>`;
    }).join('');

    // Bind add-to-cart
    grid.querySelectorAll('.shop-card__cta:not(.is-disabled)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const vid = btn.dataset.variantId;
        const original = btn.textContent;
        btn.textContent = '…';
        btn.disabled = true;
        try {
          const cart = await addToCart(vid);
          renderCart(cart);
          openCartDrawer();
        } catch {
          btn.textContent = 'Error — intenta de nuevo';
          setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
          return;
        }
        btn.textContent = original;
        btn.disabled = false;
      });
    });

    // Trigger reveal animation
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
    } else {
      grid.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    }
  }

  // ── Render cart ─────────────────────────────────────────────────────────────
  function renderCart(cart) {
    const body     = document.getElementById('cart-body');
    const totalEl  = document.getElementById('cart-total');
    const checkBtn = document.getElementById('cart-checkout');
    const countEl  = document.getElementById('cart-count');
    if (!body) return;

    if (!cart || !cart.lines.edges.length) {
      body.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
      if (totalEl)  totalEl.textContent  = '';
      if (countEl)  countEl.textContent  = '';
      if (checkBtn) checkBtn.href = '#';
      return;
    }

    const totalItems = cart.lines.edges.reduce((s, e) => s + e.node.quantity, 0);
    if (countEl) countEl.textContent = totalItems > 0 ? String(totalItems) : '';

    body.innerHTML = cart.lines.edges.map(({ node: line }) => {
      const v   = line.merchandise;
      const img = v.product.images.edges[0]?.node;
      return `<div class="cart-line" data-line-id="${line.id}">
        ${img ? `<img src="${img.url}" alt="${v.product.title}" class="cart-line__img" />` : '<div class="cart-line__img cart-line__img--empty"></div>'}
        <div class="cart-line__info">
          <p class="cart-line__name">${v.product.title}</p>
          ${v.title !== 'Default Title' ? `<p class="cart-line__variant">${v.title}</p>` : ''}
          <p class="cart-line__price">${fmt(v.price.amount, v.price.currencyCode)} × ${line.quantity}</p>
        </div>
        <button class="cart-line__remove" data-line-id="${line.id}" aria-label="Eliminar">×</button>
      </div>`;
    }).join('');

    if (totalEl)  totalEl.textContent  = fmt(cart.cost.totalAmount.amount, cart.cost.totalAmount.currencyCode);
    if (checkBtn) { checkBtn.href = cart.checkoutUrl; checkBtn.target = '_blank'; checkBtn.rel = 'noopener noreferrer'; }

    body.querySelectorAll('.cart-line__remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.textContent = '…';
        btn.disabled = true;
        try {
          const updated = await removeFromCart(btn.dataset.lineId);
          renderCart(updated);
        } catch {
          btn.textContent = '×';
          btn.disabled = false;
        }
      });
    });
  }

  // ── Drawer open / close ─────────────────────────────────────────────────────
  function openCartDrawer() {
    document.getElementById('cart-drawer')?.classList.add('is-open');
    document.getElementById('cart-scrim')?.classList.add('is-open');
    document.body.classList.add('cart-open');
  }
  function closeCartDrawer() {
    document.getElementById('cart-drawer')?.classList.remove('is-open');
    document.getElementById('cart-scrim')?.classList.remove('is-open');
    document.body.classList.remove('cart-open');
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  async function init() {
    const grid = document.getElementById('shop-grid');

    if (!TOKEN) {
      if (grid) grid.innerHTML = `<p class="shop-empty shop-empty--warn">
        Falta el token de Storefront API.<br>
        Agrégalo en <code>window.LTV_STOREFRONT_TOKEN</code> dentro de <code>tienda.html</code>.
      </p>`;
      return;
    }

    // Load products
    try {
      const products = await fetchProducts();
      renderProducts(products);
    } catch {
      if (grid) grid.innerHTML = '<p class="shop-empty">No se pudieron cargar los productos. Intenta de nuevo.</p>';
    }

    // Restore cart count from existing cart
    try {
      const cart = await getCart();
      if (cart) renderCart(cart);
    } catch { /* cart may be expired, ignore */ }

    // Cart controls
    document.getElementById('cart-toggle')?.addEventListener('click', openCartDrawer);
    document.getElementById('cart-close')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-scrim')?.addEventListener('click', closeCartDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCartDrawer(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
