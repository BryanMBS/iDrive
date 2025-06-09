# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar los routers refactorizados y finalizados
from Usuarios import usuariosRtr
from Salones import salonesRtr
from Roles import rolesRtr
from Clases import clasesRtr
from Agendamientos import agendamientosRtr

# --- Buena Práctica: Creación Centralizada de la App ---
iDriveApp = FastAPI(
    title="API de iDriveApp",
    description="API para la gestión de una escuela de conducción, incluyendo usuarios, clases y agendamientos.",
    version="1.0.0"
)

# --- Buena Práctica: Configuración de CORS ---
# Configura el Intercambio de Recursos de Origen Cruzado para permitir que tu
# aplicación de frontend se comunique con la API.
origins = [
    "http://localhost:3000", # Ejemplo para un frontend en React
    "http://localhost:8080",
    "http://127.0.0.1:3000"
]

iDriveApp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Permite todas las cabeceras
)

# --- Buena Práctica: Enrutamiento Modular ---
# Incluye cada router desde su respectivo módulo. Esto mantiene el archivo principal limpio
# y organiza el proyecto por funcionalidad.
iDriveApp.include_router(usuariosRtr)
iDriveApp.include_router(rolesRtr)
iDriveApp.include_router(salonesRtr)
iDriveApp.include_router(clasesRtr)
iDriveApp.include_router(agendamientosRtr)

# Un endpoint raíz simple para comprobaciones de estado
@iDriveApp.get("/", tags=["Root"])
async def read_root():
    """
    Endpoint raíz para confirmar que la API está en funcionamiento.
    """
    return {"status": "ok", "message": "¡Bienvenido a la API de iDriveApp!"}

# Nota: Los archivos 'Inscripciones.py' y 'Login.py' han sido eliminados
# ya que su funcionalidad ahora es manejada de manera correcta y más robusta
# por 'Agendamientos.py' y 'Usuarios.py' respectivamente.