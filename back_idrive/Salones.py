# Salones.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from Clever_MySQL_conn import get_db_connection, logger

salonesRtr = APIRouter(prefix="/salones", tags=['Infraestructura'])

# --- Modelos Pydantic ---
class Salon(BaseModel):
    id_salon: int
    nombre_salon: str
    ubicacion: str
    aforo: int

#-----------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener todos los salones de clase disponibles
@salonesRtr.get("/", response_model=List[Salon], summary="Obtener todos los salones de clase disponibles")
def get_salones(db_conn=Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute('SELECT id_salon, nombre_salon, ubicacion, aforo FROM Salones ORDER BY nombre_salon')
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception as e:
        logger.error(f"Error al obtener salones: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener salones.")