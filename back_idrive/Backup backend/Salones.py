# Importamos las librerías necesarias de FastAPI, HTTPException y status
from fastapi import APIRouter, HTTPException, status, Depends
# Importamos la clase BaseModel de pydantic
from pydantic import BaseModel
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import get_db_connection
from typing import List

# Creamos un enrutador de API llamado productoRtr
salonesRtr = APIRouter()

class Salon(BaseModel):
    nombre_salon: str
    ubicacion: str
    aforo: int

@salonesRtr.get(
    "/salones/",
    response_model=List[Salon],
    status_code=status.HTTP_200_OK,
    tags=['Infraestructura']
)
async def get_salones(db_conn = Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute('SELECT nombre_salon, ubicacion, aforo FROM salones')
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener los salones")