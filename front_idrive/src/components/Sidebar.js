import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css"; // Importa los estilos

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Elimina el token
    navigate("/login"); // Redirige al login
  };

  return (
    <ul className="sidebar">
      {/* Logo y nombre de iDrive */}
      <Link className="sidebar-brand" to="/dashboard">
        <div className="sidebar-brand-icon">
          <i className="fas fa-car-side"></i>
        </div>
        <div className="sidebar-brand-text">iDrive</div>
      </Link>

      <hr className="sidebar-divider" />

      {/* Dashboard */}
      <li className="nav-item">
        <Link className="nav-link" to="/dashboard">
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </Link>
      </li>

      <hr className="sidebar-divider" />

      {/* Agendamientos */}
      <li className="nav-item">
        <Link className="nav-link" to="/agendamientos">
          <i className="fas fa-calendar-check"></i>
          <span>Agendamientos</span>
        </Link>
      </li>

      <hr className="sidebar-divider" />

      {/* Inscripciones */}
      <li className="nav-item">
        <Link className="nav-link" to="/inscripciones">
          <i className="fas fa-file-signature"></i>
          <span>Inscripciones</span>
        </Link>
      </li>

      <hr className="sidebar-divider" />

      {/* Usuarios */}
      <li className="nav-item">
        <Link className="nav-link" to="/usuarios">
          <i className="fas fa-user-cog"></i>
          <span>Usuarios</span>
        </Link>
      </li>

      <hr className="sidebar-divider" />

      {/* Clases */}
      <li className="nav-item">
        <Link className="nav-link" to="/clases">
          <i className="fas fa-chalkboard-teacher"></i>
          <span>Clases</span>
        </Link>
      </li>

      <hr className="sidebar-divider" />

      {/* Botón de Cerrar Sesión */}
      <div className="logout-btn-container text-center p-3">
        <button className="btn btn-danger" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
        </button>
      </div>
    </ul>
  );
};

export default Sidebar;


