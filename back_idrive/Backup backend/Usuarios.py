# Usuarios.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import bcrypt
import mysql.connector

# Importa la función de dependencia y el logger desde Clever_MySQL_conn
# Asegúrate de que Clever_MySQL_conn.py ya tenga las mejoras de logging y manejo del pool.
from Clever_MySQL_conn import get_db_connection, logger # Asumiendo que has añadido 'logger' a Clever_MySQL_conn

# Crea un enrutador de FastAPI
usuariosRtr = APIRouter()

# --- Modelos Pydantic (Esquemas de Datos) ---

# Esquema base para los datos de entrada al crear/actualizar un usuario
class UsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    correo_electronico: EmailStr = Field(..., max_length=100) # Usa EmailStr para validación de formato de email
    telefono: str = Field(..., max_length=20) # Cambiado a str, ya que los números de teléfono suelen llevar prefijos, espacios, etc.
    cedula: str = Field(..., max_length=20)
    id_rol: int = Field(..., ge=1) # id_rol debe ser al menos 1

# Esquema para la creación de un usuario (incluye la contraseña)
class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=8) # Añadir validación de longitud mínima para contraseña

# Esquema para la actualización de un usuario (todos los campos son opcionales)
class UsuarioUpdate(UsuarioBase):
    nombre: Optional[str] = Field(None, max_length=100)
    correo_electronico: Optional[EmailStr] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    cedula: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=8)
    id_rol: Optional[int] = Field(None, ge=1)
    # No se actualiza el estado o las fechas automáticamente desde aquí, se maneja internamente.

# Esquema para la respuesta de un usuario (datos que se devuelven, sin hash de contraseña)
class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    correo_electronico: str
    telefono: str
    cedula: str
    id_rol: int
    fecha_registro: Optional[str] = None # Se podría formatear como datetime, pero str es más flexible para la salida
    ultimo_acceso: Optional[str] = None
    estado: str
    fecha_creacion: Optional[str] = None
    fecha_actualizacion: Optional[str] = None
    nombre_rol: Optional[str] = None # Para la unión con la tabla Roles

    class Config:
        orm_mode = True # Para permitir que Pydantic lea datos de objetos ORM o resultados de DB como diccionarios

# Esquema para la solicitud de Login
class LoginRequest(BaseModel):
    correo_electronico: EmailStr
    password: str

# Esquema para la respuesta de Login
class LoginResponse(BaseModel):
    id_usuario: int
    nombre: str
    correo_electronico: EmailStr
    telefono: str
    cedula: str
    id_rol: int
    message: str

# --- Endpoints ---

# Endpoint para obtener la lista de usuarios
@usuariosRtr.get(
    "/usuarios/",
    response_model=List[UsuarioResponse], # Indica que la respuesta será una lista de UsuarioResponse
    status_code=status.HTTP_200_OK,
    tags=['Gestion de usuarios'],
    summary="Obtiene una lista de todos los usuarios con su rol"
)
async def get_users(db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)):
    """
    Recupera una lista de todos los usuarios registrados en el sistema,
    incluyendo el nombre de su rol asociado.
    """
    select_all_query = '''
        SELECT 
            u.id_usuario, u.nombre, u.correo_electronico, u.telefono, u.cedula, u.id_rol,
            u.fecha_registro, u.ultimo_acceso, u.estado, u.fecha_creacion, u.fecha_actualizacion,
            r.nombre_rol
        FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
    '''
    cursor = None
    try:
        cursor = db_conn.cursor(dictionary=True) # Siempre usa dictionary=True para resultados coherentes
        cursor.execute(select_all_query)
        result = cursor.fetchall()
        logger.info(f"Usuarios obtenidos: {len(result)}")
        return result
    except mysql.connector.Error as err:
        logger.error(f"Error MySQL al obtener usuarios: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos al obtener usuarios: {err}"
        )
    except Exception as e:
        logger.error(f"Error inesperado al obtener usuarios: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor. Contacte al administrador."
        )
    finally:
        if cursor:
            cursor.close()

# Endpoint para crear un nuevo usuario con contraseña encriptada
@usuariosRtr.post(
    "/usuarios/", # Cambiado a /usuarios/ para seguir las convenciones RESTful
    response_model=UsuarioResponse, # Indica que la respuesta será un UsuarioResponse
    status_code=status.HTTP_201_CREATED,
    tags=['Gestion de usuarios'],
    summary="Registra un nuevo usuario en el sistema"
)
async def create_user(
    usuario_data: UsuarioCreate, # Renombrado para mayor claridad
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Crea un nuevo usuario con la contraseña encriptada.
    Verifica la unicidad del correo electrónico antes de la inserción.
    """
    cursor = None
    try:
        cursor = db_conn.cursor(dictionary=True) # Usar cursor de diccionario para consistencia

        # 1. Verificar si el correo ya existe
        check_query = "SELECT id_usuario FROM Usuarios WHERE correo_electronico = %s"
        cursor.execute(check_query, (usuario_data.correo_electronico,))
        if cursor.fetchone():
            logger.warning(f"Intento de registro con correo duplicado: {usuario_data.correo_electronico}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, # 409 Conflict es más apropiado que 400 Bad Request
                detail="El correo electrónico ya está registrado."
            )

        # 2. Generar salt y hashear la contraseña
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(usuario_data.password.encode("utf-8"), salt)

        # 3. Insertar nuevo usuario
        insert_query = """
        INSERT INTO Usuarios 
        (nombre, correo_electronico, telefono, cedula, password_hash, salt, id_rol, fecha_registro, ultimo_acceso, estado, fecha_creacion, fecha_actualizacion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), 'activo', NOW(), NOW())
        """
        values = (
            usuario_data.nombre,
            usuario_data.correo_electronico,
            usuario_data.telefono,
            usuario_data.cedula,
            hashed_password.decode("utf-8"),
            salt.decode("utf-8"), # Almacenar el salt también, aunque bcrypt lo incluye en el hash
            usuario_data.id_rol,
        )

        cursor.execute(insert_query, values)
        db_conn.commit() # Commit explícito
        new_user_id = cursor.lastrowid
        logger.info(f"Usuario {new_user_id} creado correctamente con correo: {usuario_data.correo_electronico}")

        # Opcional: Obtener el usuario recién creado para devolver una respuesta completa
        cursor.execute(
            """
            SELECT 
                u.id_usuario, u.nombre, u.correo_electronico, u.telefono, u.cedula, u.id_rol,
                u.fecha_registro, u.ultimo_acceso, u.estado, u.fecha_creacion, u.fecha_actualizacion,
                r.nombre_rol
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = %s
            """,
            (new_user_id,)
        )
        created_user = cursor.fetchone()
        if not created_user: # Esto no debería ocurrir si la inserción fue exitosa
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al recuperar el usuario recién creado."
            )

        return created_user # FastAPI lo serializará con UsuarioResponse
    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error MySQL al crear usuario: {err}", exc_info=True)
        # Puedes capturar IntegrityError si el correo_electronico tiene un UNIQUE CONSTRAINT en la DB
        if "Duplicate entry" in str(err) and "correo_electronico" in str(err):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos al crear usuario: {err}"
        )
    except Exception as e:
        db_conn.rollback()
        logger.error(f"Error inesperado al crear usuario: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor. Contacte al administrador."
        )
    finally:
        if cursor:
            cursor.close()

# Endpoint para actualizar un usuario
@usuariosRtr.put(
    "/usuarios/{usuario_id}", # Cambiado a /usuarios/{id} para seguir las convenciones RESTful
    response_model=UsuarioResponse, # Indica que la respuesta será un UsuarioResponse
    status_code=status.HTTP_200_OK,
    tags=['Gestion de usuarios'],
    summary="Actualiza la información de un usuario existente"
)
async def update_user(
    usuario_id: int,
    usuario_data: UsuarioUpdate, # Usar el esquema UsuarioUpdate para campos opcionales
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Actualiza la información de un usuario específico por su ID.
    Los campos que no se proporcionen en la solicitud no se actualizarán.
    """
    cursor = None
    try:
        cursor = db_conn.cursor(dictionary=True)

        # 1. Verificar si el usuario existe y obtener sus datos actuales
        cursor.execute("SELECT password_hash, salt FROM Usuarios WHERE id_usuario = %s", (usuario_id,))
        usuario_existente = cursor.fetchone()

        if not usuario_existente:
            logger.warning(f"Intento de actualización de usuario no encontrado: {usuario_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        # 2. Construir la consulta de actualización dinámicamente
        update_fields = []
        update_values = []

        # Recorrer los campos del modelo UsuarioUpdate y agregar solo los que tienen un valor
        for field, value in usuario_data.dict(exclude_unset=True).items():
            if field == "password" and value is not None:
                # Encriptar la nueva contraseña si se proporciona
                new_salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(value.encode("utf-8"), new_salt)
                update_fields.append("password_hash = %s")
                update_values.append(hashed_password.decode("utf-8"))
                update_fields.append("salt = %s") # Actualizar el salt también
                update_values.append(new_salt.decode("utf-8"))
            elif field != "password": # Excluir el campo password, ya que se maneja por separado
                update_fields.append(f"{field} = %s")
                update_values.append(value)

        # Si no hay campos para actualizar, retornar
        if not update_fields:
            return {"message": "No se proporcionaron datos para actualizar."}

        # Añadir las columnas de auditoría de actualización
        update_fields.append("fecha_actualizacion = NOW()")

        update_query = f"""
        UPDATE Usuarios 
        SET {', '.join(update_fields)}
        WHERE id_usuario = %s
        """
        update_values.append(usuario_id)

        cursor.execute(update_query, tuple(update_values))
        db_conn.commit()

        if cursor.rowcount == 0:
            # Esto puede pasar si el usuario existe, pero los datos proporcionados son idénticos a los existentes
            logger.info(f"No se realizaron cambios en el usuario {usuario_id} (datos idénticos).")
            return {"message": "No se realizaron cambios en el usuario (datos idénticos)."}

        logger.info(f"Usuario {usuario_id} actualizado correctamente.")

        # Opcional: Obtener el usuario actualizado para devolver una respuesta completa
        cursor.execute(
            """
            SELECT
                u.id_usuario, u.nombre, u.correo_electronico, u.telefono, u.cedula, u.id_rol,
                u.fecha_registro, u.ultimo_acceso, u.estado, u.fecha_creacion, u.fecha_actualizacion,
                r.nombre_rol
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = %s
            """,
            (usuario_id,)
        )
        updated_user = cursor.fetchone()
        if not updated_user: # Esto no debería ocurrir si la actualización fue exitosa
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al recuperar el usuario actualizado."
            )

        return updated_user
    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error MySQL al actualizar usuario {usuario_id}: {err}", exc_info=True)
        if "Duplicate entry" in str(err) and "correo_electronico" in str(err):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo electrónico ya está registrado por otro usuario."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos al actualizar usuario: {err}"
        )
    except Exception as e:
        db_conn.rollback()
        logger.error(f"Error inesperado al actualizar usuario {usuario_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor. Contacte al administrador."
        )
    finally:
        if cursor:
            cursor.close()

# Endpoint para eliminar un usuario (cambio de estado a 'inactivo' es preferible a borrado físico)
@usuariosRtr.delete(
    "/usuarios/{usuario_id}", # Cambiado a /usuarios/{id} para seguir las convenciones RESTful
    status_code=status.HTTP_200_OK,
    tags=['Gestion de usuarios'],
    summary="Elimina (desactiva) un usuario del sistema"
)
async def delete_user(
    usuario_id: int,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Desactiva un usuario cambiando su estado a 'inactivo'
    en lugar de eliminarlo físicamente de la base de datos.
    Esto es una mejor práctica para mantener la integridad referencial y los registros históricos.
    """
    cursor = None
    try:
        cursor = db_conn.cursor() # No necesitamos diccionario para DELETE/UPDATE

        # Verificar si el usuario existe antes de intentar eliminarlo/desactivarlo
        cursor.execute("SELECT id_usuario FROM Usuarios WHERE id_usuario = %s", (usuario_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

        # Opción 1: Eliminación Lógica (recomendado)
        update_status_query = "UPDATE Usuarios SET estado = 'inactivo', fecha_actualizacion = NOW() WHERE id_usuario = %s"
        cursor.execute(update_status_query, (usuario_id,))
        db_conn.commit()

        if cursor.rowcount == 0:
            # Esto puede ocurrir si el usuario ya estaba inactivo
            logger.info(f"Usuario {usuario_id} ya estaba inactivo o no se pudo actualizar el estado.")
            return {"message": "Usuario no fue desactivado o ya estaba inactivo."}

        logger.info(f"Usuario {usuario_id} desactivado correctamente.")
        return {"message": "Usuario desactivado correctamente."}

    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error MySQL al eliminar/desactivar usuario {usuario_id}: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos al eliminar/desactivar usuario: {err}"
        )
    except Exception as e:
        db_conn.rollback()
        logger.error(f"Error inesperado al eliminar/desactivar usuario {usuario_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor. Contacte al administrador."
        )
    finally:
        if cursor:
            cursor.close()

# Endpoint para validar el login
@usuariosRtr.post(
    "/login/", # Renombrado a /login/ para consistencia y convención
    response_model=LoginResponse, # Indica que la respuesta será un LoginResponse
    status_code=status.HTTP_200_OK,
    tags=['Gestion de login'],
    summary="Valida las credenciales de un usuario y retorna sus datos"
)
async def login(
    data: LoginRequest,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Valida las credenciales de correo electrónico y contraseña de un usuario.
    Retorna los datos del usuario si las credenciales son correctas.
    """
    cursor = None
    try:
        cursor = db_conn.cursor(dictionary=True) # Usar cursor de diccionario

        select_query = """
        SELECT id_usuario, nombre, correo_electronico, telefono, cedula, id_rol, password_hash, salt, estado
        FROM Usuarios
        WHERE correo_electronico = %s
        """
        cursor.execute(select_query, (data.correo_electronico,))
        result = cursor.fetchone()

        if not result:
            logger.warning(f"Intento de login fallido: correo {data.correo_electronico} no encontrado.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

        stored_password_hash = result["password_hash"].encode("utf-8")
        # El salt ya está incluido en el hash de bcrypt, no se necesita recuperarlo por separado
        # Si hubieras almacenado el salt por separado, necesitarías result["salt"].encode("utf-8")

        # Verificar si el usuario está inactivo
        if result["estado"] == 'inactivo':
            logger.warning(f"Intento de login de usuario inactivo: {data.correo_electronico}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta está inactiva.")


        # Validar la contraseña con bcrypt
        if bcrypt.checkpw(data.password.encode("utf-8"), stored_password_hash):
            # Actualizar la fecha de último acceso
            update_access_query = "UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id_usuario = %s"
            cursor.execute(update_access_query, (result["id_usuario"],))
            db_conn.commit() # Commit de la actualización de ultimo_acceso
            logger.info(f"Login exitoso para usuario: {data.correo_electronico}")

            # Devolver los datos del usuario (excluyendo el hash de contraseña y salt)
            return {
                "id_usuario": result["id_usuario"],
                "nombre": result["nombre"],
                "correo_electronico": result["correo_electronico"],
                "telefono": result["telefono"],
                "cedula": result["cedula"],
                "id_rol": result["id_rol"],
                "message": "Bienvenido"
            }
        else:
            logger.warning(f"Intento de login fallido: contraseña incorrecta para {data.correo_electronico}.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")

    except mysql.connector.Error as err:
        logger.error(f"Error MySQL durante el login: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la base de datos durante el login: {err}"
        )
    except Exception as e:
        logger.error(f"Error inesperado durante el login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor. Contacte al administrador."
        )
    finally:
        if cursor:
            cursor.close()