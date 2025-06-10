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

# CAMBIO: El modelo para crear un usuario ya no necesita la contraseña
class UsuarioCreateAdmin(BaseModel):
    nombre: str
    correo_electronico: EmailStr
    telefono: str
    cedula: str
    id_rol: int

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

# CAMBIO: La respuesta del login ahora incluye una bandera para el cambio de contraseña
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    requiere_cambio_password: bool
    id_usuario: int
    nombre: str
    id_rol: int
    permisos: List[str]

class TokenData(BaseModel):
    id_usuario: Optional[int] = None
    permisos: List[str] = []
    
# CAMBIO: Nuevo modelo para el endpoint de cambio de contraseña
class PasswordChange(BaseModel):
    new_password: str = Field(..., min_length=8)

# CAMBIO: Modelo de respuesta para la creación de usuario, incluye la pass temporal
class UserCreationResponse(UsuarioResponse):
    password_temporal: str
    
# CAMBIO: Modelo para el endpoint de solicitud de reseteo de contraseña    
class SolicitarReseteoRequest(BaseModel):
    correo_electronico: EmailStr
    
# CAMBIO: Modelo para el endpoint de reseteo de contraseña
class RealizarReseteoRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

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