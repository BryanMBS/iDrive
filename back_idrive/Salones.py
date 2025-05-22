# Importamos las librerías necesarias de FastAPI, HTTPException y status
from fastapi import APIRouter, HTTPException, status
# Importamos la clase BaseModel de pydantic
from pydantic import BaseModel
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import cleverCursor, mysqlConn
from datetime import datetime

# Creamos un enrutador de API llamado productoRtr
salonesRtr = APIRouter()

class salonesdb(BaseModel):
    nombre_salon: str
    ubicacion: str
    aforo: int

@salonesRtr.get("/Salones/", status_code=status.HTTP_302_FOUND, tags=['Infraestructura'])
async def get_users():
  selectAll_query = 'SELECT nombre_salon, ubicacion, aforo FROM salones'
  cleverCursor.execute(selectAll_query)
  result = cleverCursor.fetchall()
  return result