<a name="readme-top"></a>

<div align="center">
  
  <img src="./src/assets/images/LOGOv2.png" alt="logo" width="250" height="250" />
  <br/>

  <h3><b>IDRIVE - Sistema de Gestión de Usuarios</b></h3>

</div>

---

# 📗 Tabla de Contenidos

- [📖 Acerca del Proyecto](#acerca-del-proyecto)
  - [🛠 Tecnologías Utilizadas](#tecnologias-utilizadas)
    - [🔧 Stack Tecnológico](#stack-tecnologico)
    - [✨ Características Clave](#caracteristicas-clave)
  - [🚀 Demo en Vivo](#demo-en-vivo)
- [💻 Cómo Empezar](#como-empezar)
  - [⚙️ Requisitos Previos](#requisitos-previos)
  - [📦 Instalación](#instalacion)
  - [🚀 Uso](#uso)
  - [🧪 Pruebas](#pruebas)
  - [🚢 Despliegue](#despliegue)
- [👥 Autores](#autores)
- [🔭 Futuras Características](#futuras-caracteristicas)
- [🤝 Contribuciones](#contribuciones)
- [⭐️ Apoya el Proyecto](#apoyo)
- [🙏 Agradecimientos](#agradecimientos)
- [📝 Licencia](#licencia)

---

# 📖 Acerca del Proyecto <a name="acerca-del-proyecto"></a>

**IDRIVE** es una aplicación web diseñada para gestionar usuarios de manera eficiente. Desarrollada con **FastAPI** en el backend y **React** en el frontend, permite la creación, edición, eliminación y búsqueda de usuarios con validación de datos, control de roles y cifrado de contraseñas.

---

## 🛠 Tecnologías Utilizadas <a name="tecnologias-utilizadas"></a>

### 🔧 Stack Tecnológico <a name="stack-tecnologico"></a>

**Backend**
- FastAPI
- MySQL
- Bcrypt

**Frontend**
- React.js
- Bootstrap
- Fetch API
- React Toastify

---

### ✨ Características Clave <a name="caracteristicas-clave"></a>

- 📋 CRUD de usuarios con nombre, correo, cédula y rol
- 🔒 Encriptación de contraseñas con Bcrypt
- 🔎 Búsqueda en tiempo real
- 🧠 Validación de datos y manejo de errores
- 🌐 Comunicación API REST entre frontend y backend

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 🚀 Demo en Vivo <a name="demo-en-vivo"></a>

> Próximamente

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 💻 Cómo Empezar <a name="como-empezar"></a>

### ⚙️ Requisitos Previos <a name="requisitos-previos"></a>

- Python 3.10+
- Node.js
- MySQL
- Git

---

### 📦 Instalación <a name="instalacion"></a>

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

---

### 🚀 Uso <a name="uso"></a>

1. Asegúrate de que tu base de datos esté activa.
2. Inicia el backend con `uvicorn`.
3. Abre otra terminal e inicia el frontend con `npm start`.

---

### 🧪 Pruebas <a name="pruebas"></a>

> Las pruebas automatizadas se implementarán en futuras versiones. Actualmente, puedes probar el funcionamiento de forma manual desde la interfaz web.

---

### 🚢 Despliegue <a name="despliegue"></a>

Este proyecto puede desplegarse en servicios como **Azure**, **Render**, o **Vercel** para el frontend.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 👥 Autores <a name="autores"></a>

👤 **Bryan Mora**

- GitHub: [@BryanMBS](https://github.com/BryanMBS)

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 🔭 Futuras Características <a name="futuras-caracteristicas"></a>

- [ ] Gestión de clases y horarios
- [ ] Panel de administración con estadísticas
- [ ] Soporte multilenguaje

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 🤝 Contribuciones <a name="contribuciones"></a>

¡Las contribuciones, issues y solicitudes de mejoras son bienvenidas!

Siente la libertad de revisar la [página de issues](https://github.com/BryanMBS/IDRIVE/issues).

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## ⭐️ Apoya el Proyecto <a name="apoyo"></a>

Si te gusta este proyecto, dale una estrella ⭐ en GitHub para apoyar su desarrollo.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 🙏 Agradecimientos <a name="agradecimientos"></a>

Gracias a Dios, a los instructores del SENA, y a todas las personas que apoyaron el desarrollo de este sistema.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

---

## 📝 Licencia <a name="licencia"></a>

Este proyecto está licenciado bajo la licencia MIT. Consulta el archivo [LICENSE.md](LICENSE.md) para más información.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>
