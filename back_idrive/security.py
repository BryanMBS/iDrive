# security.py
from pydantic import BaseModel, validators, EmailStr
from typing import Optional
import re
# clases de validación y seguridad para usuarios
class SecureUsuarioDB(BaseModel):
    nombre: str
    correo_electronico: EmailStr
    telefono: str  # Cambiar a str para mejor validación
    cedula: str
    password: str
    id_rol: int
# Validación de campos para el modelo SecureUsuarioDB
    @validators('nombre')
    def validate_nombre(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('El nombre debe tener al menos 2 caracteres')
        if len(v) > 50:
            raise ValueError('El nombre no puede exceder 50 caracteres')
        return v.strip()
# Validación de correo electrónico
    @validators('telefono')
    def validate_telefono(cls, v):
        # Validar formato de teléfono colombiano
        pattern = r'^(\+57|57)?[0-9]{10}$'
        if not re.match(pattern, str(v)):
            raise ValueError('Formato de teléfono inválido')
        return str(v)
# Validación de cédula
    @validators('cedula')
    def validate_cedula(cls, v):
        if not v.isdigit() or len(v) < 6 or len(v) > 12:
            raise ValueError('La cédula debe contener entre 6 y 12 dígitos')
        return v
# Validación de contraseña
    @validators('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

# CORS más seguro
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000"
]