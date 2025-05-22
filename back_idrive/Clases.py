# Importamos las librerías necesarias de FastAPI, HTTPException y status
from fastapi import APIRouter, HTTPException, status
# Importamos la clase BaseModel de pydantic
from pydantic import BaseModel
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import cleverCursor, mysqlConn, mysql
from datetime import datetime


# Creamos un enrutador de API llamado 
clasesRtr = APIRouter()

class clasesDB(BaseModel):
    nombre_clase: str
    fecha_hora: datetime
    id_profesor: int
    id_salon: int

@clasesRtr.get("/Clases/", status_code=status.HTTP_302_FOUND, tags=['Gestion de clases'])
async def get_users():
  selectAll_query = 'SELECT id_clase, nombre_clase, fecha_hora, id_profesor, id_salon FROM Clases'
  cleverCursor.execute(selectAll_query)
  result = cleverCursor.fetchall()
  return result

#Router para programar clases
@clasesRtr.post("/Crear_clase", status_code=status.HTTP_201_CREATED, tags=['Gestion de clases'])
def insert_user(clasePost: clasesDB):
    insert_query = """
    INSERT INTO clases (nombre_clase, fecha_hora, id_profesor, id_salon)
    VALUES (%s, %s, %s, %s)
    """
    
    values = (clasePost.nombre_clase, clasePost.fecha_hora, clasePost.id_profesor, clasePost.id_salon)
    

    try:
        cleverCursor.execute(insert_query, values)
        mysqlConn.commit()
    except mysqlConn.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Error: {err}")

    return {"message": "Clase creada correctamente."}

#Router para actualizar clases
@clasesRtr.put("/Editar_clase/{clase_id}", status_code=status.HTTP_200_OK, tags=['Gestion de clases'])
def update_clase(clase_id: int, clasePut: clasesDB):
    update_query = """
    UPDATE Clases 
    SET nombre_clase = %s, fecha_hora = %s, id_profesor = %s, id_salon = %s
    WHERE id_clase = %s
    """
    values = (clasePut.nombre_clase, clasePut.fecha_hora, clasePut.id_profesor, clasePut.id_salon, clase_id)

    try:
        cleverCursor.execute(update_query, values)
        mysqlConn.commit()
        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Clase no encontrada")
    except mysqlConn.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Error: {err}")

    return {"message": "La clase se ha modificado correctamente."}


  
  #Router para eliminar clases
@clasesRtr.delete("/Borrar_clase/{id_clase}", status_code=status.HTTP_200_OK, tags=['Gestion de clases'])
def delete_clases_by_id(id_clase: int):
    delete_query = "DELETE FROM Clases WHERE id_clase = %s"
    values = (id_clase,)

    try:
        cleverCursor.execute(delete_query, values)
        mysqlConn.commit()

        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Clase no encontrada")

    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Error en la eliminación: {err}")

    return {"message": "Clase eliminada correctamente."}

#Router para obtener todas las clases
@clasesRtr.get("/Clases_Calendario", status_code=status.HTTP_200_OK, tags=["Gestion de clases"])
def obtener_clases_calendario():
    query = """
    SELECT 
        c.id_clase,
        c.nombre_clase,
        c.fecha_hora,
        COUNT(a.id_agendamiento) AS usuarios_registrados
    FROM clases c
    LEFT JOIN agendamientos a 
        ON c.id_clase = a.id_clase AND a.estado = 'aprobado'
    GROUP BY c.id_clase, c.nombre_clase, c.fecha_hora
    ORDER BY c.fecha_hora
    """

    try:
        cleverCursor.execute(query)
        resultados = cleverCursor.fetchall()
        clases = [
            {
                "id": fila[0],
                "titulo": fila[1],
                "fecha": fila[2].isoformat(),
                "usuarios_registrados": fila[3]
            }
            for fila in resultados
        ]
        return clases
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Error al obtener clases: {err}")


#Router para obtener clases disponibles
# Este endpoint devuelve una lista de clases disponibles que tienen cupos disponibles
@clasesRtr.get("/ClasesDisponibles/", status_code=status.HTTP_200_OK, tags=["Gestion de clases"])
def obtener_clases_disponibles():
    query = """
    SELECT id_clase, nombre_clase, fecha_hora, cupos_disponibles
    FROM Clases
    WHERE cupos_disponibles > 0
    ORDER BY fecha_hora
    """
    try:
        cleverCursor.execute(query)
        resultados = cleverCursor.fetchall()
        clases = []

        for fila in resultados:
            clase = {
                "id_clase": fila[0],
                "nombre_clase": fila[1],
                "fecha_hora": fila[2].isoformat(),
                "cupos_disponibles": fila[3]
            }
            clases.append(clase)

        if not clases:
            raise HTTPException(status_code=404, detail="No hay clases disponibles actualmente.")

        return clases

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error al obtener clases disponibles: {err}")
