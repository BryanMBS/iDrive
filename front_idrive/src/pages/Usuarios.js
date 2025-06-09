// Usuarios.js

import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import axios from 'axios';
import "./Usuarios.css";
import "bootstrap/dist/css/bootstrap.min.css";

//---------------------------------------------
// CONFIGURACIÓN DE AXIOS
//---------------------------------------------
// URL de la API centralizada desde variables de entorno.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Instancia de Axios para centralizar la configuración y la autenticación.
const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor que añade el token de autenticación a cada petición.
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

//---------------------------------------------
// COMPONENTE PRINCIPAL DE GESTIÓN DE USUARIOS
//---------------------------------------------
const Usuarios = () => {
  //---------------------------------------------
  // ESTADOS DEL COMPONENTE
  //---------------------------------------------
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [errorApi, setErrorApi] = useState(null);

  // Estado para el formulario de creación/edición de usuarios.
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo_electronico: "",
    telefono: "",
    cedula: "",
    password: "",
    id_rol: "",
  });

  //---------------------------------------------
  // FUNCIONES PARA OBTENER DATOS DE LA API
  //---------------------------------------------
  const fetchUsuarios = useCallback(async () => {
    setErrorApi(null);
    try {
      const response = await apiClient.get("/usuarios/");
      setUsuarios(response.data || []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setErrorApi(`No se pudieron cargar los usuarios: ${err.response?.data?.detail || err.message}.`);
      setUsuarios([]);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setErrorApi(null);
    try {
      const response = await apiClient.get("/roles/");
      setRoles(response.data || []);
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setErrorApi(`No se pudieron cargar los roles: ${err.response?.data?.detail || err.message}.`);
      setRoles([]);
    }
  }, []);

  //---------------------------------------------
  // EFECTO PARA CARGAR DATOS INICIALES
  //---------------------------------------------
  useEffect(() => {
    fetchRoles();
    fetchUsuarios();
  }, [fetchUsuarios, fetchRoles]);

  //---------------------------------------------
  // FUNCIONES CRUD (CREAR, ACTUALIZAR, ELIMINAR)
  //---------------------------------------------
  const handleCrearUsuario = async () => {
    if (!formulario.nombre || !formulario.correo_electronico || !formulario.cedula || !formulario.password || !formulario.id_rol) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }
    const datosParaEnviar = { ...formulario, id_rol: parseInt(formulario.id_rol, 10) };
    setErrorApi(null);
    try {
      await apiClient.post("/usuarios/", datosParaEnviar);
      alert("Usuario creado exitosamente");
      cerrarModalYLimpiar();
      fetchUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      alert(`Error al crear el usuario: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleActualizarUsuario = async () => {
    const datosParaEnviar = { ...formulario, id_rol: parseInt(formulario.id_rol, 10) };
    if (!datosParaEnviar.password) {
      delete datosParaEnviar.password; // No se envía la contraseña si está vacía
    }
    setErrorApi(null);
    try {
      await apiClient.put(`/usuarios/${usuarioEditandoId}`, datosParaEnviar);
      alert("Usuario actualizado exitosamente");
      cerrarModalYLimpiar();
      fetchUsuarios();
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      alert(`Error al actualizar el usuario: ${err.response?.data?.detail || err.message}`);
    }
  };
  
  const handleEliminarUsuario = async (idUsuario) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este usuario?")) return;
    setErrorApi(null);
    try {
      await apiClient.delete(`/usuarios/${idUsuario}`);
      alert("Usuario eliminado exitosamente.");
      fetchUsuarios();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      alert(`Hubo un error al eliminar el usuario: ${err.response?.data?.detail || err.message}`);
    }
  };

  //---------------------------------------------
  // MANEJADORES DE FORMULARIO Y MODAL
  //---------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  const resetFormulario = () => {
    setFormulario({ nombre: "", correo_electronico: "", telefono: "", cedula: "", password: "", id_rol: "" });
  };

  const abrirModalParaCrear = () => {
    setEditando(false);
    resetFormulario();
    setModalVisible(true);
    setErrorApi(null);
  };

  const handleEditarUsuario = (usuario) => {
    setFormulario({
      nombre: usuario.nombre,
      correo_electronico: usuario.correo_electronico,
      telefono: usuario.telefono,
      cedula: usuario.cedula,
      password: "", // No pre-rellenar la contraseña por seguridad
      id_rol: usuario.id_rol,
    });
    setUsuarioEditandoId(usuario.id_usuario);
    setEditando(true);
    setModalVisible(true);
    setErrorApi(null);
  };

  const cerrarModalYLimpiar = () => {
    setModalVisible(false);
    setEditando(false);
    setUsuarioEditandoId(null);
    resetFormulario();
    setErrorApi(null);
  };

  //---------------------------------------------
  // LÓGICA DE FILTRADO
  //---------------------------------------------
  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre && u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  //---------------------------------------------
  // RENDERIZADO DEL COMPONENTE
  //---------------------------------------------
  return (
    <div className="d-flex main-layout-container">
      <Sidebar />
      <div className="content-area_User">
        <div className="container-fluid mt-4 usuarios-container">
          <div className="usuarios-header d-flex justify-content-between align-items-center mb-4">
            <h2 className="usuarios-title">Gestión de Usuarios</h2>
            <button className="btn_User btn-primary_User" onClick={abrirModalParaCrear}>
              Crear Usuario
            </button>
          </div>
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control search-input_User"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {/* Alerta de error */}
          {errorApi && <div className="alert alert-danger">{errorApi}</div>}
          {/* Tabla de usuarios */}
          <div className="table-responsive">
            <table className="table table-hover usuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Cédula</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id_usuario}>
                      <td>{u.nombre}</td>
                      <td>{u.correo_electronico}</td>
                      <td>{u.telefono}</td>
                      <td>{u.cedula}</td>
                      <td>{u.nombre_rol}</td>
                      <td className="acciones-buttons_User">
                        <button className="btn_User btn-edit_User me-2" onClick={() => handleEditarUsuario(u)}>
                          Editar
                        </button>
                        <button className="btn_User btn-delete_User" onClick={() => handleEliminarUsuario(u.id_usuario)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">No hay usuarios para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/*---------------------------------------------*/}
          {/* MODAL PARA CREAR/EDITAR USUARIOS */}
          {/*---------------------------------------------*/}
          {modalVisible && (
            <div className="modal-overlay_User">
              <div className="modal-container_User">
                <h4 className="modal-title_User">{editando ? "Editar Usuario" : "Crear Usuario"}</h4>
                <input type="text" name="nombre" placeholder="Nombre" value={formulario.nombre} onChange={handleInputChange} className="modal-input_User" />
                <input type="email" name="correo_electronico" placeholder="Correo" value={formulario.correo_electronico} onChange={handleInputChange} className="modal-input_User" />
                <input type="text" name="telefono" placeholder="Teléfono" value={formulario.telefono} onChange={handleInputChange} className="modal-input_User" />
                <input type="text" name="cedula" placeholder="Cédula" value={formulario.cedula} onChange={handleInputChange} className="modal-input_User" />
                <input type="password" name="password" placeholder={editando ? "Nueva contraseña (opcional)" : "Contraseña"} value={formulario.password} onChange={handleInputChange} className="modal-input_User" />
                <select name="id_rol" value={formulario.id_rol} onChange={handleInputChange} className="modal-select_User">
                  <option value="">Seleccione un rol</option>
                  {roles.length > 0 ? (
                    roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>
                    ))
                  ) : (
                    <option disabled>Cargando roles...</option>
                  )}
                </select>
                <div className="modal-buttons_User mt-4">
                  <button className="btn_User btn-save_User me-3" onClick={editando ? handleActualizarUsuario : handleCrearUsuario}>
                    {editando ? "Actualizar" : "Guardar"}
                  </button>
                  <button className="btn_User btn-cancel_User" onClick={cerrarModalYLimpiar}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Usuarios;