import { useState, useEffect } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function NavigationBar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Navbar expand="lg" variant="dark" className={scrolled ? "custom-navbar scrolled" : "custom-navbar"}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-text">
          iDrive
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">Inicio</Nav.Link>
            {/* CAMBIO: El enlace ahora apunta a la página /contact */}
            <Nav.Link as={Link} to="/Contacto">Contacto</Nav.Link>
            <Button variant="outline-light" onClick={() => navigate("/login")}>
                Iniciar Sesión
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;