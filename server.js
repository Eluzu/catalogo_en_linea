const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'productos.json');

// Middleware para parsing de JSON
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Función auxiliar para leer productos desde el archivo JSON
function getProductos() {
    try {
        const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error al leer el archivo productos.json:', error);
        return [];
    }
}

// Endpoint de verificación de salud (Health Check)
app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

// Endpoint para obtener todos los productos con soporte de filtros opcionales
app.get('/api/productos', (req, res) => {
    let productos = getProductos();
    const { marca, categoria, maxPrecio, minPrecio, q, orden } = req.query;

    // Filtro por texto de búsqueda
    if (q) {
        const query = q.toLowerCase().trim();
        productos = productos.filter(p =>
            p.nombre.toLowerCase().includes(query) ||
            p.marca.toLowerCase().includes(query) ||
            p.descripcion.toLowerCase().includes(query) ||
            p.categoria.toLowerCase().includes(query)
        );
    }

    // Filtro por marca
    if (marca && marca !== 'todas') {
        const marcasSeleccionadas = Array.isArray(marca) ? marca : [marca];
        productos = productos.filter(p => marcasSeleccionadas.includes(p.marca));
    }

    // Filtro por categoría
    if (categoria && categoria !== 'todas') {
        productos = productos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }

    // Filtro por precio mínimo
    if (minPrecio) {
        const min = parseFloat(minPrecio);
        if (!isNaN(min)) {
            productos = productos.filter(p => p.precio >= min);
        }
    }

    // Filtro por precio máximo
    if (maxPrecio) {
        const max = parseFloat(maxPrecio);
        if (!isNaN(max)) {
            productos = productos.filter(p => p.precio <= max);
        }
    }

    // Ordenamiento
    if (orden) {
        if (orden === 'precio-asc') {
            productos.sort((a, b) => a.precio - b.precio);
        } else if (orden === 'precio-desc') {
            productos.sort((a, b) => b.precio - a.precio);
        } else if (orden === 'rating') {
            productos.sort((a, b) => b.rating - a.rating);
        } else if (orden === 'nombre-asc') {
            productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }
    }

    res.json({
        total: productos.length,
        productos
    });
});

// Endpoint para obtener metadatos de filtros (marcas, categorías, rango de precios)
app.get('/api/filtros', (req, res) => {
    const productos = getProductos();
    const categorias = [...new Set(productos.map(p => p.categoria))];
    const marcas = [...new Set(productos.map(p => p.marca))].sort();
    const precios = productos.map(p => p.precio);
    const minPrecio = precios.length ? Math.min(...precios) : 0;
    const maxPrecio = precios.length ? Math.max(...precios) : 100;

    res.json({
        categorias,
        marcas,
        rangoPrecios: {
            min: minPrecio,
            max: maxPrecio
        },
        totalProductos: productos.length
    });
});

// Endpoint para consultar un producto por ID
app.get('/api/productos/:id', (req, res) => {
    const productos = getProductos();
    const producto = productos.find(p => p.id === req.params.id);

    if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
});

// Ruta de respaldo para SPA / Frontend
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✨ Servidor de Catálogo en Línea ejecutándose en http://localhost:${PORT}`);
});
