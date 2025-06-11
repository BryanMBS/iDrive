# auth.py (Actualizado)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional

# CAMBIO: Importamos el modelo desde schemas.py
from schemas import TokenData

# CAMBIO: Definimos las constantes de configuración
SECRET_KEY = "tu_llave_super_secreta_y_larga_para_jwt_aqui"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
# CAMBIO: Configuramos el contexto de cifrado y el esquema OAuth2
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")

# Funciones para manejar la autenticación y autorización
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Función para obtener el hash de la contraseña
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

 # Función para crear un token de acceso
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Función para obtener el usuario actual a partir del token
def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id_usuario: str = payload.get("sub")
        permisos: list[str] = payload.get("permisos", [])
        if id_usuario is None:
            raise credentials_exception
        token_data = TokenData(id_usuario=int(id_usuario), permisos=permisos)
    except JWTError:
        raise credentials_exception
    return token_data

# Función para verificar permisos específicos
def has_permission(required_permission: str):
    def permission_checker(current_user: TokenData = Depends(get_current_user)): # Usamos TokenData
        if required_permission not in current_user.permisos:     # Verificamos los permisos del usuario
            raise HTTPException( 
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para realizar esta acción",
            )
        return current_user   # Retornamos el usuario actual si tiene permiso
    return permission_checker # Retornamos el verificador de permisos