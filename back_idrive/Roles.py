from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List
from Clever_MySQL_conn import cleverCursor, mysqlConn

rolesRtr = APIRouter()

# Modelo Pydantic para validación de datos
class RolesDB(BaseModel):
    nombre_rol: str

@rolesRtr.get("/Roles/", response_model=List[RolesDB], status_code=status.HTTP_200_OK, tags=['Gestion de roles'])
async def get_roles():
    try:
        selectAll_query = 'SELECT nombre_rol FROM roles'
        cleverCursor.execute(selectAll_query)
        result = cleverCursor.fetchall()

        # Si no se obtienen resultados, retornamos una lista vacía
        if not result:
            return []

        # Reformatear los datos para devolver una lista de diccionarios
        roles = [{"nombre_rol": row[0]} for row in result]

        return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener roles: {str(e)}")






