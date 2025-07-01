# Usamos la imagen oficial de MySQL 8.0 como base.
FROM mysql:8.0

# Copiamos nuestro script SQL al directorio de inicialización de Docker.
# El contenedor de MySQL ejecutará automáticamente cualquier script .sql
# que encuentre en esta carpeta la primera vez que se inicie.
COPY Script_iDrive_DB_corregida.sql /docker-entrypoint-initdb.d/