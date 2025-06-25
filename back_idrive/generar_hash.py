import sys
from passlib.context import CryptContext

# Usamos el mismo contexto que en nuestro archivo auth.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generar_hash(password: str):
    return pwd_context.hash(password)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python generar_hash.py <tu_contraseña>")
        sys.exit(1)
    
    mi_password = sys.argv[1]
    hashed_password = generar_hash(mi_password)
    
    print("\n¡Copia el siguiente hash y pégalo en tu script SQL!\n")
    print("---------------------------------------------------------")
    print(hashed_password)
    print("---------------------------------------------------------")
    
# Instrucciones adicionales
# Este script te ayudará a generar un hash de tu contraseña para que puedas insertarlo en tu base de datos y asi poder iniciar sesión como administrador.   
    
# 1.  Ejecuta el script pasándole la contraseña que quieres usar para tu usuario administrador. Por ejemplo, si quieres que tu contraseña sea 12345:
# python generar_hash.py "12345*"
# La terminal te devolverá un hash. Se verá como algo así (el tuyo será diferente):

# $2b$12$Eflg7jE9vY.oZ1Z9.I8g.O0iE3U/G/8a5jB8c3U.Y4.A3b.Z1Z9.(Al ejecutarse cambia el hash, así que asegúrate de copiarlo justo después de ejecutar el script).
# 2.  Copia este hash completo.

#3.  Corregir tu Archivo SQL
# Abre tu archivo Script_iDrive_DB_corregida.sql.
# Busca la línea donde insertas a tu usuario administrador ("Bryan Mora").
# Reemplaza la contraseña del insert por el hash que acabas de copiar.