# exceptions.py
from fastapi import HTTPException, status
import mysql.connector
import logging

logger = logging.getLogger(__name__)

def handle_db_error(error: Exception, operation: str = "operación de base de datos"):
    """Manejo centralizado de errores de base de datos"""
    logger.error(f"Error en {operation}: {str(error)}")
    
    if isinstance(error, mysql.connector.IntegrityError):
        if error.errno == 1062:  # Duplicate entry
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El registro ya existe"
            )
        elif error.errno == 1452:  # Foreign key constraint
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referencia inválida a otro registro"
            )
    
    elif isinstance(error, mysql.connector.DataError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datos inválidos proporcionados"
        )
    
    elif isinstance(error, mysql.connector.OperationalError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible"
        )
    
    # Error genérico
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno del servidor"
    )