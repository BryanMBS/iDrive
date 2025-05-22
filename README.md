# Sistema de Gestión de Usuarios

Este proyecto es una aplicación web para gestionar usuarios, construida con **FastAPI** en el backend y **React** en el frontend. Permite crear, editar, eliminar y buscar usuarios, con control de roles y validación de datos.

## 🧰 Tecnologías utilizadas

### Backend

* [FastAPI](https://fastapi.tiangolo.com/)
* MySQL
* Bcrypt (para encriptación de contraseñas)

### Frontend

* React.js
* Bootstrap
* Fetch API
* React Toastify (para notificaciones)

## ⚙️ Características

* 📋 CRUD de usuarios con campos como nombre, correo, cédula y rol
* 🔒 Encriptación de contraseñas con Bcrypt
* 🔎 Búsqueda en tiempo real
* 🧠 Validación y control de errores
* 🌐 Comunicación por API REST entre frontend y backend

## 📦 Instalación

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 📁 Estructura del Proyecto

```
.
├── backend
│   ├── main.py
│   ├── routes/
│   ├── Clever_MySQL_conn.py
│   └── ...
├── frontend
│   ├── src/
│   │   ├── components/
│   │   └── pages/Usuarios.js
│   └── ...
```

## ✅ Recomendaciones de mejora

* Usar React Toastify para notificaciones amigables
* Agregar validación con Yup o Zod
* Protección de rutas según rol de usuario

## 📃 Licencia

MIT
