# Usuarios.py

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from datetime import datetime, timedelta
import mysql.connector
import secrets
import string
import secrets
from schemas import SolicitarReseteoRequest, RealizarReseteoRequest
# Módulos locales de la aplicación
from Clever_MySQL_conn import get_db_connection, logger
# Se importan los modelos Pydantic desde el archivo centralizado de esquemas
from schemas import UsuarioResponse, LoginResponse, UsuarioUpdate, PasswordChange, UserCreationResponse, UsuarioCreateAdmin
# Se importan todas las funciones y dependencias de seguridad necesarias
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    has_permission,
    get_current_user,
    TokenData,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Creación del router específico para usuarios, con su prefijo y etiqueta para la documentación
usuariosRtr = APIRouter(prefix="/usuarios", tags=['Gestion de Usuarios'])

#-----------------------------------------------------------------------------------------------------------------------------------------------
# --- Endpoints de la API ---
# Endpoint para autenticar un usuario y generar un token JWT
@usuariosRtr.post(
    "/login",
    response_model=LoginResponse,
    summary="Autenticar un usuario y obtener token JWT"
)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db_conn=Depends(get_db_connection)):
    """
    Endpoint de inicio de sesión.
    - Recibe correo y contraseña en un formulario estándar de OAuth2.
    - Verifica las credenciales contra la base de datos.
    - Comprueba si el usuario necesita cambiar su contraseña.
    - Si las credenciales son válidas, obtiene los permisos del rol del usuario.
    - Genera y devuelve un token JWT que contiene el ID de usuario y sus permisos.
    """
    cursor = db_conn.cursor(dictionary=True)
    
    # 1. Buscar al usuario por su correo electrónico
    query_user = "SELECT id_usuario, nombre, id_rol, password_hash, estado, requiere_cambio_password FROM Usuarios WHERE correo_electronico = %s"
    cursor.execute(query_user, (form_data.username,))
    user = cursor.fetchone()

    # 2. Validar si el usuario existe y si la contraseña es correcta
    if not user or not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Verificar que la cuenta no esté inactiva
    if user['estado'] == 'inactivo':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Esta cuenta está inactiva.")

    # 4. Obtener los permisos asociados al rol del usuario
    query_permisos = "SELECT p.nombre_permiso FROM Permisos p JOIN Roles_Permisos rp ON p.id_permiso = rp.id_permiso WHERE rp.id_rol = %s"
    cursor.execute(query_permisos, (user['id_rol'],))
    permisos = [row['nombre_permiso'] for row in cursor.fetchall()]
    
    # 5. Crear el token de acceso JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user['id_usuario']), "permisos": permisos},
        expires_delta=access_token_expires
    )
    
    # 6. Actualizar la fecha del último acceso (solo si no es el primer login)
    if not user['requiere_cambio_password']:
      cursor.execute("UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id_usuario = %s", (user['id_usuario'],))
      db_conn.commit()
    
    cursor.close()
    
    logger.info(f"Login exitoso para el usuario ID: {user['id_usuario']}")
    
    # 7. Devolver la respuesta completa al frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "requiere_cambio_password": user['requiere_cambio_password'],
        "id_usuario": user['id_usuario'],
        "nombre": user['nombre'],
        "id_rol": user['id_rol'],
        "permisos": permisos
    }
#-----------------------------------------------------------------------------------------------------------------------------------------------    
# Endpoint para registrar un nuevo usuario con contraseña genérica
@usuariosRtr.post(
    "/",
    response_model=UserCreationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario con contraseña genérica",
    dependencies=[Depends(has_permission("usuarios:crear"))]
)
async def create_user(usuario_data: UsuarioCreateAdmin, db_conn=Depends(get_db_connection)):
    """Crea un nuevo usuario, genera una contraseña y lo marca para cambiarla."""
    alphabet = string.ascii_letters + string.digits
    generic_password = ''.join(secrets.choice(alphabet) for i in range(12))
    hashed_password = get_password_hash(generic_password)

    query = """
        INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol, fecha_registro, estado, requiere_cambio_password)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), 'activo', TRUE)
    """
    values = (
        usuario_data.nombre, usuario_data.correo_electronico, usuario_data.telefono,
        usuario_data.cedula, hashed_password, usuario_data.id_rol
    )
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, values)
        new_user_id = cursor.lastrowid
        db_conn.commit()
        
        get_query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = %s"
        cursor.execute(get_query, (new_user_id,))
        created_user = cursor.fetchone()
        cursor.close()

        if not created_user:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el usuario creado.")
        
        logger.info(f"Usuario creado con ID: {new_user_id}")
        
        response_data = created_user
        response_data['password_temporal'] = generic_password
        return response_data
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1062:
            raise HTTPException(status.HTTP_409_CONFLICT, "Un usuario con este correo o cédula ya existe.")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos.")
#-----------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para cambiar la contraseña del usuario autenticado
@usuariosRtr.put(
    "/cambiar-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permite a un usuario logueado cambiar su propia contraseña"
)
async def change_own_password(
    password_data: PasswordChange,
    current_user: TokenData = Depends(get_current_user),
    db_conn=Depends(get_db_connection)
):
    """Actualiza la contraseña del usuario autenticado y desactiva la bandera de cambio obligatorio."""
    hashed_password = get_password_hash(password_data.new_password)
    id_usuario = current_user.id_usuario

    query = "UPDATE Usuarios SET password_hash = %s, requiere_cambio_password = FALSE, ultimo_acceso = NOW() WHERE id_usuario = %s"
    try:
        cursor = db_conn.cursor()
        cursor.execute(query, (hashed_password, id_usuario))
        db_conn.commit()
        cursor.close()
        logger.info(f"Usuario {id_usuario} ha cambiado su contraseña exitosamente.")
    except mysql.connector.Error:
        db_conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña.")
#-----------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener la lista de usuarios

@usuariosRtr.get("/", response_model=List[UsuarioResponse], dependencies=[Depends(has_permission("usuarios:leer"))])
async def get_users(db_conn=Depends(get_db_connection)):
    """Obtiene una lista de todos los usuarios. Requiere el permiso 'usuarios:leer'."""
    query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol ORDER BY u.nombre"
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute(query)
    users = cursor.fetchall()
    cursor.close()
    return users
#-----------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para obtener un usuario por ID
@usuariosRtr.put("/{id_usuario}", response_model=UsuarioResponse, dependencies=[Depends(has_permission("usuarios:editar"))])
async def update_user(id_usuario: int, usuario_data: UsuarioUpdate, db_conn=Depends(get_db_connection)):
    """Actualiza un usuario existente. Requiere el permiso 'usuarios:editar'."""
    set_clause = []
    values = []
    update_data = usuario_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "password":
            set_clause.append("password_hash = %s")
            values.append(get_password_hash(value))
        else:
            set_clause.append(f"{key} = %s")
            values.append(value)
            
    if not set_clause:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No se proporcionaron datos para actualizar.")
    
    query = f"UPDATE Usuarios SET {', '.join(set_clause)} WHERE id_usuario = %s"
    values.append(id_usuario)

    cursor = db_conn.cursor(dictionary=True)
    cursor.execute(query, tuple(values))
    db_conn.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
    
    get_query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = %s"
    cursor.execute(get_query, (id_usuario,))
    updated_user = cursor.fetchone()
    cursor.close()
    return updated_user
#-----------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para eliminar un usuario

@usuariosRtr.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(has_permission("usuarios:eliminar"))])
async def delete_user(id_usuario: int, db_conn=Depends(get_db_connection)):
    """Elimina un usuario. Requiere el permiso 'usuarios:eliminar'."""
    cursor = db_conn.cursor()
    cursor.execute("DELETE FROM Usuarios WHERE id_usuario = %s", (id_usuario,))
    db_conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
    cursor.close()
    
#-----------------------------------------------------------------------------------------------------------------------------------------------
## Endpoints para el reseteo de contraseña
@usuariosRtr.post(
    "/solicitar-reseteo",
    status_code=status.HTTP_200_OK,
    summary="Solicitar reseteo de contraseña"
)
async def request_password_reset(
    request_data: SolicitarReseteoRequest,
    db_conn=Depends(get_db_connection)
):
    """
    Busca un usuario por email. Si existe, genera un token de reseteo,
    lo guarda en la BD y (simula) enviarlo por correo.
    """
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario FROM Usuarios WHERE correo_electronico = %s", (request_data.correo_electronico,))
    user = cursor.fetchone()

    if user:
        # Generar un token seguro y una fecha de expiración (ej. 1 hora)
        token = secrets.token_urlsafe(32)
        token_hash = get_password_hash(token) # Guardamos el hash por seguridad
        expires = datetime.utcnow() + timedelta(hours=1)

        # Guardar el token hasheado y su expiración en la BD
        query = "UPDATE Usuarios SET password_reset_token = %s, reset_token_expires = %s WHERE id_usuario = %s"
        cursor.execute(query, (token_hash, expires, user['id_usuario']))
        db_conn.commit()

        # --- SIMULACIÓN DE ENVÍO DE CORREO ---
        # En una aplicación real, aquí usarías un servicio como SendGrid o Mailgun
        reset_link = f"http://localhost:3000/reseteo-password/{token}"
        print("--- SIMULACIÓN DE CORREO ---")
        print(f"Para: {request_data.correo_electronico}")
        print(f"Asunto: Restablece tu contraseña de iDrive")
        print(f"Haz clic en el siguiente enlace para restablecer tu contraseña: {reset_link}")
        print("---------------------------")

    cursor.close()
    # Siempre devolvemos una respuesta genérica por seguridad, para no revelar si un email existe o no.
    return {"message": "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña."}
#-----------------------------------------------------------------------------------------------------------------------------------------------
# Endpoint para realizar el reseteo de contraseña con un token
@usuariosRtr.post(
    "/reseteo-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Realizar el reseteo de contraseña con un token"
)
async def perform_password_reset(
    request_data: RealizarReseteoRequest,
    db_conn=Depends(get_db_connection)
):
    """
    Valida el token de reseteo y actualiza la contraseña del usuario.
    """
    hashed_token = get_password_hash(request_data.token)
    
    # Esta es una forma de buscar el hash, pero puede ser lenta. 
    # En producción se podría optimizar. La comparación se hace en Python.
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, password_reset_token, reset_token_expires FROM Usuarios WHERE password_reset_token IS NOT NULL")
    
    user_to_update = None
    for user in cursor.fetchall():
        if user['password_reset_token'] and verify_password(request_data.token, user['password_reset_token']):
            user_to_update = user
            break
            
    if not user_to_update or user_to_update['reset_token_expires'] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El token es inválido o ha expirado.")

    new_hashed_password = get_password_hash(request_data.new_password)
    
    # Actualizar contraseña y anular el token
    query = "UPDATE Usuarios SET password_hash = %s, password_reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = %s"
    cursor.execute(query, (new_hashed_password, user_to_update['id_usuario']))
    db_conn.commit()
    cursor.close()    