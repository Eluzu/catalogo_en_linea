/**
 * AURA COSMÉTIQUE - Catálogo Interactivo en Línea
 * Lógica Reactiva de Filtros en Tiempo Real y Experiencia de Usuario
 */

// Estado Global de la Aplicación
const state = {
    productos: [],
    productosFiltrados: [],
    filtros: {
        busqueda: '',
        categoria: 'todas',
        marca: 'todas',
        maxPrecio: 100,
        orden: 'relevancia'
    },
    metaFiltros: {
        categorias: [],
        marcas: [],
        rangoPrecios: { min: 0, max: 100 },
        totalProductos: 0
    },
    carrito: JSON.parse(localStorage.getItem('aura_cart') || '[]'),
    productoModalActual: null
};

// Selectores del DOM
const DOM = {
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    brandSelect: document.getElementById('brand-select'),
    categoryPillsList: document.getElementById('category-pills-list'),
    priceRange: document.getElementById('price-range'),
    priceDisplay: document.getElementById('price-display'),
    minPriceLabel: document.getElementById('min-price-label'),
    maxPriceLabel: document.getElementById('max-price-label'),
    sortSelect: document.getElementById('sort-select'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    resultsCountText: document.getElementById('results-count-text'),
    activeTagsList: document.getElementById('active-tags-list'),
    productsGrid: document.getElementById('products-grid'),
    emptyState: document.getElementById('empty-state'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),
    loadingState: document.getElementById('loading-state'),
    brandLogoBtn: document.getElementById('brand-logo-btn'),

    // Modal
    quickViewModal: document.getElementById('quick-view-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalContentBody: document.getElementById('modal-content-body'),

    // Carrito
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    cartCloseBtn: document.getElementById('cart-close-btn'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartBackdrop: document.getElementById('cart-backdrop'),
    cartBadgeCount: document.getElementById('cart-badge-count'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    checkoutBtn: document.getElementById('checkout-btn'),

    // Toast
    toastNotification: document.getElementById('toast-notification'),
    toastMessage: document.getElementById('toast-message')
};

// ============================================================================
// Inicialización
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        mostrarCargando(true);
        await Promise.all([cargarMetadatosFiltros(), cargarProductos()]);
        inicializarControles();
        aplicarFiltros();
        actualizarBadgesCarrito();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarToast('Error al conectar con el servidor', true);
    } finally {
        mostrarCargando(false);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
});

// ============================================================================
// Carga de Datos desde API
// ============================================================================
async function cargarMetadatosFiltros() {
    try {
        const res = await fetch('/api/filtros');
        if (!res.ok) throw new Error('Error al obtener metadatos');
        const data = await res.json();
        state.metaFiltros = data;

        // Configurar Slider de Precios según datos
        const { min, max } = data.rangoPrecios;
        const precioMaximoRedondeado = Math.ceil(max);
        const precioMinimoRedondeado = Math.floor(min);

        DOM.priceRange.min = precioMinimoRedondeado;
        DOM.priceRange.max = precioMaximoRedondeado;
        DOM.priceRange.value = precioMaximoRedondeado;
        state.filtros.maxPrecio = precioMaximoRedondeado;

        DOM.minPriceLabel.textContent = `$${precioMinimoRedondeado}`;
        DOM.maxPriceLabel.textContent = `$${precioMaximoRedondeado}`;
        DOM.priceDisplay.textContent = `$${precioMaximoRedondeado}.00 USD`;

        // Llenar selector de Marcas
        poblarSelectorMarcas(data.marcas);

        // Llenar Pills de Categorías
        poblarPillsCategorias(data.categorias);
    } catch (err) {
        console.warn('Usando fallback para metadatos de filtros', err);
    }
}

async function cargarProductos() {
    const res = await fetch('/api/productos');
    if (!res.ok) throw new Error('Error al cargar productos');
    const data = await res.json();
    state.productos = data.productos || [];
    state.productosFiltrados = [...state.productos];
}

// ============================================================================
// Construcción Dinámica de Filtros
// ============================================================================
function poblarSelectorMarcas(marcas) {
    DOM.brandSelect.innerHTML = '<option value="todas">Todas las marcas (Todas)</option>';
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        DOM.brandSelect.appendChild(option);
    });
}

function poblarPillsCategorias(categorias) {
    // Mantener la opción 'Todas'
    DOM.categoryPillsList.innerHTML = `
        <button class="pill-btn ${state.filtros.categoria === 'todas' ? 'active' : ''}" data-category="todas">
            <span>Todas</span>
            <span class="pill-count">${state.productos.length}</span>
        </button>
    `;

    categorias.forEach(cat => {
        const count = state.productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase()).length;
        const btn = document.createElement('button');
        btn.className = `pill-btn ${state.filtros.categoria.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.innerHTML = `
            <span>${cat}</span>
            <span class="pill-count">${count}</span>
        `;
        DOM.categoryPillsList.appendChild(btn);
    });

    // Eventos para los pills
    DOM.categoryPillsList.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.categoryPillsList.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filtros.categoria = btn.dataset.category;
            aplicarFiltros();
        });
    });
}

// ============================================================================
// Event Listeners y Controles Interactivos
// ============================================================================
function inicializarControles() {
    // 1. Buscador en Vivo
    DOM.searchInput.addEventListener('input', (e) => {
        state.filtros.busqueda = e.target.value.trim().toLowerCase();
        DOM.clearSearchBtn.style.display = state.filtros.busqueda ? 'flex' : 'none';
        aplicarFiltros();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        state.filtros.busqueda = '';
        DOM.clearSearchBtn.style.display = 'none';
        DOM.searchInput.focus();
        aplicarFiltros();
    });

    // 2. Filtro por Marca
    DOM.brandSelect.addEventListener('change', (e) => {
        state.filtros.marca = e.target.value;
        aplicarFiltros();
    });

    // 3. Filtro por Rango de Precio (tiempo real continuo con 'input')
    DOM.priceRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.filtros.maxPrecio = val;
        DOM.priceDisplay.textContent = `$${val.toFixed(2)} USD`;
        aplicarFiltros();
    });

    // 4. Selector de Ordenamiento
    DOM.sortSelect.addEventListener('change', (e) => {
        state.filtros.orden = e.target.value;
        aplicarFiltros();
    });

    // 5. Botones de Restablecimiento
    DOM.resetFiltersBtn.addEventListener('click', resetearFiltros);
    DOM.emptyResetBtn.addEventListener('click', resetearFiltros);
    DOM.brandLogoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetearFiltros();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 6. Modal Quick View
    DOM.modalCloseBtn.addEventListener('click', cerrarModal);
    DOM.quickViewModal.addEventListener('click', (e) => {
        if (e.target === DOM.quickViewModal) {
            cerrarModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarCarrito();
        }
    });

    // 7. Carrito Drawer
    DOM.cartToggleBtn.addEventListener('click', abrirCarrito);
    DOM.cartCloseBtn.addEventListener('click', cerrarCarrito);
    DOM.cartBackdrop.addEventListener('click', cerrarCarrito);
    DOM.clearCartBtn.addEventListener('click', vaciarCarrito);
    DOM.checkoutBtn.addEventListener('click', simularCheckout);
}

// ============================================================================
// Lógica Central de Filtrado en Tiempo Real
// ============================================================================
function aplicarFiltros() {
    let res = [...state.productos];
    const { busqueda, categoria, marca, maxPrecio, orden } = state.filtros;

    // Filtro por Búsqueda de Texto
    if (busqueda) {
        res = res.filter(p => 
            p.nombre.toLowerCase().includes(busqueda) ||
            p.marca.toLowerCase().includes(busqueda) ||
            p.categoria.toLowerCase().includes(busqueda) ||
            p.descripcion.toLowerCase().includes(busqueda) ||
            (p.tono && p.tono.toLowerCase().includes(busqueda))
        );
    }

    // Filtro por Categoría
    if (categoria && categoria !== 'todas') {
        res = res.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }

    // Filtro por Marca
    if (marca && marca !== 'todas') {
        res = res.filter(p => p.marca.toLowerCase() === marca.toLowerCase());
    }

    // Filtro por Precio Máximo
    res = res.filter(p => p.precio <= maxPrecio);

    // Ordenamiento
    switch (orden) {
        case 'precio-asc':
            res.sort((a, b) => a.precio - b.precio);
            break;
        case 'precio-desc':
            res.sort((a, b) => b.precio - a.precio);
            break;
        case 'rating':
            res.sort((a, b) => b.rating - a.rating);
            break;
        case 'nombre-asc':
            res.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        default:
            // Relevancia por defecto (orden original del catálogo)
            break;
    }

    state.productosFiltrados = res;
    renderizarProductos(res);
    actualizarBarraFiltrosActivos();
}

// ============================================================================
// Renderizado del Catálogo de Productos
// ============================================================================
function renderizarProductos(productos) {
    // Actualizar Contador
    const total = state.productos.length;
    DOM.resultsCountText.innerHTML = `Mostrando <strong>${productos.length}</strong> de ${total} cosméticos`;

    if (productos.length === 0) {
        DOM.productsGrid.style.display = 'none';
        DOM.emptyState.style.display = 'block';
        return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.productsGrid.style.display = 'grid';

    DOM.productsGrid.innerHTML = productos.map(prod => {
        const estrellasHtml = generarEstrellasHtml(prod.rating);

        return `
            <article class="product-card" data-id="${prod.id}">
                <div class="card-media">
                    <img 
                        src="${prod.imagen}" 
                        alt="${prod.nombre}" 
                        class="card-image"
                        loading="lazy"
                        onerror="this.src='https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';"
                    >
                    <div class="card-badges">
                        <span class="badge-tag badge-category">${prod.categoria}</span>
                        ${prod.crueltyFree ? '<span class="badge-tag badge-cruelty">Cruelty-Free</span>' : ''}
                        ${prod.vegano ? '<span class="badge-tag badge-vegan">Vegano</span>' : ''}
                    </div>
                    <div class="card-quick-view">
                        <button class="quick-view-btn" data-id="${prod.id}">
                            <i data-lucide="eye"></i>
                            <span>Vista Rápida</span>
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <span class="card-brand">${prod.marca}</span>
                    <h3 class="card-title" title="${prod.nombre}">${prod.nombre}</h3>
                    <p class="card-variant">${prod.tono ? `Tono: ${prod.tono}` : (prod.volumen || 'Edición Estándar')}</p>

                    <div class="card-rating-wrap">
                        <div class="stars-list">${estrellasHtml}</div>
                        <span class="rating-score">${prod.rating.toFixed(1)}</span>
                        <span class="rating-reviews">(${prod.resenas})</span>
                    </div>

                    <div class="card-footer">
                        <div class="card-price-block">
                            <span class="card-price-currency">Precio</span>
                            <span class="card-price-value">$${prod.precio.toFixed(2)}</span>
                        </div>
                        <button class="add-bag-btn" data-id="${prod.id}" title="Añadir a la bolsa de compras" aria-label="Añadir ${prod.nombre} a la bolsa">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Re-vincular iconos Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Vincular Eventos de Tarjetas
    DOM.productsGrid.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            abrirModalProducto(id);
        });
    });

    DOM.productsGrid.querySelectorAll('.add-bag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            agregarAlCarrito(id);
        });
    });
}

// ============================================================================
// Barra de Filtros Activos (Chips dinámicos)
// ============================================================================
function actualizarBarraFiltrosActivos() {
    const chips = [];

    // Chip de Búsqueda
    if (state.filtros.busqueda) {
        chips.push({
            label: `Búsqueda: "${state.filtros.busqueda}"`,
            remove: () => {
                DOM.searchInput.value = '';
                state.filtros.busqueda = '';
                DOM.clearSearchBtn.style.display = 'none';
                aplicarFiltros();
            }
        });
    }

    // Chip de Categoría
    if (state.filtros.categoria !== 'todas') {
        chips.push({
            label: `Categoría: ${state.filtros.categoria}`,
            remove: () => {
                state.filtros.categoria = 'todas';
                DOM.categoryPillsList.querySelectorAll('.pill-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.category === 'todas');
                });
                aplicarFiltros();
            }
        });
    }

    // Chip de Marca
    if (state.filtros.marca !== 'todas') {
        chips.push({
            label: `Marca: ${state.filtros.marca}`,
            remove: () => {
                state.filtros.marca = 'todas';
                DOM.brandSelect.value = 'todas';
                aplicarFiltros();
            }
        });
    }

    // Chip de Precio Máximo
    const maxPermitido = parseFloat(DOM.priceRange.max);
    if (state.filtros.maxPrecio < maxPermitido) {
        chips.push({
            label: `Hasta $${state.filtros.maxPrecio.toFixed(2)}`,
            remove: () => {
                state.filtros.maxPrecio = maxPermitido;
                DOM.priceRange.value = maxPermitido;
                DOM.priceDisplay.textContent = `$${maxPermitido.toFixed(2)} USD`;
                aplicarFiltros();
            }
        });
    }

    // Renderizar Chips
    DOM.activeTagsList.innerHTML = '';
    chips.forEach(chip => {
        const el = document.createElement('span');
        el.className = 'filter-chip';
        el.innerHTML = `
            <span>${chip.label}</span>
            <button aria-label="Quitar filtro"><i data-lucide="x"></i></button>
        `;
        el.querySelector('button').addEventListener('click', chip.remove);
        DOM.activeTagsList.appendChild(el);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function resetearFiltros() {
    state.filtros = {
        busqueda: '',
        categoria: 'todas',
        marca: 'todas',
        maxPrecio: parseFloat(DOM.priceRange.max),
        orden: 'relevancia'
    };

    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    DOM.brandSelect.value = 'todas';
    DOM.priceRange.value = DOM.priceRange.max;
    DOM.priceDisplay.textContent = `$${parseFloat(DOM.priceRange.max).toFixed(2)} USD`;
    DOM.sortSelect.value = 'relevancia';

    DOM.categoryPillsList.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'todas');
    });

    aplicarFiltros();
    mostrarToast('Filtros restablecidos');
}

// ============================================================================
// Modal de Vista Rápida (Quick View)
// ============================================================================
function abrirModalProducto(id) {
    const prod = state.productos.find(p => p.id === id);
    if (!prod) return;

    state.productoModalActual = prod;
    const estrellasHtml = generarEstrellasHtml(prod.rating);

    DOM.modalContentBody.innerHTML = `
        <div class="modal-product-layout">
            <div class="modal-media">
                <img 
                    src="${prod.imagen}" 
                    alt="${prod.nombre}"
                    onerror="this.src='https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80';"
                >
            </div>
            <div class="modal-details">
                <span class="modal-brand">${prod.marca}</span>
                <h2 class="modal-title">${prod.nombre}</h2>

                <div class="modal-price-rating">
                    <span class="modal-price">$${prod.precio.toFixed(2)} USD</span>
                    <div class="card-rating-wrap" style="margin-bottom:0;">
                        <div class="stars-list">${estrellasHtml}</div>
                        <span class="rating-score">${prod.rating.toFixed(1)}</span>
                        <span class="rating-reviews">(${prod.resenas} opiniones)</span>
                    </div>
                </div>

                <p class="modal-desc">${prod.descripcion}</p>

                <div class="modal-meta-grid">
                    <div class="meta-box">
                        <span class="meta-box-label">Categoría</span>
                        <p class="meta-box-val">${prod.categoria}</p>
                    </div>
                    <div class="meta-box">
                        <span class="meta-box-label">Presentación / Tono</span>
                        <p class="meta-box-val">${prod.tono || 'Original'}</p>
                    </div>
                    <div class="meta-box">
                        <span class="meta-box-label">Volumen</span>
                        <p class="meta-box-val">${prod.volumen || 'Estándar'}</p>
                    </div>
                    <div class="meta-box">
                        <span class="meta-box-label">Sostenibilidad</span>
                        <p class="meta-box-val">${prod.crueltyFree ? '🌿 Cruelty-Free' : 'Certificado'} ${prod.vegano ? '• Vegano' : ''}</p>
                    </div>
                </div>

                ${prod.beneficios && prod.beneficios.length ? `
                    <div class="modal-benefits">
                        <h4>Beneficios Clave:</h4>
                        <ul class="benefits-list">
                            ${prod.beneficios.map(b => `<li><i data-lucide="check"></i> <span>${b}</span></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="modal-actions">
                    <button class="modal-add-btn" id="modal-add-cart-btn">
                        <i data-lucide="shopping-bag"></i>
                        <span>Añadir a mi Bolsa • $${prod.precio.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
        agregarAlCarrito(prod.id);
        cerrarModal();
    });

    DOM.quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function cerrarModal() {
    DOM.quickViewModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================================
// Carrito / Bolsa Interactiva
// ============================================================================
function agregarAlCarrito(id) {
    const prod = state.productos.find(p => p.id === id);
    if (!prod) return;

    const itemExistente = state.carrito.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        state.carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            marca: prod.marca,
            precio: prod.precio,
            imagen: prod.imagen,
            cantidad: 1
        });
    }

    guardarCarrito();
    actualizarBadgesCarrito();
    mostrarToast(`✨ "${prod.nombre}" añadido a tu bolsa`);
}

function cambiarCantidadCarrito(id, delta) {
    const item = state.carrito.find(i => i.id === id);
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        state.carrito = state.carrito.filter(i => i.id !== id);
    }

    guardarCarrito();
    actualizarBadgesCarrito();
    renderizarCarrito();
}

function guardarCarrito() {
    localStorage.setItem('aura_cart', JSON.stringify(state.carrito));
}

function actualizarBadgesCarrito() {
    const totalUnidades = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    DOM.cartBadgeCount.textContent = totalUnidades;
}

function abrirCarrito() {
    renderizarCarrito();
    DOM.cartDrawer.classList.add('active');
    DOM.cartBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    DOM.cartDrawer.classList.remove('active');
    DOM.cartBackdrop.classList.remove('active');
    document.body.style.overflow = '';
}

function renderizarCarrito() {
    if (state.carrito.length === 0) {
        DOM.cartItemsList.innerHTML = `
            <div class="cart-empty-message">
                <i data-lucide="shopping-bag" style="width:40px;height:40px;margin-bottom:12px;opacity:0.4;"></i>
                <p>Tu bolsa de belleza está vacía.</p>
                <p style="font-size:0.8125rem;margin-top:6px;">¡Explora nuestros cosméticos exclusivos y añade tus favoritos!</p>
            </div>
        `;
        DOM.cartSubtotal.textContent = '$0.00';
    } else {
        let subtotal = 0;
        DOM.cartItemsList.innerHTML = state.carrito.map(item => {
            const itemTotal = item.precio * item.cantidad;
            subtotal += itemTotal;
            return `
                <div class="cart-item">
                    <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
                    <div class="cart-item-info">
                        <span class="cart-item-brand">${item.marca}</span>
                        <h4 class="cart-item-title">${item.nombre}</h4>
                        <span class="cart-item-price">$${item.precio.toFixed(2)}</span>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" data-action="dec" data-id="${item.id}">-</button>
                        <span>${item.cantidad}</span>
                        <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
                    </div>
                </div>
            `;
        }).join('');

        DOM.cartSubtotal.textContent = `$${subtotal.toFixed(2)} USD`;

        DOM.cartItemsList.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                cambiarCantidadCarrito(id, delta);
            });
        });
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function vaciarCarrito() {
    state.carrito = [];
    guardarCarrito();
    actualizarBadgesCarrito();
    renderizarCarrito();
    mostrarToast('Bolsa vaciada');
}

function simularCheckout() {
    if (state.carrito.length === 0) {
        mostrarToast('Tu bolsa está vacía actualmente');
        return;
    }
    mostrarToast('🛍️ ¡Pedido de prueba generado exitosamente!');
    vaciarCarrito();
    cerrarCarrito();
}

// ============================================================================
// Utilidades de UI
// ============================================================================
function generarEstrellasHtml(rating) {
    const fullStars = Math.floor(rating);
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += `<i data-lucide="star" style="${i < fullStars ? 'fill: currentColor;' : 'opacity: 0.35;'}"></i>`;
    }
    return stars;
}

let toastTimer = null;
function mostrarToast(mensaje) {
    DOM.toastMessage.textContent = mensaje;
    DOM.toastNotification.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        DOM.toastNotification.classList.remove('show');
    }, 3200);
}

function mostrarCargando(mostrar) {
    DOM.loadingState.style.display = mostrar ? 'block' : 'none';
    DOM.productsGrid.style.display = mostrar ? 'none' : 'grid';
}
