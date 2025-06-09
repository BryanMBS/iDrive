# Roles.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from Clever_MySQL_conn import get_db_connection, logger

# --- Buena Práctica: Prefijos de API Consistentes ---
rolesRtr = APIRouter(prefix="/roles", tags=['Gestion de Roles'])

# --- Modelos Pydantic ---
class Role(BaseModel):
    id_rol: int
    nombre_rol: str
    
#------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener todos los roles de usuario
@rolesRtr.get("/", response_model=List[Role], summary="Obtener todos los roles de usuario")
def get_roles(db_conn=Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute('SELECT id_rol, nombre_rol FROM Roles ORDER BY nombre_rol')
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception as e:
        logger.error(f"Error al obtener roles: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener roles.")