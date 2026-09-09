# ✦ AURA Cosmétique - Catálogo Interactivo en Línea

> **Actividad:** Diseño, desarrollo y despliegue de un catálogo en línea interactivo para una tienda de cosméticos y belleza de alta gama, respetando la arquitectura de Node.js, Express y Docker con soporte para Despliegue Continuo (CD).

---

## 🌸 Descripción del Proyecto

**AURA Cosmétique** es una aplicación web interactiva que presenta una selecta colección de 16 productos cosméticos de marcas líderes (Fenty Beauty, Rare Beauty, Charlotte Tilbury, The Ordinary, MAC, NARS, Glossier, Clinique, Maybelline, Laneige).

La información no reside en una base de datos relacional tradicional, sino en un archivo estructurado en formato **JSON** (`data/productos.json`), permitiendo desacoplamiento, rapidez de lectura y portabilidad en entornos contenerizados con **Docker**.

---

## ✨ Características y Requisitos Implementados

### 1. Temática y Datos del Catálogo (JSON)
- **Temática:** Cosméticos, maquillaje y cuidado facial de alta gama.
- **Fuente de Datos:** `data/productos.json` con **16 cosméticos** completos y detallados.
- **Atributos por producto:**
  - `id`: Identificador único.
  - `nombre`: Nombre comercial del producto.
  - `marca`: Marca fabricante (Fenty Beauty, Rare Beauty, etc.).
  - `categoria`: Categoría/tipo (*Cuidado Facial*, *Labiales*, *Bases y Rostro*, *Ojos y Máscaras*, *Rubores e Iluminadores*).
  - `precio`: Valor numérico en USD.
  - `imagen`: Enlace a fotografía de alta resolución.
  - `descripcion`: Reseña y propiedades del cosmético.
  - `rating` y `resenas`: Calificación por estrellas (1 a 5) y cantidad de valoraciones.
  - `tono` / `volumen`: Tono de color y presentación.
  - `beneficios`: Lista de ventajas dermatológicas.
  - `crueltyFree` y `vegano`: Indicadores éticos y sostenibles.
  - `enStock`: Disponibilidad en inventario.

### 2. Funcionalidades de la Página Web
- **Visualización Atractiva:**
  - Diseño responsive y elegante en tonos nude, blush y champán con tipografía refinada (*Playfair Display* y *Plus Jakarta Sans*).
  - Grid de tarjetas de producto con badges de sostenibilidad, precio en formato monetario y botón de acción.
  - **Modal de Vista Rápida (*Quick View*):** Detalle completo del cosmético, lista de beneficios, ingredientes y selector interactivo.
  - **Bolsa de Compras Interactiva (*Slide-over Drawer*):** Contador dinámico, cálculo de subtotales y simulación de compra con persistencia en `localStorage`.

- **Filtros Interactivos en Tiempo Real (Mínimo 3 Criterios Cumplidos):**
  1. 🏷️ **Filtro por Marca:** Selector desplegable con actualización instantánea por marca específica o catálogo completo.
  2. 💄 **Filtro por Tipo o Categoría:** Pills/chips interactivos con conteo dinámico de productos por categoría (*Cuidado Facial*, *Labiales*, *Bases y Rostro*, *Ojos y Máscaras*, *Rubores e Iluminadores*).
  3. 💰 **Filtro por Rango de Precio:** Control deslizante interactivo en tiempo real con visualización del valor tope actual ($9.90 - $65.00).
  4. 🔍 **Buscador predictivo por texto:** Búsqueda en vivo por nombre, marca, categoría o descripción.
  5. 🔄 **Ordenamiento:** Por precio (menor a mayor / mayor a menor), mejor valorados y orden alfabético.
  6. 🧹 **Botón Limpiar Filtros & Chips Dinámicos:** Muestra los filtros activos aplicados y permite restaurar el catálogo con un solo clic.

---

## 🛠️ Arquitectura y Tecnologías

- **Runtime & Servidor:** Node.js (v18+) con Express.
- **Frontend:** HTML5 semántico, CSS3 moderno (Variables CSS, Grid, Flexbox, Glassmorphism) y JavaScript Vanilla reactivo.
- **Iconografía:** Lucide Icons.
- **Contenedorización:** Docker con imagen base ligera `node:18-alpine`.
- **Health Check:** Endpoint `/health` para monitorización de contenedores y pipelines de Integración y Despliegue Continuo (CI/CD).

---

## 🚀 Instrucciones de Ejecución

### Opción A: Ejecución Local con Node.js

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor:**
   ```bash
   npm start
   ```

3. **Abrir en el navegador:**
   Accede a [http://localhost:3000](http://localhost:3000)

---

### Opción B: Ejecución con Docker

1. **Construir la imagen de Docker:**
   ```bash
   docker build -t catalogo-cosmeticos .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -d -p 3000:3000 --name catalogo-app catalogo-cosmeticos
   ```

3. **Verificar el estado del contenedor (Health Check):**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Detener el contenedor:**
   ```bash
   docker stop catalogo-app
   docker rm catalogo-app
   ```

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Estado de salud del servicio (retorna HTTP 200 para Docker/CD) |
| `GET` | `/api/productos` | Obtiene el catálogo completo o filtrado (`?marca=...&categoria=...&maxPrecio=...&q=...`) |
| `GET` | `/api/productos/:id` | Retorna los detalles de un cosmético específico |
| `GET` | `/api/filtros` | Retorna metadatos de marcas, categorías y rangos de precio |

---

## 📂 Estructura del Proyecto

```text
catalogo_en_linea/
├── data/
│   └── productos.json          # Catálogo de 16 cosméticos en formato JSON
├── public/
│   ├── index.html              # Estructura semántica del catálogo
│   ├── styles.css              # Sistema de diseño, layout responsive y estilos
│   └── app.js                  # Lógica reactiva de filtros, modal y carrito
├── .dockerignore               # Archivos excluidos en la construcción de Docker
├── Dockerfile                  # Especificación del contenedor alpine de producción
├── package.json                # Dependencias y scripts de npm (start, dev)
├── server.js                   # Servidor Express, API REST y archivos estáticos
└── README.md                   # Documentación técnica del proyecto
```
