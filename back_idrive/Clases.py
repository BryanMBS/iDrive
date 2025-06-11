# Clases.py
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List
from datetime import datetime
import mysql.connector

from Clever_MySQL_conn import get_db_connection, logger
# CAMBIO: Importar modelos desde el nuevo archivo centralizado
from schemas import ClaseCreate, ClaseResponse, ClaseUpdate
# CAMBIO: Importar la dependencia de permisos
from auth import has_permission

clasesRtr = APIRouter(prefix="/clases", tags=['Gestion de Clases'])

# --- LOS MODELOS PYDANTIC HAN SIDO MOVIDOS A schemas.py ---

# --- Endpoints Protegidos ---

@clasesRtr.post(
    "/", 
    response_model=ClaseResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Programar una nueva clase",
    dependencies=[Depends(has_permission("clases:crear"))]  # <-- RUTA PROTEGIDA
)
def create_clase(clase_data: ClaseCreate, db_conn=Depends(get_db_connection)):
    """
    Crea una nueva clase en la base de datos.
    Solo los usuarios con el permiso 'clases:crear' pueden acceder.
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
        cursor.execute("SELECT * FROM Clases WHERE id_clase = %s", (new_clase_id,))
        new_clase = cursor.fetchone()
        cursor.close()
        if not new_clase:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar la clase creada.")
        return new_clase
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1452:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "El profesor o salón especificado no existe.")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al crear la clase.")


@clasesRtr.put(
    "/{id_clase}",
    response_model=ClaseResponse,
    summary="Actualizar una clase existente",
    dependencies=[Depends(has_permission("clases:editar"))]  # <-- RUTA PROTEGIDA
)
def update_clase(id_clase: int, clase_data: ClaseUpdate, db_conn=Depends(get_db_connection)):
    """
    Actualiza una clase existente.
    Solo los usuarios con el permiso 'clases:editar' pueden acceder.
    """
    update_data = clase_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No se proporcionaron datos para actualizar.")
    
    set_clause = [f"{key} = %s" for key in update_data.keys()]
    values = list(update_data.values())
    values.append(id_clase)
    
    query = f"UPDATE Clases SET {', '.join(set_clause)}, fecha_actualizacion = NOW() WHERE id_clase = %s"
    
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, tuple(values))
        db_conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada.")
        
        cursor.execute("SELECT * FROM Clases WHERE id_clase = %s", (id_clase,))
        updated_clase = cursor.fetchone()
        cursor.close()
        return updated_clase
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al actualizar la clase.")


@clasesRtr.delete(
    "/{id_clase}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una clase",
    dependencies=[Depends(has_permission("clases:eliminar"))]
)
def delete_clase(id_clase: int, db_conn=Depends(get_db_connection)):
    """
    Elimina una clase existente por su ID.
    Primero verifica que no tenga agendamientos asociados para mantener
    la integridad de los datos.
    """
    try:
        cursor = db_conn.cursor()

        # --- CAMBIO: Verificación previa de agendamientos existentes ---
        check_query = "SELECT COUNT(*) FROM Agendamientos WHERE id_clase = %s"
        cursor.execute(check_query, (id_clase,))
        agendamientos_count = cursor.fetchone()[0]

        if agendamientos_count > 0:
            # Si hay agendamientos, no se puede eliminar la clase.
            logger.warning(f"Intento de eliminar la clase {id_clase} que tiene {agendamientos_count} agendamientos.")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, # 409 Conflict es un buen código para esta situación
                detail=f"No se puede eliminar la clase porque tiene {agendamientos_count} estudiante(s) agendado(s). Por favor, cancele los agendamientos primero."
            )
        
        # Si no hay agendamientos, procedemos a eliminar la clase
        delete_query = "DELETE FROM Clases WHERE id_clase = %s"
        cursor.execute(delete_query, (id_clase,))
        db_conn.commit()
        
        if cursor.rowcount == 0:
            # Esto ocurriría si la clase no existía desde el principio
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada.")

        logger.info(f"Clase eliminada con ID: {id_clase}")
        cursor.close()

    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error de base de datos al eliminar clase: {err}")
        # Se devuelve un error genérico si algo más falla
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")


# --- Endpoints Públicos (sin protección de permisos) ---

@clasesRtr.get("/", response_model=List[ClaseResponse], summary="Obtener todas las clases")
def get_clases(db_conn=Depends(get_db_connection)):
    """Obtiene una lista de todas las clases. Este endpoint es público."""
    query = "SELECT * FROM Clases ORDER BY fecha_hora DESC"
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        return cursor.fetchall()
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")


@clasesRtr.get("/{id_clase}", response_model=ClaseResponse, summary="Obtener una clase por ID")
def get_clase(id_clase: int, db_conn=Depends(get_db_connection)):
    """Obtiene los detalles de una clase específica. Este endpoint es público."""
    query = "SELECT * FROM Clases WHERE id_clase = %s"
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, (id_clase,))
        clase = cursor.fetchone()
        cursor.close()
        if not clase:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Clase no encontrada.")
        return clase
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")