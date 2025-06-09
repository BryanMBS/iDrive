import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react"; // Para manejar el estado de los submenús
import "./Sidebar.css"; // Asegúrate de que esta ruta sea correcta

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obtener la ubicación actual

  // Estado para controlar la apertura/cierre del sidebar en móviles (si aplica)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem("token"); // Elimina el token de forma segura
    navigate("/login"); // Redirige al login
  };

  // Función para cerrar el sidebar en móviles al hacer clic en un enlace
  const handleLinkClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    // Asegúrate de que todas las clases CSS estén prefijadas con _SD
    <ul className={`_SD_sidebar ${isSidebarOpen ? "_SD_open" : ""}`}>
      {/* Botón para alternar el sidebar en móviles (si se implementa) */}
      {/* <button className="_SD_sidebar-toggler" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <i className="fas fa-bars"></i>
      </button> */}

      {/* Logo y nombre de iDrive */}
      <Link className="_SD_sidebar-brand" to="/dashboard" onClick={handleLinkClick}>
        <div className="_SD_sidebar-brand-icon">
          <i className="fas fa-car-side"></i> {/* Icono de Font Awesome */}
        </div>
        <div className="_SD_sidebar-brand-text">iDrive</div>
      </Link>

      <hr className="_SD_sidebar-divider _SD_my-0" /> {/* my-0 para reducir margen vertical */}

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

      <li className={`_SD_nav-item ${location.pathname === "/inscripciones" ? "_SD_active" : ""}`}>
        <Link className="_SD_nav-link" to="/inscripciones" onClick={handleLinkClick}>
          <i className="fas fa-file-signature"></i>
          <span>Inscripciones</span>
        </Link>
      </li>

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

      {/* Las clases de Bootstrap como 'd-none' y 'd-md-block' generalmente no se prefijan,
          pero si quieres que tu CSS sobrescriba cualquier Bootstrap o si no usas Bootstrap,
          deberías incluirlas con prefijo en tu CSS y aquí. */}
      <hr className="_SD_sidebar-divider _SD_d-none _SD_d-md-block" /> {/* Separador visible solo en escritorio */}

      {/* Botón de Cerrar Sesión */}
      {/* Si usas Bootstrap y quieres que estas clases sigan siendo de Bootstrap,
          no las prefijes. Si quieres que TODO sea personalizado y evitar conflictos,
          prefíjalas y define sus estilos en tu CSS con _SD.
          Aquí las he prefijado para consistencia con la solicitud. */}
      <div className="_SD_logout-btn-container _SD_text-center _SD_p-3 _SD_mt-auto">
        <button className="_SD_btn _SD_btn-logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt _SD_me-2"></i> Cerrar Sesión
        </button>
      </div>
    </ul>
  );
};

export default Sidebar;