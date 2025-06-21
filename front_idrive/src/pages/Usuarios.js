// src/pages/Usuarios.js

import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ConfirmationModal from "../components/ConfirmationModal"; // Importa el modal de confirmación
import axios from 'axios';
import "./Usuarios.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

// Interceptor para añadir el token de autorización a cada solicitud
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
// Para manejar errores globalmente
const Usuarios = () => {
  const { hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [errorApi, setErrorApi] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: "", correo_electronico: "", telefono: "", cedula: "", id_rol: "",
  });

  // Estado para gestionar el modal de confirmación
  const [confirmation, setConfirmation] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    confirmVariant: 'btn-primary'
  });
// Función para cerrar el modal y limpiar el estado
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
// Función para cargar los roles desde la API
  const fetchRoles = useCallback(async () => {
    setErrorApi(null);
    try {
      const response = await apiClient.get("/roles/");
      setRoles(response.data || []);
    } catch (err) {
      console.error("Error al cargar roles:", err);
      setErrorApi(`No se pudieron cargar los roles: ${err.response?.data?.detail || err.message}.`);
    }
  }, []);

  useEffect(() => {
    if (hasPermission('usuarios:leer')) {
      fetchRoles();
      fetchUsuarios();
    } else {
      setErrorApi("No tienes permiso para ver esta sección.");
    }
  }, [hasPermission, fetchUsuarios, fetchRoles]);

// Funciones para manejar la creación y actualización de usuarios
  const handleCrearUsuario = async () => {
    const { password, ...datosParaEnviar } = formulario;
    if (!datosParaEnviar.nombre || !datosParaEnviar.correo_electronico || !datosParaEnviar.cedula || !datosParaEnviar.id_rol) {
      addNotification("Por favor, complete todos los campos requeridos.", 'error');
      return;
    }
    try {
      const response = await apiClient.post("/usuarios/", datosParaEnviar);
      addNotification(`Usuario creado. Pass temporal: ${response.data.password_temporal}`, 'success');
      cerrarModalYLimpiar();
      fetchUsuarios();
    } catch (err) {
      addNotification(`Error al crear el usuario: ${err.response?.data?.detail || err.message}`, 'error');
    }
  };
// Función para actualizar un usuario existente
  const handleActualizarUsuario = async () => {
    const datosParaEnviar = { ...formulario, id_rol: parseInt(formulario.id_rol, 10) };
    if (!datosParaEnviar.password) {
      delete datosParaEnviar.password;
    }
    try {
      await apiClient.put(`/usuarios/${usuarioEditandoId}`, datosParaEnviar);
      addNotification("Usuario actualizado exitosamente.", 'success');
      cerrarModalYLimpiar();
      fetchUsuarios();
    } catch (err) {
      addNotification(`Error al actualizar el usuario: ${err.response?.data?.detail || err.message}`, 'error');
    }
  };
  
  // Función que abre el modal de confirmación para eliminar
  const handleEliminarUsuario = (idUsuario, nombreUsuario) => {
    setConfirmation({
      show: true,
      title: 'Confirmar Eliminación',
      message: `¿Está seguro de que desea eliminar al usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      confirmVariant: 'btn-danger_User',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/usuarios/${idUsuario}`);
          addNotification("Usuario eliminado exitosamente.", 'success');
          fetchUsuarios();
        } catch (err) {
          addNotification(`Hubo un error al eliminar el usuario: ${err.response?.data?.detail || err.message}`, 'error');
        }
        setConfirmation({ ...confirmation, show: false }); // Ocultar modal
      },
    });
  };

  // Función que abre el modal de confirmación para activar/desactivar
  const handleCambiarEstado = (idUsuario, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    const variant = nuevoEstado === 'activo' ? 'btn-success_User' : 'btn-danger_User';

    setConfirmation({
      show: true,
      title: `Confirmar ${accion.charAt(0).toUpperCase() + accion.slice(1)}`,
      message: `¿Está seguro de que desea ${accion} a este usuario?`,
      confirmText: accion.charAt(0).toUpperCase() + accion.slice(1),
      confirmVariant: variant,
      onConfirm: async () => {
        try {
          await apiClient.put(`/usuarios/${idUsuario}`, { estado: nuevoEstado });
          addNotification(`Usuario ${accion}do exitosamente.`, 'info');
          fetchUsuarios();
        } catch (err) {
          addNotification(`Hubo un error al cambiar el estado: ${err.response?.data?.detail || err.message}`, 'error');
        }
        setConfirmation({ ...confirmation, show: false }); // Ocultar modal
      },
    });
  };

  const handleInputChange = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });
  const resetFormulario = () => setFormulario({ nombre: "", correo_electronico: "", telefono: "", cedula: "", id_rol: "" });
  const abrirModalParaCrear = () => { setEditando(false); resetFormulario(); setModalVisible(true); };
  const cerrarModalYLimpiar = () => { setModalVisible(false); setEditando(false); setUsuarioEditandoId(null); resetFormulario(); };
  
  // Función para editar un usuario existente
  const handleEditarUsuario = (usuario) => {
    setFormulario({
      nombre: usuario.nombre,
      correo_electronico: usuario.correo_electronico,
      telefono: usuario.telefono,
      cedula: usuario.cedula,
      password: "",
      id_rol: usuario.id_rol,
    });
    setUsuarioEditandoId(usuario.id_usuario);
    setEditando(true);
    setModalVisible(true);
  };
 // Filtrar usuarios por nombre
  const usuariosFiltrados = usuarios.filter((u) => u.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="d-flex main-layout-container">
      <Sidebar />
      <div className="content-area_User">
        <div className="container-fluid mt-4 usuarios-container">
          <div className="usuarios-header d-flex justify-content-between align-items-center mb-4">
            <h2 className="usuarios-title">Gestión de Usuarios</h2>
            {hasPermission('usuarios:crear') && (
              <button className="btn_User btn-primary_User" onClick={abrirModalParaCrear}>
                Crear Usuario
              </button>
            )}
          </div>
          <div className="mb-4">
            <input type="text" className="form-control search-input_User" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          {errorApi && <div className="alert alert-danger">{errorApi}</div>}
          <div className="table-responsive">
            <table className="table table-hover usuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Rol</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id_usuario}>
                      <td>{u.nombre}</td>
                      <td>{u.correo_electronico}</td>
                      <td>{u.telefono}</td>
                      <td><span className={`status-badge status-${u.estado}`}>{u.estado}</span></td>
                      <td>{u.nombre_rol}</td>
                      <td className="acciones-buttons_User">
                        {hasPermission('usuarios:editar') && (
                           <>
                            <button className={`btn_User btn-status me-2 ${u.estado === 'activo' ? 'btn-status-active' : 'btn-status-inactive'}`} onClick={() => handleCambiarEstado(u.id_usuario, u.estado)}>
                              {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                            <button className="btn_User btn-edit_User me-2" onClick={() => handleEditarUsuario(u)}>Editar</button>
                           </>
                        )}
                        {hasPermission('usuarios:eliminar') && (
                          <button className="btn_User btn-delete_User" onClick={() => handleEliminarUsuario(u.id_usuario, u.nombre)}>Eliminar</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      {errorApi ? "No tienes permiso para ver los usuarios." : "No hay usuarios para mostrar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Modal para Crear y Editar Usuario */}
          {modalVisible && (
            <div className="modal-overlay_User">
              <div className="modal-container_User">
                <h4 className="modal-title_User">{editando ? "Editar Usuario" : "Crear Usuario"}</h4>
                <input type="text" name="nombre" placeholder="Nombre" value={formulario.nombre} onChange={handleInputChange} className="modal-input_User" />
                <input type="email" name="correo_electronico" placeholder="Correo" value={formulario.correo_electronico} onChange={handleInputChange} className="modal-input_User" />
                <input type="text" name="telefono" placeholder="Teléfono" value={formulario.telefono} onChange={handleInputChange} className="modal-input_User" />
                <input type="text" name="cedula" placeholder="Cédula" value={formulario.cedula} onChange={handleInputChange} className="modal-input_User" />
                {editando && (
                  <input type="password" name="password" placeholder="Nueva contraseña (opcional)" onChange={handleInputChange} className="modal-input_User" />
                )}
                <select name="id_rol" value={formulario.id_rol} onChange={handleInputChange} className="modal-select_User">
                  <option value="">Seleccione un rol</option>
                  {roles.map((rol) => (<option key={rol.id_rol} value={rol.id_rol}>{rol.nombre_rol}</option>))}
                </select>
                <div className="modal-buttons_User mt-4">
                  <button className="btn_User btn-save_User me-3" onClick={editando ? handleActualizarUsuario : handleCrearUsuario}>{editando ? "Actualizar" : "Guardar"}</button>
                  <button className="btn_User btn-cancel_User" onClick={cerrarModalYLimpiar}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmación para Acciones Críticas */}
          <ConfirmationModal
            show={confirmation.show}
            title={confirmation.title}
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onClose={() => setConfirmation({ ...confirmation, show: false })}
            confirmText={confirmation.confirmText}
            confirmVariant={confirmation.confirmVariant}
          />
        </div>
      </div>
    </div>
  );
};

export default Usuarios;