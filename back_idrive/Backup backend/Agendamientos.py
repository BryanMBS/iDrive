from fastapi import APIRouter, HTTPException, status, Body, Depends
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from mysql.connector import Error as MySQLC_Error
from Clever_MySQL_conn import get_db_connection

agendamientosRtr = APIRouter(prefix="/agendamientos", tags=['Gestion de Agendamiento'])

# --- Modelos Pydantic ---

class AgendamientoBase(BaseModel):
    id_estudiante: int
    id_clase: int
    fecha_reserva: datetime = Field(default_factory=datetime.now)
    estado: Literal['Pendiente', 'Confirmado', 'Cancelado'] = 'Pendiente'
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None
    fecha_confirmacion: Optional[datetime] = None

class AgendamientoCrear(BaseModel):
    id_estudiante: int
    id_clase: int
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None

class AgendamientoDetalle(AgendamientoBase):
    id_agendamiento: int
    nombre_clase: str
    fecha_hora: datetime
    profesor: str
    nombre_salon: str
    estudiante: str

    class Config:
        from_attributes = True

class AgendamientoCrearPorCedula(BaseModel):
    cedula: str
    id_clase: int
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None

class AgendamientoModificar(BaseModel):
    id_estudiante: Optional[int] = None
    id_clase: Optional[int] = None
    estado: Optional[Literal['Pendiente', 'Confirmado', 'Cancelado']] = None
    metodo_reserva: Optional[Literal['web', 'movil', 'presencial']] = None
    fecha_confirmacion: Optional[datetime] = None

# --- Endpoints ---

@agendamientosRtr.get(
    "/",
    response_model=List[AgendamientoDetalle],
    status_code=status.HTTP_200_OK,
    summary="Obtener todos los agendamientos con detalles de clase, profesor y salón"
)
async def get_agendamientos(db_conn = Depends(get_db_connection)):
    query = """
        SELECT a.id_agendamiento,
               a.id_estudiante,
               a.id_clase,
               a.fecha_reserva,
               a.estado,
               a.metodo_reserva,
               a.fecha_confirmacion,
               c.nombre_clase AS nombre_clase,
               c.fecha_hora,
               u.nombre AS profesor,
               s.nombre_salon,
               e.nombre AS estudiante
        FROM Agendamientos a
        JOIN Clases c ON a.id_clase = c.id_clase
        JOIN Usuarios u ON c.id_profesor = u.id_usuario
        JOIN Salones s ON c.id_salon = s.id_salon
        JOIN Usuarios e ON a.id_estudiante = e.id_usuario;
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        if not result:
            return []
        return [AgendamientoDetalle(**row) for row in result]
    except MySQLC_Error as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")

@agendamientosRtr.get(
    "/cedula/{cedula}",
    response_model=List[AgendamientoDetalle],
    status_code=status.HTTP_200_OK,
    summary="Obtener agendamientos de un estudiante por su número de cédula"
)
async def get_agendamientos_por_cedula(cedula: str, db_conn = Depends(get_db_connection)):
    query = """
        SELECT a.id_agendamiento,
               a.id_estudiante,
               a.id_clase,
               a.fecha_reserva,
               a.estado,
               a.metodo_reserva,
               a.fecha_confirmacion,
               c.nombre_clase AS nombre_clase,
               c.fecha_hora,
               u.nombre AS profesor,
               s.nombre_salon,
               e.nombre AS estudiante
        FROM Agendamientos a
        JOIN Clases c ON a.id_clase = c.id_clase
        JOIN Usuarios u ON c.id_profesor = u.id_usuario
        JOIN Salones s ON c.id_salon = s.id_salon
        JOIN Usuarios e ON a.id_estudiante = e.id_usuario
        WHERE e.cedula = %s;
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, (cedula,))
        result = cursor.fetchall()
        cursor.close()
        if not result:
            return []
        return [AgendamientoDetalle(**row) for row in result]
    except MySQLC_Error as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")

@agendamientosRtr.post(
    "/",
    response_model=AgendamientoDetalle,
    status_code=status.HTTP_201_CREATED,
    summary="Agendar una clase para un estudiante usando su cédula"
)
async def agendar_clase_cedula(
    agendamiento_data: AgendamientoCrearPorCedula,
    db_conn = Depends(get_db_connection)
):
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT id_usuario FROM Usuarios WHERE cedula = %s", (agendamiento_data.cedula,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado.")
        id_estudiante = result['id_usuario']

        insert_query = """
        INSERT INTO Agendamientos (id_estudiante, id_clase, fecha_reserva, estado, metodo_reserva)
        VALUES (%s, %s, NOW(), 'Pendiente', %s)
        """
        valores = (id_estudiante, agendamiento_data.id_clase, agendamiento_data.metodo_reserva)
        cursor.execute(insert_query, valores)
        db_conn.commit()
        agendamiento_id = cursor.lastrowid

        get_new_agendamiento_query = """
            SELECT a.id_agendamiento,
                   a.id_estudiante,
                   a.id_clase,
                   a.fecha_reserva,
                   a.estado,
                   a.metodo_reserva,
                   a.fecha_confirmacion,
                   c.nombre_clase AS nombre_clase,
                   c.fecha_hora,
                   u.nombre AS profesor,
                   s.nombre_salon,
                   e.nombre AS estudiante
            FROM Agendamientos a
            JOIN Clases c ON a.id_clase = c.id_clase
            JOIN Usuarios u ON c.id_profesor = u.id_usuario
            JOIN Salones s ON c.id_salon = s.id_salon
            JOIN Usuarios e ON a.id_estudiante = e.id_usuario
            WHERE a.id_agendamiento = %s;
        """
        cursor.execute(get_new_agendamiento_query, (agendamiento_id,))
        new_agendamiento_row = cursor.fetchone()
        cursor.close()
        if not new_agendamiento_row:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agendamiento creado pero no se pudo recuperar.")
        return AgendamientoDetalle(**new_agendamiento_row)
    except MySQLC_Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conflicto o error de base de datos al agendar la clase.")
    except Exception:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")

@agendamientosRtr.delete(
    "/{id_agendamiento}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar un agendamiento por su ID"
)
async def cancelar_agendamiento(id_agendamiento: int, db_conn = Depends(get_db_connection)):
    delete_query = """
    DELETE FROM Agendamientos
    WHERE id_agendamiento = %s
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(delete_query, (id_agendamiento,))
        db_conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamiento no encontrado.")
        cursor.close()
        return
    except MySQLC_Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error de base de datos al cancelar el agendamiento.")
    except Exception:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")

@agendamientosRtr.put(
    "/{id_agendamiento}",
    response_model=AgendamientoDetalle,
    status_code=status.HTTP_200_OK,
    summary="Modificar un agendamiento existente"
)
async def modificar_agendamiento(
    id_agendamiento: int,
    datos: AgendamientoModificar = Body(...),
    db_conn = Depends(get_db_connection)
):
    update_fields = []
    valores = []

    if datos.id_estudiante is not None:
        update_fields.append("id_estudiante = %s")
        valores.append(datos.id_estudiante)
    if datos.id_clase is not None:
        update_fields.append("id_clase = %s")
        valores.append(datos.id_clase)
    if datos.estado is not None:
        update_fields.append("estado = %s")
        valores.append(datos.estado)
    if datos.metodo_reserva is not None:
        update_fields.append("metodo_reserva = %s")
        valores.append(datos.metodo_reserva)
    if datos.fecha_confirmacion is not None:
        update_fields.append("fecha_confirmacion = %s")
        valores.append(datos.fecha_confirmacion)

    if not update_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron datos para modificar.")

    update_query = f"""
    UPDATE Agendamientos
    SET {', '.join(update_fields)}
    WHERE id_agendamiento = %s
    """
    valores.append(id_agendamiento)

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(update_query, tuple(valores))
        db_conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamiento no encontrado o no modificado (los datos proporcionados podrían ser los mismos).")

        get_modified_query = """
            SELECT a.id_agendamiento,
                   a.id_estudiante,
                   a.id_clase,
                   a.fecha_reserva,
                   a.estado,
                   a.metodo_reserva,
                   a.fecha_confirmacion,
                   c.nombre_clase AS nombre_clase,
                   c.fecha_hora,
                   u.nombre AS profesor,
                   s.nombre_salon,
                   e.nombre AS estudiante
            FROM Agendamientos a
            JOIN Clases c ON a.id_clase = c.id_clase
            JOIN Usuarios u ON c.id_profesor = u.id_usuario
            JOIN Salones s ON c.id_salon = s.id_salon
            JOIN Usuarios e ON a.id_estudiante = e.id_usuario
            WHERE a.id_agendamiento = %s;
        """
        cursor.execute(get_modified_query, (id_agendamiento,))
        modified_row = cursor.fetchone()
        cursor.close()
        if modified_row:
            return AgendamientoDetalle(**modified_row)
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Agendamiento modificado pero no se pudo recuperar.")
    except MySQLC_Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error de base de datos al modificar el agendamiento.")
    except Exception:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno del servidor. Contacte al administrador.")