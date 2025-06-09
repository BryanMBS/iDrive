// Home.js

import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";
import { FaCalendarAlt, FaTasks, FaUserCheck, FaFileAlt } from "react-icons/fa";

//---------------------------------------------
// COMPONENTE PRINCIPAL DE LA PÁGINA DE INICIO
//---------------------------------------------
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="_HM_home-page">
      <NavigationBar />
      <main className="_HM_home-content">
        {/*---------------------------------------------*/}
        {/* SECCIÓN 1: HERO - INTRODUCCIÓN PRINCIPAL */}
        {/*---------------------------------------------*/}
        <header className="_HM_hero-section text-center text-white">
          <Container>
            <h1 className="_HM_hero-title">La gestión de clases teóricas, ahora más simple que nunca.</h1>
            <p className="_HM_hero-subtitle lead">
              iDrive es la plataforma web que conecta a escuelas de conducción y estudiantes para una gestión académica eficiente y sin complicaciones.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate("/login")}>
              Acceder a la Plataforma
            </Button>
          </Container>
        </header>

        {/*---------------------------------------------*/}
        {/* SECCIÓN 2: CARACTERÍSTICAS */}
        {/*---------------------------------------------*/}
        <section id="features" className="_HM_features-section py-5">
          <Container>
            <div className="text-center mb-5">
              <h2 className="_HM_section-title">Todo lo que necesitas en un solo lugar</h2>
            </div>
            <Row>
              {/* Tarjeta de Característica: Calendario */}
              <Col md={6} lg={3} className="mb-4 d-flex">
                <Card className="_HM_feature-card text-center w-100">
                  <Card.Body>
                    <div className="_HM_feature-icon mb-3"><FaCalendarAlt /></div>
                    <Card.Title>Calendario Inteligente</Card.Title>
                    <Card.Text>
                      Visualiza y gestiona horarios de clases teóricas en tiempo real. Evita solapamientos y confirma la asistencia de forma digital.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              {/* Tarjeta de Característica: Seguimiento */}
              <Col md={6} lg={3} className="mb-4 d-flex">
                <Card className="_HM_feature-card text-center w-100">
                  <Card.Body>
                    <div className="_HM_feature-icon mb-3"><FaTasks /></div>
                    <Card.Title>Seguimiento de Progreso</Card.Title>
                    <Card.Text>
                      Los estudiantes pueden ver su avance y las clases completadas, ¡todo desde su perfil personal!
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              {/* Tarjeta de Característica: Documentos */}
              <Col md={6} lg={3} className="mb-4 d-flex">
                <Card className="_HM_feature-card text-center w-100">
                  <Card.Body>
                    <div className="_HM_feature-icon mb-3"><FaFileAlt /></div>
                    <Card.Title>Gestión de Documentos</Card.Title>
                    <Card.Text>
                      Centraliza y gestiona la documentación de los alumnos, como inscripciones y certificados, de forma segura y accesible.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              {/* Tarjeta de Característica: Perfiles */}
              <Col md={6} lg={3} className="mb-4 d-flex">
                <Card className="_HM_feature-card text-center w-100">
                  <Card.Body>
                    <div className="_HM_feature-icon mb-3"><FaUserCheck /></div>
                    <Card.Title>Perfiles Dedicados</Card.Title>
                    <Card.Text>
                      Una vista para la administración y otra para estudiantes, cada una con las herramientas que necesita.
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>

        {/*---------------------------------------------*/}
        {/* SECCIÓN 3: CÓMO FUNCIONA */}
        {/*---------------------------------------------*/}
        <section className="_HM_how-it-works-section py-5">
            <Container>
                <Row className="align-items-center">
                    <Col md={6} className="mb-4 mb-md-0">
                        <div className="_HM_image-illustration"></div>
                    </Col>
                    <Col md={6}>
                        <h2 className="_HM_section-title">Empezar es así de fácil</h2>
                        <div className="_HM_step">
                            <h4><span className="_HM_step-number">1</span> Configura</h4>
                            <p>La escuela de conducción crea su cuenta y programa las clases teóricas disponibles.</p>
                        </div>
                        <div className="_HM_step">
                            <h4><span className="_HM_step-number">2</span> Inscribe</h4>
                            <p>Los estudiantes se registran y acceden a su portal personal para ver su progreso.</p>
                        </div>
                        <div className="_HM_step">
                            <h4><span className="_HM_step-number">3</span> ¡Gestiona y Aprende!</h4>
                            <p>Administra horarios y alumnos mientras ellos reservan y avanzan en su formación.</p>
                        </div>
                    </Col>
                </Row>
            </Container>
        </section>
        
        {/*---------------------------------------------*/}
        {/* SECCIÓN 4: LLAMADA A LA ACCIÓN FINAL (CTA) */}
        {/*---------------------------------------------*/}
        <section id="contact" className="_HM_final-cta-section text-center text-white py-5">
            <Container>
                <h2 className="_HM_hero-title">¿Listo para llevar tu escuela al siguiente nivel?</h2>
                <p className="lead my-4">Únete a las escuelas que ya están optimizando su gestión con iDrive.</p>
                <Button variant="light" size="lg" onClick={() => navigate("/contact")}>
                  Contáctanos ahora
                </Button>
            </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;