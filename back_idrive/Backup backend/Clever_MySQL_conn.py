# Clever_MySQL_conn.py
import mysql.connector
from mysql.connector import pooling
from fastapi import HTTPException, status
import logging

logger = logging.getLogger("idrive.db")
logger.setLevel(logging.INFO)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # Usa variables de entorno en producción
    'database': 'DataBaseiDrive',
    'port': 3306
}

try:
    db_connection_pool = pooling.MySQLConnectionPool(
        pool_name="fastapi_app_pool",
        pool_size=10,
        raw=False,
        **DB_CONFIG
    )
    logger.info("Pool de conexiones MySQL creado exitosamente.")
except mysql.connector.Error as err:
    logger.error(f"ERROR: No se pudo crear el pool de conexiones MySQL: {err}")
    db_connection_pool = None

def get_db_connection():
    if db_connection_pool is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="El pool de conexiones de la base de datos no está inicializado."
        )
    conn = db_connection_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()