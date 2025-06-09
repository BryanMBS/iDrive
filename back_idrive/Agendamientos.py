# Agendamientos.py
from fastapi import APIRouter, HTTPException, status, Body, Depends
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from mysql.connector import Error as MySQLC_Error
from Clever_MySQL_conn import get_db_connection, logger

agendamientosRtr = APIRouter(prefix="/agendamientos", tags=['Gestion de Agendamiento'])

# --- Modelos Pydantic ---

class AgendamientoBase(BaseModel):
    id_estudiante: int
    id_clase: int
    fecha_reserva: datetime = Field(default_factory=datetime.now)
    estado: Literal['Pendiente', 'Confirmado', 'Cancelado'] = 'Pendiente'
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None
    fecha_confirmacion: Optional[datetime] = None

class AgendamientoCrearPorCedula(BaseModel):
    cedula: str
    id_clase: int
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None

class AgendamientoModificar(BaseModel):
    id_clase: Optional[int] = None
    estado: Optional[Literal['Pendiente', 'Confirmado', 'Cancelado']] = None

class AgendamientoDetalle(AgendamientoBase):
    id_agendamiento: int
    nombre_clase: str
    fecha_hora: datetime
    profesor: str
    nombre_salon: str
    estudiante: str

    class Config:
        from_attributes = True

# --- Buena Práctica: DRY (No te repitas) ---
# Esta consulta base se usa en múltiples endpoints, así que la definimos una vez.
AGENDAMIENTO_DETALLE_QUERY = """
    SELECT
        a.id_agendamiento, a.id_estudiante, a.id_clase, a.fecha_reserva,
        a.estado, a.metodo_reserva, a.fecha_confirmacion,
        c.nombre_clase, c.fecha_hora,
        prof.nombre AS profesor,
        s.nombre_salon,
        est.nombre AS estudiante
    FROM Agendamientos a
    JOIN Clases c ON a.id_clase = c.id_clase
    JOIN Usuarios prof ON c.id_profesor = prof.id_usuario
    JOIN Salones s ON c.id_salon = s.id_salon
    JOIN Usuarios est ON a.id_estudiante = est.id_usuario
"""
#--------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener todos los agendamientos con detalles completos
@agendamientosRtr.get(
    "/",
    response_model=List[AgendamientoDetalle],
    summary="Obtener todos los agendamientos con detalles completos"
)
def get_agendamientos(db_conn=Depends(get_db_connection)):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(AGENDAMIENTO_DETALLE_QUERY)
        result = cursor.fetchall()
        cursor.close()
        return result
    except MySQLC_Error as err:
        logger.error(f"Error al obtener agendamientos: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "La consulta a la base de datos falló.")

# Endpoint para obtener un agendamiento específico por ID
@agendamientosRtr.post(
    "/",
    response_model=AgendamientoDetalle,
    status_code=status.HTTP_201_CREATED,
    summary="Agendar una clase para un estudiante usando su cédula"
)
def agendar_clase_cedula(
    agendamiento_data: AgendamientoCrearPorCedula,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        # Encontrar el ID del estudiante a partir de la cédula
        cursor.execute("SELECT id_usuario FROM Usuarios WHERE cedula = %s", (agendamiento_data.cedula,))
        student = cursor.fetchone()
        if not student:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Estudiante no encontrado.")
        id_estudiante = student['id_usuario']

        # Insertar el nuevo agendamiento
        insert_query = """
            INSERT INTO Agendamientos (id_estudiante, id_clase, metodo_reserva, fecha_reserva, estado)
            VALUES (%s, %s, %s, NOW(), 'Pendiente')
        """
        cursor.execute(insert_query, (id_estudiante, agendamiento_data.id_clase, agendamiento_data.metodo_reserva))
        agendamiento_id = cursor.lastrowid
        db_conn.commit()

        # Recuperar el agendamiento recién creado con todos los detalles
        query = f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.id_agendamiento = %s;"
        cursor.execute(query, (agendamiento_id,))
        new_agendamiento = cursor.fetchone()
        cursor.close()

        if not new_agendamiento:
             raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el agendamiento creado.")

        logger.info(f"Nuevo agendamiento creado con ID: {agendamiento_id}")
        return new_agendamiento
    except MySQLC_Error as err:
        db_conn.rollback()
        if err.errno == 1452: # Falla la restricción de clave foránea
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La clase o estudiante especificado no existe.")
        logger.error(f"Error de base de datos al crear agendamiento: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al crear agendamiento.")

#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para modificar un agendamiento existente
@agendamientosRtr.put(
    "/{id_agendamiento}",
    response_model=AgendamientoDetalle,
    summary="Modificar un agendamiento existente"
)
def modificar_agendamiento(
    id_agendamiento: int,
    agendamiento_data: AgendamientoModificar,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)

        # Verificar si el agendamiento existe
        cursor.execute("SELECT * FROM Agendamientos WHERE id_agendamiento = %s", (id_agendamiento,))
        existing_agendamiento = cursor.fetchone()
        if not existing_agendamiento:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamiento no encontrado.")

        # Actualizar los campos proporcionados
        update_fields = []
        update_values = []
        if agendamiento_data.id_clase is not None:
            update_fields.append("id_clase = %s")
            update_values.append(agendamiento_data.id_clase)
        if agendamiento_data.estado is not None:
            update_fields.append("estado = %s")
            update_values.append(agendamiento_data.estado)

        if not update_fields:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No se proporcionaron campos para actualizar.")

        update_query = f"UPDATE Agendamientos SET {', '.join(update_fields)} WHERE id_agendamiento = %s"
        update_values.append(id_agendamiento)
        cursor.execute(update_query, tuple(update_values))
        db_conn.commit()

        # Recuperar el agendamiento actualizado
        cursor.execute(f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.id_agendamiento = %s", (id_agendamiento,))
        updated_agendamiento = cursor.fetchone()
        cursor.close()

        if not updated_agendamiento:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el agendamiento actualizado.")

        logger.info(f"Agendamiento con ID {id_agendamiento} modificado exitosamente.")
        return updated_agendamiento
    except MySQLC_Error as err:
        db_conn.rollback()
        logger.error(f"Error de base de datos al modificar agendamiento: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al modificar agendamiento.")

#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para cancelar un agendamiento
@agendamientosRtr.delete(
    "/{id_agendamiento}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar un agendamiento existente"
)
def cancelar_agendamiento(
    id_agendamiento: int,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)

        # Verificar si el agendamiento existe
        cursor.execute("SELECT * FROM Agendamientos WHERE id_agendamiento = %s", (id_agendamiento,))
        existing_agendamiento = cursor.fetchone()
        if not existing_agendamiento:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamiento no encontrado.")

        # Actualizar el estado a 'Cancelado'
        cursor.execute("UPDATE Agendamientos SET estado = 'Cancelado' WHERE id_agendamiento = %s", (id_agendamiento,))
        db_conn.commit()

        cursor.close()
        logger.info(f"Agendamiento con ID {id_agendamiento} cancelado exitosamente.")
    except MySQLC_Error as err:
        db_conn.rollback()
        logger.error(f"Error de base de datos al cancelar agendamiento: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al cancelar agendamiento.")

#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener agendamientos por estudiante
@agendamientosRtr.get(
    "/estudiante/{id_estudiante}",
    response_model=List[AgendamientoDetalle],
    summary="Obtener agendamientos por estudiante"
)
def get_agendamientos_por_estudiante(
    id_estudiante: int,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        query = f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.id_estudiante = %s"
        cursor.execute(query, (id_estudiante,))
        result = cursor.fetchall()
        cursor.close()

        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontraron agendamientos para este estudiante.")

        return result
    except MySQLC_Error as err:
        logger.error(f"Error al obtener agendamientos por estudiante: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")
#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener agendamientos por clase
@agendamientosRtr.get(
    "/clase/{id_clase}",
    response_model=List[AgendamientoDetalle],
    summary="Obtener agendamientos por clase"
)
def get_agendamientos_por_clase(
    id_clase: int,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        query = f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.id_clase = %s"
        cursor.execute(query, (id_clase,))
        result = cursor.fetchall()
        cursor.close()

        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontraron agendamientos para esta clase.")

        return result
    except MySQLC_Error as err:
        logger.error(f"Error al obtener agendamientos por clase: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")
#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener agendamientos por estado
@agendamientosRtr.get(
    "/estado/{estado}",
    response_model=List[AgendamientoDetalle],
    summary="Obtener agendamientos por estado"
)
def get_agendamientos_por_estado(
    estado: Literal['Pendiente', 'Confirmado', 'Cancelado'],
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        query = f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.estado = %s"
        cursor.execute(query, (estado,))
        result = cursor.fetchall()
        cursor.close()

        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "No se encontraron agendamientos con este estado.")

        return result
    except MySQLC_Error as err:
        logger.error(f"Error al obtener agendamientos por estado: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al consultar la base de datos.")
#---------------------------------------------------------------------------------------------------------------------------
# Endpoint para confirmar un agendamiento
@agendamientosRtr.post(
    "/confirmar/{id_agendamiento}",
    response_model=AgendamientoDetalle,
    summary="Confirmar un agendamiento"
)
def confirmar_agendamiento(
    id_agendamiento: int,
    db_conn=Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)

        # Verificar si el agendamiento existe
        cursor.execute("SELECT * FROM Agendamientos WHERE id_agendamiento = %s", (id_agendamiento,))
        existing_agendamiento = cursor.fetchone()
        if not existing_agendamiento:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Agendamiento no encontrado.")

        # Actualizar el estado a 'Confirmado' y establecer la fecha de confirmación
        cursor.execute("""
            UPDATE Agendamientos
            SET estado = 'Confirmado', fecha_confirmacion = NOW()
            WHERE id_agendamiento = %s
        """, (id_agendamiento,))
        db_conn.commit()

        # Recuperar el agendamiento actualizado
        cursor.execute(f"{AGENDAMIENTO_DETALLE_QUERY} WHERE a.id_agendamiento = %s", (id_agendamiento,))
        updated_agendamiento = cursor.fetchone()
        cursor.close()

        if not updated_agendamiento:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el agendamiento confirmado.")

        logger.info(f"Agendamiento con ID {id_agendamiento} confirmado exitosamente.")
        return updated_agendamiento
    except MySQLC_Error as err:
        db_conn.rollback()
        logger.error(f"Error de base de datos al confirmar agendamiento: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al confirmar agendamiento.")

#---------------------------------------------------------------------------------------------------------------------------