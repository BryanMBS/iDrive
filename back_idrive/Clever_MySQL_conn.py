# Clever_MySQL_conn.py
import mysql.connector
from mysql.connector import pooling
from fastapi import HTTPException, status
import logging
import os # Importar os para acceder a las variables de entorno

# --- Buena Práctica: Configuración de Logging ---
# Un logger centralizado ayuda a depurar y monitorear el comportamiento de la aplicación.
logger = logging.getLogger("idrive_app.database")
logger.setLevel(logging.INFO)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s') # Formato de log para mayor claridad de errores
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# --- Buena Práctica: Configuración desde Variables de Entorno ---
# Codificar credenciales directamente es un riesgo de seguridad significativo.
# Siempre carga datos sensibles desde variables de entorno.
# Ejemplo para producción:
# DB_HOST=tu_host_de_prod
# DB_USER=tu_usuario_de_prod
# DB_PASSWORD=tu_contraseña_de_prod
# etc.
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_DATABASE', 'DataBaseiDrive'),
    'port': int(os.getenv('DB_PORT', 3306))
}

db_connection_pool = None
try:
    # --- Buena Práctica: Pool de Conexiones ---
    # Un pool de conexiones pre-crea conexiones a la base de datos, lo que mejora
    # significativamente el rendimiento en una aplicación web al reutilizarlas entre solicitudes.
    db_connection_pool = pooling.MySQLConnectionPool(
        pool_name="fastapi_app_pool",
        pool_size=10, # Número máximo de conexiones en el pool
        pool_reset_session=True, # Asegura que el estado de la sesión esté limpio para cada nueva solicitud
        **DB_CONFIG
    )
    logger.info("✅ Pool de conexiones MySQL creado exitosamente.")
except mysql.connector.Error as err:
    logger.error(f"❌ FALLO al crear el Pool de conexiones MySQL: {err}")
    # Si el pool falla, la aplicación no puede conectarse a la BD.

def get_db_connection():
    """
    Dependencia de FastAPI para obtener una conexión a la base de datos del pool.
    Esta función se llamará para cada solicitud que necesite una conexión a la BD.
    Asegura que la conexión se cierre correctamente después de que finalice la solicitud.
    """
    if db_connection_pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El pool de conexiones de la base de datos no está disponible."
        )
    
    try:
        # Obtener una conexión del pool
        conn = db_connection_pool.get_connection()
        yield conn
    except mysql.connector.Error as err:
        logger.error(f"Error al obtener una conexión del pool: {err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar a la base de datos."
        )
    finally:
        # Este bloque asegura que la conexión sea devuelta al pool
        # incluso si ocurrió un error durante la solicitud.
        if 'conn' in locals() and conn.is_connected():
            conn.close()
            logger.debug("Conexión a la base de datos devuelta al pool.")