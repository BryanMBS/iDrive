# schemas.py

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Esquemas para Usuarios ---
class UsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    correo_electronico: EmailStr
    telefono: str = Field(..., max_length=20)
    cedula: str = Field(..., max_length=20)
    id_rol: int = Field(..., ge=1)

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=8)

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    correo_electronico: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    cedula: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=8)
    id_rol: Optional[int] = Field(None, ge=1)
    estado: Optional[str] = Field(None, pattern=r'^(activo|inactivo)$')

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado: str
    fecha_registro: datetime
    ultimo_acceso: Optional[datetime] = None
    nombre_rol: str

    class Config:
        from_attributes = True

# --- Esquemas para Autenticación ---
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id_usuario: int
    nombre: str
    id_rol: int
    permisos: List[str]

class TokenData(BaseModel):
    id_usuario: Optional[int] = None
    permisos: List[str] = []

# --- Esquemas para Clases (Opcional, pero buena práctica tenerlos aquí) ---
class ClaseCreate(BaseModel):
    nombre_clase: str
    descripcion: Optional[str] = None
    fecha_hora: datetime
    id_profesor: int
    id_salon: int
    cupos_disponibles: int = Field(gt=0)
    duracion_minutos: int = Field(default=60, gt=0)

class ClaseResponse(ClaseCreate):
    id_clase: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    class Config: from_attributes = True

class ClaseUpdate(BaseModel):
    nombre_clase: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    id_profesor: Optional[int] = None
    id_salon: Optional[int] = None
    cupos_disponibles: Optional[int] = Field(None, gt=0)
    duracion_minutos: Optional[int] = Field(None, gt=0)