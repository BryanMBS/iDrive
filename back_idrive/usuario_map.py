from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from Clever_MySQL_conn import cleverCursor

#usuarioRouter =  APIRouter()

#class UsuarioDB(BaseModel):
 #   id_usuario_Local: int
  #  apellido_Local: str
   # cedula_Local: str
  #  correo_electronico_Local: str
  #  direccion_Local: str
  # edad_Local: int
  #  estatura_Local: int
  #  nombre_Local: str
  #  numero_visitas_Local: int
   # telefono: str
    
#@iDriveApp.get("/cityPark_usuarios/", status_code=status.HTTP_302_FOUND)
#async def get_users():
 #   selectAll_query = 'Select * from usuario'
 #   cleverCursor.execute(selectAll_query)
 #   result = cleverCursor.fethall()
 #   return result