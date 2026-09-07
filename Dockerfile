# Usar imagen liviana de Node.js
FROM node:18-alpine

# Definir directorio de trabajo
WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para arrancar la aplicación
CMD ["node", "server.js"]
