import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Navbar.css";

function NavigationBar() {
  return (
    <Navbar expand="lg" className="custom-navbar shadow-sm">
      <Container>
        {/* Logo o Nombre del sistema */}
        <Navbar.Brand as={Link} to="/" className="brand">
          iDrive
        </Navbar.Brand>

        {/* Botón de menú para colapsar en móviles */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">Inicio</Nav.Link>
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
            {/* Opcional: Menú desplegable para perfil de usuario */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
