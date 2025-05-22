# Importar la clase Union del módulo typing para manejar tipos de datos opcionales
from typing import Union

# Importar la clase FastAPI para crear la aplicación web
from fastapi import FastAPI

# Importar el router desde el módulo iDriveAppRtr de BackAliante.Usuarios
from Usuarios import usuariosRtr
from Salones import salonesRtr
from Roles import rolesRtr
from Clases import clasesRtr
from Agendamientos import agendamientosRtr
from Inscripciones import inscripcionesRtr


# Importar el middleware de CORS para manejar solicitudes entre diferentes dominios
from fastapi.middleware.cors import CORSMiddleware

# Crear una instancia de FastAPI
iDriveApp = FastAPI()

# Incluir el router desde el módulo
iDriveApp.include_router(usuariosRtr)
iDriveApp.include_router(rolesRtr)
iDriveApp.include_router(salonesRtr)
iDriveApp.include_router(clasesRtr)
iDriveApp.include_router(agendamientosRtr)
iDriveApp.include_router(inscripcionesRtr)



# Definir los orígenes permitidos para las solicitudes CORS
origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]

# Añadir el middleware de CORS para permitir solicitudes desde los orígenes definidos
iDriveApp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

iDriveApp.include_router(agendamientosRtr)

# Definir la ruta raíz que retorna un mensaje simple
@iDriveApp.get("/")
async def read_root():
    return {"Hello": "World"}

# Definir una ruta que acepta un parámetro de consulta opcional 'q'
@iDriveApp.get("/items/")
async def read_param_item(q: Union[str, None] = None):
    return {"q": q}

# Definir una ruta que acepta un parámetro en la ruta 'item_id'
@iDriveApp.get("/items/{item_id}")
async def read_paramInPath_item(item_id: int):
    return {"item_id": item_id}

# Definir una ruta que acepta tanto un parámetro en la ruta 'item_id' como un parámetro de consulta opcional 'q'
@iDriveApp.get("/items/{item_id}")
async def read_both_paramTypes_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

# Definir una ruta para eliminar un ítem por su 'item_id'
@iDriveApp.delete("/items_del/{item_id}")
async def delete_by_id(item_id: int):
    return {"resultado": "Se ha eliminado correctamente el item solicitado"}

