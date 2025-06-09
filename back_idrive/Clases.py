# Clases.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import mysql.connector
from datetime import datetime
from Clever_MySQL_conn import get_db_connection, logger

clasesRtr = APIRouter(prefix="/clases", tags=['Gestion de Clases'])

# --- Modelos Pydantic ---

class ClaseCreate(BaseModel):
    nombre_clase: str
    descripcion: Optional[str] = None
    fecha_hora: datetime
    id_profesor: int
    id_salon: int
    cupos_disponibles: int = Field(gt=0)
    duracion_minutos: int = Field(default=60, gt=0)

class ClaseResponse(ClaseCreate):
    id_clase: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True

class ClaseUpdate(BaseModel):
    nombre_clase: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    id_profesor: Optional[int] = None
    id_salon: Optional[int] = None
    cupos_disponibles: Optional[int] = Field(None, gt=0)
    duracion_minutos: Optional[int] = Field(None, gt=0)

#-----------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para crear una nueva clase

@clasesRtr.post("/", response_model=ClaseResponse, status_code=status.HTTP_201_CREATED)
def create_clase(clase_data: ClaseCreate, db_conn=Depends(get_db_connection)):
    """
    Crea una nueva clase en la base de datos.
    """
    query = """
    INSERT INTO Clases (nombre_clase, descripcion, fecha_hora, id_profesor, id_salon,
        cupos_disponibles, duracion_minutos, fecha_creacion, fecha_actualizacion)
    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    """
    values = (clase_data.nombre_clase, clase_data.descripcion, clase_data.fecha_hora,
              clase_data.id_profesor, clase_data.id_salon, clase_data.cupos_disponibles,
              clase_data.duracion_minutos)

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, values)
        new_clase_id = cursor.lastrowid
        db_conn.commit()

        # Obtener la clase recién creada para la respuesta
        cursor.execute("SELECT * FROM Clases WHERE id_clase = %s", (new_clase_id,))
        new_clase = cursor.fetchone()
        cursor.close()

        if not new_clase:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar la clase creada.")
            
        logger.info(f"Clase creada con ID: {new_clase_id}")
        return new_clase
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1452:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profesor o Salón no encontrado.")
        logger.error(f"Error de base de datos al crear clase: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al crear clase.")

#-----------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener todas las clases

@clasesRtr.get("/", response_model=List[ClaseResponse])
def get_clases(db_conn=Depends(get_db_connection)):
    """
    Obtiene todas las clases registradas en la base de datos.
    """
    query = "SELECT * FROM Clases ORDER BY fecha_hora DESC"
    
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        clases = cursor.fetchall()
        cursor.close()

        if not clases:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontraron clases.")

        logger.info(f"Se encontraron {len(clases)} clases.")
        return clases
    except mysql.connector.Error as err:
        logger.error(f"Error al obtener clases: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")

#-----------------------------------------------------------------------------------------------------------------------------------------

# Endpoint para obtener una clase específica por ID
@clasesRtr.get("/{id_clase}", response_model=ClaseResponse)
def get_clase(id_clase: int, db_conn=Depends(get_db_connection)):
    """
    Obtiene los detalles de una clase específica por su ID.
    """
    query = "SELECT * FROM Clases WHERE id_clase = %s"
    
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, (id_clase,))
        clase = cursor.fetchone()
        cursor.close()

        if not clase:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada.")

        logger.info(f"Clase obtenida con ID: {id_clase}")
        return clase
    except mysql.connector.Error as err:
        logger.error(f"Error al obtener clase: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")

#-----------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para actualizar una clase existente
@clasesRtr.put("/{id_clase}", response_model=ClaseResponse)
def update_clase(id_clase: int, clase_data: ClaseUpdate, db_conn=Depends(get_db_connection)):
    """
    Actualiza los detalles de una clase existente.
    """
    query = """
    UPDATE Clases
    SET nombre_clase = COALESCE(%s, nombre_clase),
        descripcion = COALESCE(%s, descripcion),
        fecha_hora = COALESCE(%s, fecha_hora),
        id_profesor = COALESCE(%s, id_profesor),
        id_salon = COALESCE(%s, id_salon),
        cupos_disponibles = COALESCE(%s, cupos_disponibles),
        duracion_minutos = COALESCE(%s, duracion_minutos),
        fecha_actualizacion = NOW()
    WHERE id_clase = %s
    """
    
    values = (
        clase_data.nombre_clase, clase_data.descripcion, clase_data.fecha_hora,
        clase_data.id_profesor, clase_data.id_salon, clase_data.cupos_disponibles,
        clase_data.duracion_minutos, id_clase
    )

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, values)
        db_conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada o no se realizaron cambios.")

        # Obtener la clase actualizada para la respuesta
        cursor.execute("SELECT * FROM Clases WHERE id_clase = %s", (id_clase,))
        updated_clase = cursor.fetchone()
        cursor.close()

        logger.info(f"Clase actualizada con ID: {id_clase}")
        return updated_clase
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1452:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profesor o Salón no encontrado.")
        logger.error(f"Error de base de datos al actualizar clase: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al actualizar clase.")

#-----------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para eliminar una clase

@clasesRtr.delete("/{id_clase}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clase(id_clase: int, db_conn=Depends(get_db_connection)):
    """
    Elimina una clase existente por su ID.
    """
    query = "DELETE FROM Clases WHERE id_clase = %s"
    
    try:
        cursor = db_conn.cursor()
        cursor.execute(query, (id_clase,))
        db_conn.commit()
        cursor.close()

        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada.")

        logger.info(f"Clase eliminada con ID: {id_clase}")
    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error al eliminar clase: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")

#-----------------------------------------------------------------------------------------------------------------------------------------