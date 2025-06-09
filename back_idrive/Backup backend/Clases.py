from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import mysql.connector
from datetime import datetime
from Clever_MySQL_conn import get_db_connection

clasesRtr = APIRouter(prefix="/clases", tags=['Gestion de Clases'])

# --- Modelos Pydantic ---

# Modelo para la creación de una clase (entrada al POST)
class ClaseCreate(BaseModel):
    nombre_clase: str
    descripcion: Optional[str] = None
    fecha_hora: datetime
    id_profesor: int
    id_salon: int
    cupos_disponibles: Optional[int] = 0
    duracion_minutos: Optional[int] = 60

# Modelo para la respuesta completa de una clase (salida de GET, POST, PUT)
class ClaseResponse(BaseModel):
    id_clase: int
    nombre_clase: str
    descripcion: Optional[str] = None
    fecha_hora: datetime
    id_profesor: int
    id_salon: int
    cupos_disponibles: int
    duracion_minutos: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        # Permite que Pydantic cree una instancia de ClaseResponse directamente desde un diccionario
        # donde los nombres de las claves coinciden con los nombres de los atributos del modelo.
        from_attributes = True

# Modelo para la actualización de una clase (entrada al PUT)
class ClaseUpdate(BaseModel):
    nombre_clase: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    id_profesor: Optional[int] = None
    id_salon: Optional[int] = None
    cupos_disponibles: Optional[int] = None
    duracion_minutos: Optional[int] = None

# Modelo para la respuesta de /clases/calendario/
class ClaseCalendarioResponse(BaseModel):
    id: int = Field(alias="id_clase") # Mapea 'id_clase' de la DB a 'id' en el modelo
    titulo: str = Field(alias="nombre_clase") # Mapea 'nombre_clase' a 'titulo'
    fecha: str # Se formatea como string ISO para la salida (se hará manualmente)
    usuarios_registrados: int

# Modelo para la respuesta de /clases/disponibles/
class ClaseDisponibleResponse(BaseModel):
    id_clase: int
    nombre_clase: str
    fecha_hora: str # Se formatea como string ISO para la salida
    cupos_disponibles: int


# --- Rutas de la API para Clases ---

# Router para programar clases (crear una clase)
@clasesRtr.post("/", response_model=ClaseResponse, status_code=status.HTTP_201_CREATED)
async def create_clase(clase_data: ClaseCreate, db_conn = Depends(get_db_connection)):
    """
    Crea una nueva clase en la base de datos.
    """
    insert_query = """
    INSERT INTO clases (
        nombre_clase, descripcion, fecha_hora, id_profesor, id_salon,
        cupos_disponibles, duracion_minutos, fecha_creacion, fecha_actualizacion
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    """

    values = (
        clase_data.nombre_clase,
        clase_data.descripcion,
        clase_data.fecha_hora,
        clase_data.id_profesor,
        clase_data.id_salon,
        clase_data.cupos_disponibles,
        clase_data.duracion_minutos
    )

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(insert_query, values)
        db_conn.commit()
        new_clase_id = cursor.lastrowid

        if not new_clase_id:
            cursor.close()
            raise HTTPException(status_code=500, detail="No se pudo obtener el ID de la clase recién creada.")

        cursor.execute(
            "SELECT * FROM clases WHERE id_clase = %s", (new_clase_id,)
        )
        inserted = cursor.fetchone()
        cursor.close()
        return ClaseResponse(**inserted)
    except mysql.connector.Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor. Contacte al administrador.")
    except Exception as e:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno del servidor. Contacte al administrador.")

# Router para actualizar clases
@clasesRtr.put("/{clase_id}", response_model=ClaseResponse, status_code=status.HTTP_200_OK)
async def update_clase(clase_id: int, clase_update_data: ClaseUpdate, db_conn = Depends(get_db_connection)):
    """
    Actualiza los datos de una clase existente por su ID.
    Solo se actualizarán los campos que se proporcionen.
    """
    # Construye la consulta UPDATE dinámicamente con los campos proporcionados
    update_fields = []
    update_values = []

    # model_dump(exclude_unset=True) solo incluye campos que fueron explícitamente establecidos
    for field, value in clase_update_data.model_dump(exclude_unset=True).items():
        update_fields.append(f"{field} = %s")
        update_values.append(value)

    if not update_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se proporcionaron campos para actualizar.")

    update_fields_str = ", ".join(update_fields)
    update_query = f"""
        UPDATE clases
        SET {update_fields_str}, fecha_actualizacion = NOW()
        WHERE id_clase = %s
    """
    update_values.append(clase_id)

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(update_query, tuple(update_values))
        db_conn.commit()

        if cursor.rowcount == 0:
            # Si no se modificó ninguna fila, significa que la clase no existe o los datos son los mismos
            # Podemos verificar explícitamente si existe para dar un 404 más preciso
            cursor.execute("SELECT id_clase FROM clases WHERE id_clase = %s", (clase_id,))
            if not cursor.fetchone():
                cursor.close()
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clase no encontrada.")
            else:
                cursor.close()
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La clase existe pero no se realizaron cambios (los datos proporcionados son los mismos).")

        # Recuperar la clase actualizada para la respuesta
        select_clase_query = """
            SELECT id_clase, nombre_clase, descripcion, fecha_hora, id_profesor, id_salon,
                   cupos_disponibles, duracion_minutos, fecha_creacion, fecha_actualizacion
            FROM clases WHERE id_clase = %s
        """
        cursor.execute(select_clase_query, (clase_id,))
        updated_clase_data = cursor.fetchone()
        cursor.close()

        if not updated_clase_data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Clase actualizada pero no encontrada para confirmación.")

        return ClaseResponse(**updated_clase_data)
    except mysql.connector.Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error de base de datos al actualizar clase: {err}")
    except HTTPException as e:
        raise e
    except Exception as e:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado al actualizar clase: {e}")

# Router para eliminar clases
@clasesRtr.delete("/{id_clase}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clase(id_clase: int, db_conn = Depends(get_db_connection)):
    """
    Elimina una clase de la base de datos por su ID.
    """
    delete_query = "DELETE FROM clases WHERE id_clase = %s"

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(delete_query, (id_clase,))
        db_conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clase no encontrada.")
        cursor.close()
        return
    except mysql.connector.Error as err:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error de base de datos al eliminar clase: {err}")
    except Exception as e:
        db_conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado al eliminar clase: {e}")

# Router para obtener clases para calendario
@clasesRtr.get("/calendario/", response_model=List[ClaseCalendarioResponse], status_code=status.HTTP_200_OK)
async def obtener_clases_calendario(db_conn = Depends(get_db_connection)):
    """
    Obtiene una lista de clases para mostrar en un calendario,
    incluyendo el conteo de usuarios registrados (aprobados) para cada clase.
    """
    query = """
    SELECT
        c.id_clase,
        c.nombre_clase,
        c.fecha_hora,
        COUNT(a.id_agendamiento) AS usuarios_registrados
    FROM clases c
    LEFT JOIN agendamientos a
        ON c.id_clase = a.id_clase AND a.estado = 'Confirmado'
    GROUP BY c.id_clase, c.nombre_clase, c.fecha_hora
    ORDER BY c.fecha_hora
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        resultados = cursor.fetchall()
        cursor.close()

        clases_calendario = []
        for fila in resultados:
            clases_calendario.append(ClaseCalendarioResponse(
                id_clase=fila['id_clase'],
                nombre_clase=fila['nombre_clase'],
                fecha=fila['fecha_hora'].isoformat(),
                usuarios_registrados=fila['usuarios_registrados']
            ))
        return clases_calendario
    except mysql.connector.Error as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error de base de datos: {err}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado: {e}")

# Router para obtener clases disponibles
@clasesRtr.get("/disponibles/", response_model=List[ClaseDisponibleResponse], status_code=status.HTTP_200_OK)
async def obtener_clases_disponibles(db_conn = Depends(get_db_connection)):
    """
    Obtiene una lista de clases que tienen cupos disponibles (cupos_disponibles > 0).
    """
    query = """
    SELECT id_clase, nombre_clase, fecha_hora, cupos_disponibles
    FROM clases
    WHERE cupos_disponibles > 0 AND fecha_hora > NOW()
    ORDER BY fecha_hora
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        resultados = cursor.fetchall()
        cursor.close()

        if not resultados:
            return []

        clases_disponibles = []
        for fila in resultados:
            clases_disponibles.append(ClaseDisponibleResponse(
                id_clase=fila['id_clase'],
                nombre_clase=fila['nombre_clase'],
                fecha_hora=fila['fecha_hora'].isoformat(),
                cupos_disponibles=fila['cupos_disponibles']
            ))
        return clases_disponibles
    except mysql.connector.Error as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error de base de datos: {err}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error inesperado: {e}")

# NO INCLUYAS app.include_router(clasesRtr) en este archivo si este es solo un módulo de router.
# Esa línea debe ir en tu archivo FastAPI principal (main.py o similar).