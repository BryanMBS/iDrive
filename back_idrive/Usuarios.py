# Usuarios.py

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta
import mysql.connector

# Módulos locales de la aplicación
from Clever_MySQL_conn import get_db_connection, logger
from schemas import UsuarioCreate, UsuarioResponse, LoginResponse, UsuarioUpdate
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    has_permission,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Creación del router específico para usuarios
usuariosRtr = APIRouter(prefix="/usuarios", tags=['Gestion de Usuarios'])

# --- Endpoints de la API para Usuarios ---

@usuariosRtr.post(
    "/login",
    response_model=LoginResponse,
    summary="Autenticar un usuario y obtener token JWT"
)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db_conn=Depends(get_db_connection)):
    """
    Endpoint de inicio de sesión.
    - Recibe correo y contraseña en un formulario.
    - Verifica las credenciales contra la base de datos.
    - Si son válidas, obtiene los permisos del rol del usuario.
    - Genera y devuelve un token JWT que contiene el ID de usuario y sus permisos.
    """
    cursor = db_conn.cursor(dictionary=True)
    
    # 1. Buscar al usuario por su correo electrónico
    query_user = "SELECT id_usuario, nombre, id_rol, password_hash, estado FROM Usuarios WHERE correo_electronico = %s"
    cursor.execute(query_user, (form_data.username,)) # El email viene en el campo 'username' del form
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
    query_permisos = """
        SELECT p.nombre_permiso FROM Permisos p
        JOIN Roles_Permisos rp ON p.id_permiso = rp.id_permiso
        WHERE rp.id_rol = %s
    """
    cursor.execute(query_permisos, (user['id_rol'],))
    permisos = [row['nombre_permiso'] for row in cursor.fetchall()]
    
    # 5. Crear el token de acceso JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user['id_usuario']), "permisos": permisos}, # 'sub' es el estándar para el sujeto del token
        expires_delta=access_token_expires
    )
    
    # 6. Actualizar la fecha del último acceso
    cursor.execute("UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id_usuario = %s", (user['id_usuario'],))
    db_conn.commit()
    cursor.close()
    
    logger.info(f"Login exitoso para el usuario ID: {user['id_usuario']}")
    
    # 7. Devolver el token y la información del usuario al frontend
    return {
        "access_token": access_token,
        "id_usuario": user['id_usuario'],
        "nombre": user['nombre'],
        "id_rol": user['id_rol'],
        "permisos": permisos
    }

@usuariosRtr.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo usuario",
    dependencies=[Depends(has_permission("usuarios:crear"))]  # <-- RUTA PROTEGIDA
)
async def create_user(usuario_data: UsuarioCreate, db_conn=Depends(get_db_connection)):
    """Crea un nuevo usuario. Requiere el permiso 'usuarios:crear'."""
    hashed_password = get_password_hash(usuario_data.password)
    insert_query = """
        INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol, fecha_registro, estado)
        VALUES (%s, %s, %s, %s, %s, %s, NOW(), 'activo')
    """
    values = (
        usuario_data.nombre, usuario_data.correo_electronico, usuario_data.telefono,
        usuario_data.cedula, hashed_password, usuario_data.id_rol
    )
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(insert_query, values)
        new_user_id = cursor.lastrowid
        db_conn.commit()
        
        get_user_query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = %s"
        cursor.execute(get_user_query, (new_user_id,))
        created_user = cursor.fetchone()
        cursor.close()
        
        if not created_user:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "No se pudo recuperar el usuario creado.")
        
        logger.info(f"Usuario creado con ID: {new_user_id}")
        return created_user
    except mysql.connector.Error as err:
        db_conn.rollback()
        if err.errno == 1062:
            raise HTTPException(status.HTTP_409_CONFLICT, "Un usuario con este correo o cédula ya existe.")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error de base de datos al crear usuario.")

@usuariosRtr.get("/", response_model=List[UsuarioResponse], dependencies=[Depends(has_permission("usuarios:leer"))])
async def get_users(db_conn=Depends(get_db_connection)):
    """Obtiene una lista de todos los usuarios. Requiere el permiso 'usuarios:leer'."""
    query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol ORDER BY u.nombre"
    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query)
        return cursor.fetchall()
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al obtener usuarios.")

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

    try:
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute(query, tuple(values))
        db_conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
        
        get_user_query = "SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = %s"
        cursor.execute(get_user_query, (id_usuario,))
        updated_user = cursor.fetchone()
        cursor.close()
        return updated_user
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al actualizar usuario.")

@usuariosRtr.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(has_permission("usuarios:eliminar"))])
async def delete_user(id_usuario: int, db_conn=Depends(get_db_connection)):
    """Elimina un usuario. Requiere el permiso 'usuarios:eliminar'."""
    try:
        cursor = db_conn.cursor()
        cursor.execute("DELETE FROM Usuarios WHERE id_usuario = %s", (id_usuario,))
        db_conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado.")
        cursor.close()
    except mysql.connector.Error as err:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error al eliminar usuario.")