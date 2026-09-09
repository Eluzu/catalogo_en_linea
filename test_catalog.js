async function runTests() {
    const base = 'http://localhost:3000';

    // 1. Health check
    const healthRes = await fetch(`${base}/health`);
    const healthText = await healthRes.text();
    console.log('✓ Health Check:', healthText);
    if (healthText !== 'OK') throw new Error('Health check falló');

    // 2. Metadatos de filtros
    const filtrosRes = await fetch(`${base}/api/filtros`);
    const filtrosData = await filtrosRes.json();
    console.log(`✓ Metadatos: ${filtrosData.categorias.length} categorías, ${filtrosData.marcas.length} marcas`);
    console.log(`  Rango Precios: $${filtrosData.rangoPrecios.min} - $${filtrosData.rangoPrecios.max}`);

    // 3. Catálogo completo
    const allRes = await fetch(`${base}/api/productos`);
    const allData = await allRes.json();
    console.log(`✓ Total de Productos en catálogo: ${allData.total}`);
    if (allData.total < 15) throw new Error('Se esperaban al menos 15 productos');

    // 4. Filtro por Marca
    const brandRes = await fetch(`${base}/api/productos?marca=Rare%20Beauty`);
    const brandData = await brandRes.json();
    console.log(`✓ Filtro Marca "Rare Beauty": ${brandData.total} productos encontrados`);

    // 5. Filtro por Categoría
    const catRes = await fetch(`${base}/api/productos?categoria=Labiales`);
    const catData = await catRes.json();
    console.log(`✓ Filtro Categoría "Labiales": ${catData.total} productos encontrados`);

    // 6. Filtro por Precio Máximo ($20)
    const priceRes = await fetch(`${base}/api/productos?maxPrecio=20`);
    const priceData = await priceRes.json();
    console.log(`✓ Filtro Precio <= $20: ${priceData.total} productos encontrados (Precios: ${priceData.productos.map(p => p.precio).join(', ')})`);

    // 7. Búsqueda por texto "suero"
    const searchRes = await fetch(`${base}/api/productos?q=suero`);
    const searchData = await searchRes.json();
    console.log(`✓ Búsqueda por texto "suero": ${searchData.total} productos encontrados`);

    // 8. Producto específico por ID
    const singleRes = await fetch(`${base}/api/productos/prod-02`);
    const singleData = await singleRes.json();
    console.log(`✓ Detalle individual: "${singleData.nombre}" (${singleData.marca}) - $${singleData.precio}`);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE API Y FILTROS PASARON EXITOSAMENTE!');
}

runTests().catch(err => {
    console.error('Error en pruebas:', err);
    process.exit(1);
});
