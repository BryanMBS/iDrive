# Importamos las librerías necesarias de FastAPI, HTTPException y status
from fastapi import APIRouter, HTTPException, status, Depends
# Importamos la clase BaseModel de pydantic
from pydantic import BaseModel
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import get_db_connection
from typing import List

# Creamos un enrutador de API llamado 
inscripcionesRtr = APIRouter()

class Inscripcion(BaseModel):
    id_estudiante: int
    id_clase: int

class ConteoInscritos(BaseModel):
    id_clase: int
    nombre_clase: str
    inscritos: int

@inscripcionesRtr.get(
    "/Clases_Agendadas/",
    response_model=List[Inscripcion],
    status_code=status.HTTP_200_OK,
    tags=['Gestion de Agendamiento']
)
async def get_inscripciones(db_conn = Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        selectAll_query = 'SELECT id_estudiante, id_clase FROM inscripciones'
        cursor.execute(selectAll_query)
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener las inscripciones")

# PUT - Actualizar la fecha de una clase agendada

class FechaUpdate(BaseModel):
    nueva_fecha: str  # Formato: 'YYYY-MM-DD'

@inscripcionesRtr.put(
    "/Modificar_Clases_Inscrita/cedula/{cedula}",
    status_code=status.HTTP_200_OK,
    tags=['Gestion de Agendamiento']
)
async def actualizar_fecha_clase(
    cedula: str,
    datos: FechaUpdate,
    db_conn = Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        # Buscar el id_estudiante basado en la cédula
        select_query = "SELECT id_usuario FROM usuarios WHERE cedula = %s"
        cursor.execute(select_query, (cedula,))
        estudiante = cursor.fetchone()

        if not estudiante:
            cursor.close()
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        id_estudiante = estudiante['id_usuario']

        # Actualizar la fecha en la tabla inscripciones
        update_query = "UPDATE inscripciones SET fecha_clase = %s WHERE id_estudiante = %s"
        cursor.execute(update_query, (datos.nueva_fecha, id_estudiante))
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Inscripción no encontrada para el estudiante")
        db_conn.commit()
        cursor.close()

        return {"message": "Fecha de clase actualizada correctamente"}
    except Exception:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar la fecha de la clase")

@inscripcionesRtr.get(
    "/conteo_por_clase/",
    response_model=List[ConteoInscritos],
    status_code=status.HTTP_200_OK,
    tags=['Gestion de Agendamiento']
)
async def get_conteo_inscritos_por_clase(db_conn = Depends(get_db_connection)):
    """
    Devuelve el número de estudiantes inscritos por clase.
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        query = """
            SELECT c.id_clase, c.nombre_clase, COUNT(i.id_estudiante) AS inscritos
            FROM clases c
            LEFT JOIN inscripciones i ON c.id_clase = i.id_clase
            GROUP BY c.id_clase, c.nombre_clase
            ORDER BY c.fecha_hora
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener el conteo de inscritos por clase")