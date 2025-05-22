from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import BaseModel
from mysql.connector import Error  # Importa el error desde mysql.connector
from Clever_MySQL_conn import cleverCursor, mysqlConn
from fastapi import Body # Importa Body para el uso de datos en el cuerpo de la solicitud

agendamientosRtr = APIRouter()

class Agendamiento(BaseModel):
    id_agendamiento: int
    nombre_clase: str
    fecha_hora: str
    profesor: str
    nombre_salon: str
    estudiante: str
    fecha_reserva: str
    estado: str

# Obtener todos los agendamientos con detalles de clase, profesor y salón
@agendamientosRtr.get("/Agendamientos/", response_model=List[Agendamiento], status_code=status.HTTP_200_OK, tags=['Gestion de Agendamiento'])
async def get_agendamientos():
    query = """
        SELECT a.id_agendamiento, 
               c.nombre_clase, 
               c.fecha_hora, 
               u.nombre AS profesor, 
               s.nombre_salon, 
               e.nombre AS estudiante, 
               a.fecha_reserva, 
               a.estado
        FROM Agendamientos a
        JOIN Clases c ON a.id_clase = c.id_clase
        JOIN Usuarios u ON c.id_profesor = u.id_usuario
        JOIN Salones s ON c.id_salon = s.id_salon
        JOIN Usuarios e ON a.id_estudiante = e.id_usuario
        WHERE a.estado = 'Pendiente';
    """
    
    try:
        cleverCursor.execute(query)
        result = cleverCursor.fetchall()
        
        if not result:
            raise HTTPException(status_code=404, detail="No se encontraron agendamientos")
        
        # Mapeo del resultado a un formato adecuado para el modelo
        agendamientos = [
            Agendamiento(
                id_agendamiento=row[0],
                nombre_clase=row[1],
                fecha_hora=row[2],
                profesor=row[3],
                nombre_salon=row[4],
                estudiante=row[5],
                fecha_reserva=row[6],
                estado=row[7]
            ) for row in result
        ]
        return agendamientos

    except Error as err:  # Aquí usamos Error directamente
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {err}")





@agendamientosRtr.get("/Agendamientos/cedula/{cedula}", response_model=List[Agendamiento], status_code=status.HTTP_200_OK, tags=['Gestion de Agendamiento'])
async def get_agendamientos_por_cedula(cedula: str):
    query = """
        SELECT a.id_agendamiento, 
               c.nombre_clase, 
               c.fecha_hora, 
               u.nombre AS profesor, 
               s.nombre_salon, 
               e.nombre AS estudiante, 
               a.fecha_reserva, 
               a.estado
        FROM Agendamientos a
        JOIN Clases c ON a.id_clase = c.id_clase
        JOIN Usuarios u ON c.id_profesor = u.id_usuario
        JOIN Salones s ON c.id_salon = s.id_salon
        JOIN Usuarios e ON a.id_estudiante = e.id_usuario
        WHERE e.cedula = %s;
    """
    
    try:
        cleverCursor.execute(query, (cedula,))
        result = cleverCursor.fetchall()
        
        if not result:
            raise HTTPException(status_code=404, detail="No se encontraron agendamientos para esta cédula")
        
        # Mapeo del resultado a un formato adecuado para el modelo
        agendamientos = [
            Agendamiento(
                id_agendamiento=row[0],
                nombre_clase=row[1],
                fecha_hora=row[2],
                profesor=row[3],
                nombre_salon=row[4],
                estudiante=row[5],
                fecha_reserva=row[6],
                estado=row[7]
            ) for row in result
        ]
        return agendamientos

    except mysqlConn.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {err}")


# POST - Agendar una clase
class AgendamientoPorCedula(BaseModel):
    cedula: str
    id_clase: int

@agendamientosRtr.post("/Agendar_clase/", status_code=status.HTTP_201_CREATED, tags=['Gestion de Agendamiento'])
def agendar_clase_cedula(agendamiento: AgendamientoPorCedula):
    # Buscar ID del estudiante
    cleverCursor.execute("SELECT id_usuario FROM Usuarios WHERE cedula = %s", (agendamiento.cedula,))
    result = cleverCursor.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    id_estudiante = result[0]

    insert_query = """
    INSERT INTO Inscripciones (id_estudiante, id_clase)
    VALUES (%s, %s)
    """
    values = (id_estudiante, agendamiento.id_clase)

    try:
        cleverCursor.execute(insert_query, values)
        mysqlConn.commit()
    except Error as err:
        raise HTTPException(status_code=400, detail=f"Error: {err}")

    return {"message": "Clase agendada correctamente."}


# DELETE - Cancelar una inscripción
@agendamientosRtr.delete("/Cancelar_agendamiento/{id_inscripcion}", status_code=status.HTTP_200_OK, tags=['Gestion de Agendamiento'])
def cancelar_agendamiento(id_inscripcion: int):
    delete_query = "DELETE FROM Inscripciones WHERE id_inscripcion = %s"
    
    try:
        cleverCursor.execute(delete_query, (id_inscripcion,))
        mysqlConn.commit()
        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    except mysqlConn.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Error: {err}")

    return {"message": "Inscripción cancelada correctamente."}


# PUT - Modificar un agendamiento
class AgendamientoModificar(BaseModel):
    id_estudiante: int
    id_clase: int

@agendamientosRtr.put("/Modificar_agendamiento/{id_agendamiento}", status_code=status.HTTP_200_OK, tags=['Gestion de Agendamiento'])
def modificar_agendamiento(id_agendamiento: int, datos: AgendamientoModificar = Body(...)):
    update_query = """
    UPDATE Inscripciones
    SET id_estudiante = %s, id_clase = %s
    WHERE id_inscripcion = %s
    """
    valores = (datos.id_estudiante, datos.id_clase, id_agendamiento)

    try:
        cleverCursor.execute(update_query, valores)
        mysqlConn.commit()
        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Agendamiento no encontrado")
    except Error as err:
        raise HTTPException(status_code=400, detail=f"Error: {err}")

    return {"message": "Agendamiento modificado correctamente."}



