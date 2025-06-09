from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from Clever_MySQL_conn import get_db_connection

rolesRtr = APIRouter()

# Modelo Pydantic para validación de datos
class Role(BaseModel):
    nombre_rol: str

@rolesRtr.get(
    "/roles/",
    response_model=List[Role],
    status_code=status.HTTP_200_OK,
    tags=['Gestion de roles']
)
async def get_roles(db_conn = Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute('SELECT nombre_rol FROM roles')
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener roles")