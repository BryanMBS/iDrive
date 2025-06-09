import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "./Home.css";
import { FaCalendarAlt, FaChartBar, FaBook, FaUserCheck } from "react-icons/fa";



const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* SECCIÓN 1: HERO */}
      <header className="hero-section text-center text-white">
        <Container>
          <Row className="align-items-center justify-content-center">
            <Col md={8}>
              <h1 className="hero-title">La gestión de clases teóricas, ahora más simple que nunca.</h1>
              <p className="hero-subtitle lead">
                IDRIVE es la plataforma web que conecta a escuelas de conducción y estudiantes para una gestión académica eficiente y sin complicaciones.
              </p>
              <Button variant="outline-light" size="lg" className="ms-3" onClick={() => navigate("/login")}>
                Iniciar Sesión
              </Button>
            </Col>
          </Row>
        </Container>
      </header>

      {/* SECCIÓN 2: CARACTERÍSTICAS Y VENTAJAS */}
      <section className="features-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title">Todo lo que necesitas en un solo lugar</h2>
            <p className="lead text-muted">Diseñado para optimizar el tiempo de administradores y potenciar el aprendizaje de los alumnos.</p>
          </div>
          <Row>
            {/* Feature 1 */}
            <Col md={6} lg={3} className="mb-4">
              <Card className="feature-card h-100 text-center">
                <Card.Body>
                  <div className="feature-icon mb-3"><FaCalendarAlt /></div>
                  <Card.Title>Calendario Inteligente</Card.Title>
                  <Card.Text>
                    Visualiza y gestiona horarios de clases teóricas en tiempo real. Evita solapamientos y confirma la asistencia de forma digital.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            {/* Feature 2 */}
            <Col md={6} lg={3} className="mb-4">
              <Card className="feature-card h-100 text-center">
                <Card.Body>
                  <div className="feature-icon mb-3"><FaChartBar /></div>
                  <Card.Title>Seguimiento de Progreso</Card.Title>
                  <Card.Text>
                    Los estudiantes pueden ver su avance, las clases completadas ¡todo desde su perfil!
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            {/* Feature 3 */}
            <Col md={6} lg={3} className="mb-4">
              <Card className="feature-card h-100 text-center">
                <Card.Body>
                  <div className="feature-icon mb-3"><FaBook /></div>
                  <Card.Title>Material de Estudio</Card.Title>
                  <Card.Text>
                    Centraliza y comparte manuales, videos y cuestionarios. El material siempre disponible para los alumnos.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            {/* Feature 4 */}
            <Col md={6} lg={3} className="mb-4">
              <Card className="feature-card h-100 text-center">
                <Card.Body>
                  <div className="feature-icon mb-3"><FaUserCheck /></div>
                  <Card.Title>Perfiles Separados</Card.Title>
                  <Card.Text>
                    Una vista para la administración de la escuela y otra para los estudiantes, cada una con las herramientas que necesita.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* SECCIÓN 3: CÓMO FUNCIONA (CON IMAGEN) */}
      <section className="how-it-works-section py-5 bg-light">
          <Container>
              <Row className="align-items-center">
                  <Col md={6}>
                      <div className="image-illustration"></div>
                  </Col>
                  <Col md={6}>
                      <h2 className="section-title">Empezar es así de fácil</h2>
                      <div className="step">
                          <h4><span className="step-number">1</span> Regístrate</h4>
                          <p>La escuela de conducción crea su cuenta y configura las clases disponibles en minutos.</p>
                      </div>
                      <div className="step">
                          <h4><span className="step-number">2</span> Invita</h4>
                          <p>Los estudiantes se unen a través de un enlace simple y acceden a su portal personal.</p>
                      </div>
                      <div className="step">
                          <h4><span className="step-number">3</span> ¡Gestiona y Aprende!</h4>
                          <p>Administra horarios y materiales mientras los alumnos reservan y avanzan en su formación teórica.</p>
                      </div>
                  </Col>
              </Row>
          </Container>
      </section>
      
      {/* SECCIÓN 4: TESTIMONIOS (Placeholder) */}
      <section className="testimonials-section py-5">
        <Container className="text-center">
            <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
            <Row className="justify-content-center">
                <Col lg={8}>
                    <blockquote className="blockquote">
                        <p className="mb-0">"IDRIVE ha transformado la forma en que organizamos nuestras clases teóricas. ¡Nuestros estudiantes y administradores están encantados!"</p>
                        <footer className="blockquote-footer mt-2">Ana Pérez, Directora en <cite title="Source Title">Autoescuela Moderna</cite></footer>
                    </blockquote>
                </Col>
            </Row>
        </Container>
      </section>

      {/* SECCIÓN 5: FINAL CTA */}
      <section className="final-cta-section text-center text-white py-5">
          <Container>
              <h2 className="hero-title">¿Listo para llevar tu escuela al siguiente nivel?</h2>
              <p className="lead my-4">Únete a las escuelas que ya están optimizando su gestión con DRIVE.</p>
              <Button variant="light" size="lg" onClick={() => navigate("/register")}>
                Crear mi cuenta ahora
              </Button>
          </Container>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
