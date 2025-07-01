# ---- Etapa 1: Compilación (Build) ----
# Usamos una imagen oficial de Node.js como base para la compilación.
# La etiqueta 'alpine' se refiere a una versión ligera, ideal para CI/CD.
FROM node:18-alpine AS build

# Establecemos el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copiamos los archivos de manifiesto del proyecto.
# Usamos 'COPY' en lugar de copiar todo para aprovechar el cache de Docker.
# Si estos archivos no cambian, Docker no volverá a instalar las dependencias.
COPY package.json ./
COPY package-lock.json ./

# Instalamos todas las dependencias del proyecto.
RUN npm install

# Copiamos el resto de los archivos fuente de la aplicación.
COPY . .

# Creamos la compilación de producción de la aplicación.
# Esto genera una carpeta 'build' con archivos HTML, CSS y JS optimizados.
RUN npm run build

# ---- Etapa 2: Servidor (Serve) ----
# Usamos una imagen de Node.js más pequeña para la etapa final.
FROM node:18-alpine

# Establecemos el directorio de trabajo.
WORKDIR /app

# Copiamos únicamente la carpeta 'build' optimizada desde la etapa anterior.
COPY --from=build /app/build .

# Instalamos 'serve', un servidor estático simple y eficiente para producción.
RUN npm install -g serve

# Exponemos el puerto 3000, que es el puerto por defecto de 'serve'.
EXPOSE 3000

# El comando final que se ejecutará cuando el contenedor inicie.
# 'serve -s .' sirve el contenido de la carpeta actual y gestiona correctamente las rutas de React.
CMD ["serve", "-s", "."]
