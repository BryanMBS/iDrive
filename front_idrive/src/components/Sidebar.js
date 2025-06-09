import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- CAMBIO: La lógica de logout ahora es local en este componente ---
  const handleLogout = () => {
    // Se eliminan los datos de sesión directamente de localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Se redirige al usuario a la página de login
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <ul className={`_SD_sidebar ${isSidebarOpen ? "_SD_open" : ""}`}>
      {/* Logo y nombre de iDrive */}
      <Link className="_SD_sidebar-brand" to="/dashboard" onClick={handleLinkClick}>
        <div className="_SD_sidebar-brand-icon">
          <i className="fas fa-car-side"></i>
        </div>
        <div className="_SD_sidebar-brand-text">iDrive</div>
      </Link>

      <hr className="_SD_sidebar-divider _SD_my-0" />

      {/* Elementos del menú principal */}
      <li className={`_SD_nav-item ${location.pathname === "/dashboard" ? "_SD_active" : ""}`}>
        <Link className="_SD_nav-link" to="/dashboard" onClick={handleLinkClick}>
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </Link>
      </li>

      <li className={`_SD_nav-item ${location.pathname === "/agendamientos" ? "_SD_active" : ""}`}>
        <Link className="_SD_nav-link" to="/agendamientos" onClick={handleLinkClick}>
          <i className="fas fa-calendar-check"></i>
          <span>Agendamientos</span>
        </Link>
      </li>
      
      {/* Se elimina el link a Inscripciones que no existe en App.js */}

      <li className={`_SD_nav-item ${location.pathname === "/usuarios" ? "_SD_active" : ""}`}>
        <Link className="_SD_nav-link" to="/usuarios" onClick={handleLinkClick}>
          <i className="fas fa-user-cog"></i>
          <span>Usuarios</span>
        </Link>
      </li>

      <li className={`_SD_nav-item ${location.pathname === "/clases" ? "_SD_active" : ""}`}>
        <Link className="_SD_nav-link" to="/clases" onClick={handleLinkClick}>
          <i className="fas fa-chalkboard-teacher"></i>
          <span>Clases</span>
        </Link>
      </li>

      <hr className="_SD_sidebar-divider" />

      {/* Botón de Cerrar Sesión */}
      <li className="_SD_nav-item _SD_mt-auto">
        <div className="_SD_logout-btn-container">
          <button className="_SD_btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </li>
    </ul>
  );
};

export default Sidebar;