from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from Clever_MySQL_conn import cleverCursor, mysqlConn
import bcrypt

usuariosRtr = APIRouter()

# Definimos la clase para la validación del usuario
class usuarioDB(BaseModel):
    nombre: str
    correo_electronico: str
    telefono: int
    cedula: str
    password: str
    id_rol: int

# Definir un endpoint para obtener la lista de usuarios
@usuariosRtr.get("/Usuarios/", status_code=status.HTTP_200_OK, tags=['Gestion de usuarios'])
async def get_users():
    selectAll_query = '''
        SELECT u.nombre, u.correo_electronico, u.telefono, u.cedula, r.nombre_rol
        FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
    '''
    try:
        cleverCursor.execute(selectAll_query)
        result = cleverCursor.fetchall()
        return result
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error al obtener los usuarios: {err}")

# Endpoint para crear un nuevo usuario con contraseña encriptada
@usuariosRtr.post("/Crear_usuario/", status_code=status.HTTP_201_CREATED, tags=['Gestion de usuarios'])
def insert_user(usuarioPost: usuarioDB):
    # Verificar si el correo ya existe en la BD antes de insertar
    check_query = "SELECT id_usuario FROM Usuarios WHERE correo_electronico = %s"
    cleverCursor.execute(check_query, (usuarioPost.correo_electronico,))
    if cleverCursor.fetchone():
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    # Encriptar la contraseña antes de almacenarla
    hashed_password = bcrypt.hashpw(usuarioPost.password.encode("utf-8"), bcrypt.gensalt())

    insert_query = """
    INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        usuarioPost.nombre, 
        usuarioPost.correo_electronico, 
        usuarioPost.telefono, 
        usuarioPost.cedula, 
        hashed_password.decode("utf-8"),  # Convertir el hash a string
        usuarioPost.id_rol
    )

    try:
        cleverCursor.execute(insert_query, values)  # Ejecutar consulta
        mysqlConn.commit()  # Guardar cambios en la BD
        return {"message": "Usuario creado correctamente"}
    except mysqlConn.connector.Error as err:
        mysqlConn.rollback()  # Deshacer cambios si hay un error
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {err}")

# Endpoint para actualizar un usuario
@usuariosRtr.put("/Editar_usuario/{usuario_id}", status_code=status.HTTP_200_OK, tags=['Gestion de usuarios'])
def update_user(usuario_id: int, usuarioPut: usuarioDB):
    # Verificar si el usuario existe
    cleverCursor.execute("SELECT * FROM Usuarios WHERE id_usuario = %s", (usuario_id,))
    usuario_existente = cleverCursor.fetchone()

    if not usuario_existente:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Encriptar la nueva contraseña solo si se proporciona
    if usuarioPut.password:
        hashed_password = bcrypt.hashpw(usuarioPut.password.encode("utf-8"), bcrypt.gensalt())
    else:
        hashed_password = usuario_existente[5]  # Mantener la contraseña existente

    update_query = """
    UPDATE Usuarios 
    SET nombre = %s, correo_electronico = %s, telefono = %s, cedula = %s, password_hash = %s, id_rol = %s
    WHERE id_usuario = %s
    """
    values = (
        usuarioPut.nombre, 
        usuarioPut.correo_electronico, 
        usuarioPut.telefono, 
        usuarioPut.cedula, 
        hashed_password.decode("utf-8"), 
        usuarioPut.id_rol, 
        usuario_id
    )

    try:
        cleverCursor.execute(update_query, values)
        mysqlConn.commit()

        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="No se realizaron cambios en el usuario")

        return {"message": "Usuario actualizado correctamente"}
    except Exception as err:
        mysqlConn.rollback()  # Deshacer cambios si hay un error
        raise HTTPException(status_code=400, detail=f"Error en la base de datos: {err}")

# Endpoint para eliminar un usuario
@usuariosRtr.delete("/Borrar_usuario/{id_usuario}", status_code=status.HTTP_200_OK, tags=['Gestion de usuarios'])
def delete_user(id_usuario: int):
    delete_query = "DELETE FROM Usuarios WHERE id_usuario = %s"
    values = (id_usuario,)

    try:
        cleverCursor.execute(delete_query, values)
        mysqlConn.commit()

        if cleverCursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        return {"message": "Usuario eliminado correctamente"}
    except Exception as err:
        mysqlConn.rollback()  # Deshacer cambios si hay un error
        raise HTTPException(status_code=400, detail=f"Error en la eliminación: {err}")

# Endpoint para validar el login
class LoginRequest(BaseModel):
    correo_electronico: str
    password: str

@usuariosRtr.post("/Validacion_Login/", status_code=status.HTTP_200_OK, tags=['Gestion de login'])
def validar_login(data: LoginRequest):
    select_query = """
    SELECT id_usuario, nombre, correo_electronico, telefono, cedula, id_rol, password_hash
    FROM Usuarios 
    WHERE correo_electronico = %s
    """

    try:
        cleverCursor.execute(select_query, (data.correo_electronico,))
        result = cleverCursor.fetchone()

        if result:
            stored_password_hash = result[6]  # La contraseña en la BD
            # Validamos con bcrypt
            if bcrypt.checkpw(data.password.encode("utf-8"), stored_password_hash.encode("utf-8")):
                return {
                    "id_usuario": result[0],
                    "nombre": result[1],
                    "correo_electronico": result[2],
                    "telefono": result[3],
                    "cedula": result[4],
                    "id_rol": result[5],
                    "message": "Bienvenido"
                }
            else:
                raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        else:
            raise HTTPException(status_code=404, detail="Correo o contraseña incorrectos")

    except mysqlConn.Error as err:
        raise HTTPException(status_code=500, detail=f"Error en el servidor: {err}")
