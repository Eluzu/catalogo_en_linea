const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint principal
app.get('/', (req, res) => {
    res.json({
        message: "¡Hola! Mi aplicación ha sido desplegada automáticamente en Render 🚀",
        version: "1.0.0",
        status: "OK"
    });
});

// Endpoint de verificación de salud (Health Check)
app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
