# Importamos las librerías necesarias de FastAPI, HTTPException y status
from fastapi import APIRouter, HTTPException, status
# Importamos la clase BaseModel de pydantic
from pydantic import BaseModel
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import cleverCursor, mysqlConn
from datetime import datetime

# Creamos un enrutador de API llamado 
inscripcionesRtr = APIRouter()

class inscripcionesdb(BaseModel):
    id_estudiante: int
    id_clase: int
  

@inscripcionesRtr.get("/Clases_Agendadas/", status_code=status.HTTP_302_FOUND, tags=['Gestion de Agendamiento'])
async def get_users():
  selectAll_query = 'SELECT id_estudiante, id clase FROM inscrpciones'
  cleverCursor.execute(selectAll_query)
  result = cleverCursor.fetchall()
  return result

# PUT - Actualizar la fecha de una clase agendada

class FechaUpdate(BaseModel):
    nueva_fecha: str  # Formato: 'YYYY-MM-DD'

@inscripcionesRtr.put("/Modificar_Clases_Inscrita/cedula/{cedula}", status_code=status.HTTP_200_OK, tags=['Gestion de Agendamiento'])
async def actualizar_fecha_clase(cedula: str, datos: FechaUpdate):
    # Buscar el id_estudiante basado en la cédula
    select_query = "SELECT id_usuario FROM usuarios WHERE cedula = %s"
    cleverCursor.execute(select_query, (cedula,))
    estudiante = cleverCursor.fetchone()

    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    id_estudiante = estudiante['id_usuario']

    # Actualizar la fecha en la tabla inscripciones
    update_query = "UPDATE inscripciones SET fecha_clase = %s WHERE id_estudiante = %s"
    cleverCursor.execute(update_query, (datos.nueva_fecha, id_estudiante))
    mysqlConn.commit()

    return {"message": "Fecha de clase actualizada correctamente"}

