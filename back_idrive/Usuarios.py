# Usuarios.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import bcrypt
import mysql.connector
from datetime import datetime

# Importar la dependencia y el logger de nuestro módulo de conexión centralizado
from Clever_MySQL_conn import get_db_connection, logger

# --- Buena Práctica: Router Modular ---
# El prefijo hace que todas las rutas en este archivo comiencen con /usuarios, ej., /usuarios/login
usuariosRtr = APIRouter(prefix="/usuarios", tags=['Gestion de Usuarios'])

# --- Modelos Pydantic para Validación de Datos ---

class UsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    correo_electronico: EmailStr
    telefono: str = Field(..., max_length=20)
    cedula: str = Field(..., max_length=20)
    id_rol: int = Field(..., ge=1)

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=8, description="La contraseña debe tener al menos 8 caracteres")

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    correo_electronico: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    cedula: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=8)
    id_rol: Optional[int] = Field(None, ge=1)
    estado: Optional[str] = Field(None, pattern=r'^(activo|inactivo)$') # Permitir actualizar el estado

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado: str
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None
    nombre_rol: str # Campo del JOIN con la tabla Roles

    class Config:
        from_attributes = True # Sintaxis de Pydantic v2 para mapear resultados de la BD al modelo

class LoginRequest(BaseModel):
    correo_electronico: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str # En una app real, esto sería un token JWT
    id_usuario: int
    nombre: str
    id_rol: int
    message: str

# --- Endpoints de la API ---
# Endpoint para registrar un nuevo usuario con contraseña encriptada
@usuariosRtr.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario"
)
async def create_user(
    usuario_data: UsuarioCreate,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Crea un nuevo usuario con una contraseña encriptada.
    - Hashea la contraseña usando bcrypt.
    - Asegura que el correo sea único antes de la inserción.
    """
    # --- Buena Práctica: Hashing Seguro de Contraseñas ---
    # bcrypt almacena el salt dentro del propio hash, por lo que solo necesitamos una columna.
    hashed_password = bcrypt.hashpw(usuario_data.password.encode("utf-8"), bcrypt.gensalt())

    insert_query = """
        INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol, fecha_registro, estado)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), 'activo')
    """
    values = (
        usuario_data.nombre,
        usuario_data.correo_electronico,
        usuario_data.telefono,
        usuario_data.cedula,
        hashed_password.decode("utf-8"),
        usuario_data.id_rol,
    )

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(insert_query, values)
        new_user_id = cursor.lastrowid
        db_conn.commit()

        # Obtener los datos completos del usuario para devolverlos en la respuesta
        get_user_query = """
            SELECT u.*, r.nombre_rol FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = %s
        """
        cursor.execute(get_user_query, (new_user_id,))
        created_user = cursor.fetchone()
        cursor.close()

        if not created_user:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el usuario creado.")
            
        logger.info(f"Usuario creado con ID: {new_user_id}")
        return created_user

    except mysql.connector.Error as err:
        db_conn.rollback()
        # Manejar errores específicos como entradas duplicadas para un mejor feedback al cliente
        if err.errno == 1062: # Entrada duplicada
            logger.warning(f"Fallo al crear usuario. Correo duplicado: {usuario_data.correo_electronico}")
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Un usuario con este correo o cédula ya existe.")
        logger.error(f"Error de base de datos durante la creación de usuario: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error de base de datos durante la creación de usuario.")
    
#-------------------------------------------------------------------------------------------------------------------------------------    
# Endpoint para autenticar un usuario
@usuariosRtr.post(
    "/login",
    response_model=LoginResponse,
    summary="Autenticar un usuario"
)
async def login(
    data: LoginRequest,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Valida las credenciales del usuario. Si es exitoso, actualiza la
    marca de tiempo 'ultimo_acceso' y devuelve la información del usuario.
    """
    query = """
        SELECT id_usuario, nombre, id_rol, password_hash, estado
        FROM Usuarios WHERE correo_electronico = %s
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, (data.correo_electronico,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña inválidos.")

        if user['estado'] == 'inactivo':
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Esta cuenta está inactiva.")

        # --- Buena Práctica: Verificar Contraseña ---
        # Usa bcrypt.checkpw para comparar de forma segura la contraseña proporcionada con el hash almacenado.
        if bcrypt.checkpw(data.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # Actualizar la hora del último acceso en un login exitoso
            cursor.execute("UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id_usuario = %s", (user['id_usuario'],))
            db_conn.commit()
            cursor.close()
            
            logger.info(f"Login exitoso para el usuario ID: {user['id_usuario']}")
            # En una aplicación real, aquí generarías y devolverías un JWT.
            return {
                "token": f"fake-jwt-token-para-usuario-{user['id_usuario']}",
                "id_usuario": user['id_usuario'],
                "nombre": user['nombre'],
                "id_rol": user['id_rol'],
                "message": "¡Inicio de sesión exitoso!"
            }
        else:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña inválidos.")
            
    except mysql.connector.Error as err:
        logger.error(f"Error de base de datos durante el login: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos durante el login.")

#-------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener todos los usuarios
@usuariosRtr.get(
    "/",
    response_model=List[UsuarioResponse],
    summary="Obtener todos los usuarios"
)
async def get_users(
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Obtiene una lista de todos los usuarios con sus roles.
    """
    query = """
        SELECT u.*, r.nombre_rol FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
        ORDER BY u.nombre
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        users = cursor.fetchall()
        cursor.close()
        
        logger.info("Lista de usuarios obtenida exitosamente.")
        return users

    except mysql.connector.Error as err:
        logger.error(f"Error al obtener usuarios: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al obtener usuarios.")

#-------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener un usuario específico por ID
@usuariosRtr.get(
    "/{id_usuario}",
    response_model=UsuarioResponse,
    summary="Obtener un usuario por ID"
)
async def get_user(
    id_usuario: int,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Obtiene los detalles de un usuario específico por su ID.
    """
    query = """
        SELECT u.*, r.nombre_rol FROM Usuarios u
        JOIN Roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = %s
    """
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, (id_usuario,))
        user = cursor.fetchone()
        cursor.close()

        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
        
        logger.info(f"Usuario obtenido con ID: {id_usuario}")
        return user

    except mysql.connector.Error as err:
        logger.error(f"Error al obtener usuario: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al obtener usuario.")

#-------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para actualizar un usuario
@usuariosRtr.put(
    "/{id_usuario}",
    response_model=UsuarioResponse,
    summary="Actualizar un usuario"
)
async def update_user(
    id_usuario: int,
    usuario_data: UsuarioUpdate,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Actualiza los detalles de un usuario existente.
    - Permite actualizar todos los campos excepto el ID.
    - Si se proporciona una nueva contraseña, se encripta antes de guardar.
    """
    # Construir la consulta de actualización dinámicamente
    set_clause = []
    values = []

    if usuario_data.nombre is not None:
        set_clause.append("nombre = %s")
        values.append(usuario_data.nombre)
    if usuario_data.correo_electronico is not None:
        set_clause.append("correo_electronico = %s")
        values.append(usuario_data.correo_electronico)
    if usuario_data.telefono is not None:
        set_clause.append("telefono = %s")
        values.append(usuario_data.telefono)
    if usuario_data.cedula is not None:
        set_clause.append("cedula = %s")
        values.append(usuario_data.cedula)
    if usuario_data.password is not None:
        hashed_password = bcrypt.hashpw(usuario_data.password.encode("utf-8"), bcrypt.gensalt())
        set_clause.append("password_hash = %s")
        values.append(hashed_password.decode("utf-8"))
    if usuario_data.id_rol is not None:
        set_clause.append("id_rol = %s")
        values.append(usuario_data.id_rol)
    if usuario_data.estado is not None:
        set_clause.append("estado = %s")
        values.append(usuario_data.estado)

    if not set_clause:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No se proporcionaron datos para actualizar.")

    set_clause_str = ", ".join(set_clause)
    query = f"UPDATE Usuarios SET {set_clause_str} WHERE id_usuario = %s"
    values.append(id_usuario)

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, tuple(values))
        db_conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado o no se realizaron cambios.")

        # Obtener los datos actualizados del usuario
        cursor.execute("""
            SELECT u.*, r.nombre_rol FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = %s
        """, (id_usuario,))
        updated_user = cursor.fetchone()
        cursor.close()
        if not updated_user:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el usuario actualizado.")
        logger.info(f"Usuario actualizado con ID: {id_usuario}")
        return updated_user
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1452:  # Falla la restricción de clave foránea
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Rol no encontrado.")
        logger.error(f"Error al actualizar usuario: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al actualizar usuario.")
#-------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para eliminar un usuario
@usuariosRtr.delete(
    "/{id_usuario}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un usuario"
)
async def delete_user(
    id_usuario: int,
    db_conn: mysql.connector.MySQLConnection = Depends(get_db_connection)
):
    """
    Elimina un usuario existente por su ID.
    - No se permite eliminar usuarios con roles críticos (ej. Administrador).
    """
    # Verificar si el usuario existe y si es crítico
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT id_rol FROM Usuarios WHERE id_usuario = %s", (id_usuario,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
    
    if user['id_rol'] == 3:  # Supongamos que el rol 1 es Administrador
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No se puede eliminar un usuario con rol de administrador.")
    try:
        cursor.execute("DELETE FROM Usuarios WHERE id_usuario = %s", (id_usuario,))
        db_conn.commit()
        cursor.close()

        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado o ya eliminado.")
        
        logger.info(f"Usuario eliminado con ID: {id_usuario}")
    except mysql.connector.Error as err:
        db_conn.rollback()
        logger.error(f"Error al eliminar usuario: {err}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al eliminar usuario.")
#-------------------------------------------------------------------------------------------------------------------------------------
