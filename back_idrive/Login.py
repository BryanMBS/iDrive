from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import mysql.connector
import bcrypt  # Importar bcrypt para el manejo de contraseñas
# Importamos las conexiones a MySQL desde Clever_MySQL_conn
from Clever_MySQL_conn import cleverCursor, mysqlConn

Login = FastAPI()

# Configuración de CORS para permitir el frontend
Login.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint de login
@Login.get("/Validacion_Login/")
def login(correo_electronico: str, password: str, response: Response):
    # Usamos cleverCursor que ya has definido
    cursor = cleverCursor

    # Consulta para buscar al usuario
    query = """
        SELECT id_usuario, nombre, correo_electronico, password, id_rol
        FROM usuarios
        WHERE correo_electronico = %s
    """
    cursor.execute(query, (correo_electronico,))
    user = cursor.fetchone()

    # Validar existencia y contraseña
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # Cambiar la validación de contraseña para usar bcrypt
    if not bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    # Crear respuesta con cookie de sesión
    json_response = JSONResponse(content={
        "id_usuario": user[0],
        "nombre": user[1],
        "correo_electronico": user[2],
        "id_rol": user[4],
        "message": "Inicio de sesión exitoso"
    })

    json_response.set_cookie(
        key="session",
        value=f"session_{user[0]}",
        httponly=True,
        secure=True,  # Cambiar a True en producción con HTTPS
        samesite="lax"
    )

    return json_response