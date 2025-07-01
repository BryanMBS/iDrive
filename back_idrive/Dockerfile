# Usamos una imagen oficial de Python como base.
# La versión 'slim' es más ligera que la completa.
FROM python:3.11-slim

# Establecemos el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copiamos primero el archivo de requisitos.
# Esto aprovecha el cache de Docker: si el archivo no cambia, no se reinstalan las dependencias.
COPY requirements.txt .

# Instalamos todas las dependencias de Python listadas en el archivo.
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código fuente del backend al directorio de trabajo.
COPY . .

# Exponemos el puerto 8000, que es donde correrá nuestra API.
EXPOSE 8000

# El comando para iniciar la aplicación cuando el contenedor se ejecute.
# 'uvicorn main:iDriveApp' -> Ejecuta la instancia 'iDriveApp' del archivo 'main.py'.
# '--host 0.0.0.0' -> Permite que el servidor sea accesible desde fuera del contenedor.
# '--port 8000' -> El puerto que usará Uvicorn.
CMD ["uvicorn", "main:iDriveApp", "--host", "0.0.0.0", "--port", "8000"]
