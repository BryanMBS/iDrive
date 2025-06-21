// src/components/Sidebar.js

import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useAuth } from '../context/AuthContext';
// --- Se importa el logo ---
import Logo_iDrive2 from '../assets/img/Logo_iDrive2.png'; //

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Se obtiene el objeto 'user' completo del contexto de autenticación
    const { user, logout, hasPermission } = useAuth(); //
  
    const handleLogout = () => {
        logout();
        navigate("/login");
    }; //

    return (
        <ul className="_SD_sidebar">
            {/* --- Contenedor del logo --- */}
            <div className="_SD_brand-container">
                <Link to="/dashboard">
                    <img src={Logo_iDrive2} alt="Logo iDrive" className="_SD_brand-logo" />
                </Link>
            </div>

            {/* --- Bloque de Información de Usuario --- */}
            {/* Se renderiza solo si el objeto 'user' existe */}
            {user && ( 
                <div className="_SD_user-info">
                    <i className="fas fa-user-circle _SD_user-icon"></i>
                    <div className="_SD_user-details">
                        <span className="_SD_user-name">{user.nombre || 'Nombre Apellido'}</span>
                        
                        {/* CAMBIO FINAL: Se lee 'user.nombre_rol', que es la propiedad correcta
                          enviada por el backend gracias al JOIN en la base de datos.
                        */}
                        <span className="_SD_user-role">{user.nombre_rol || 'Rol de Usuario'}</span>
                    </div>
                </div>
            )}

            <hr className="_SD_sidebar-divider" />

            {/* --- Enlaces de Navegación --- */}
            <li className={`_SD_nav-item ${location.pathname === "/dashboard" ? "_SD_active" : ""}`}>
                <Link className="_SD_nav-link" to="/dashboard">
                    <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
                </Link>
            </li>

            {/* Lógica de permisos para los enlaces */}
            
            {hasPermission('mis-clases:ver') && (
              <li className={`_SD_nav-item ${location.pathname === "/mis-clases" ? "_SD_active" : ""}`}>
                  <Link className="_SD_nav-link" to="/mis-clases">
                      <i className="fas fa-book-reader"></i><span>Mis Clases</span>
                  </Link>
              </li>
            )} 
            
            {hasPermission('agendamientos:ver:calendario') && (
              <li className={`_SD_nav-item ${location.pathname === "/agendamientos" ? "_SD_active" : ""}`}>
                  <Link className="_SD_nav-link" to="/agendamientos">
                      <i className="fas fa-calendar-check"></i><span>Agendamientos</span>
                  </Link>
              </li>
            )} 
            
            {hasPermission('usuarios:leer') && (
                <li className={`_SD_nav-item ${location.pathname === "/usuarios" ? "_SD_active" : ""}`}>
                    <Link className="_SD_nav-link" to="/usuarios">
                        <i className="fas fa-user-cog"></i><span>Usuarios</span>
                    </Link>
                </li>
            )} 

            {hasPermission('clases:crear') && (
              <li className={`_SD_nav-item ${location.pathname === "/clases" ? "_SD_active" : ""}`}>
                  <Link className="_SD_nav-link" to="/clases">
                      <i className="fas fa-chalkboard-teacher"></i><span>Gestión de Clases</span>
                  </Link>
              </li>
            )} 

            <hr className="_SD_sidebar-divider" />
            <li className="_SD_nav-item _SD_mt-auto">
                <div className="_SD_logout-btn-container">
                    <button className="_SD_btn-logout" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i><span>Cerrar Sesión</span>
                    </button>
                </div>
            </li>
        </ul>
    );
};

export default Sidebar;