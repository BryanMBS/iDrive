// Contacto.js

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import NavigationBar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Contacto.css";
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

//---------------------------------------------
// COMPONENTE PRINCIPAL DE CONTACTO
//---------------------------------------------

const Contact = () => {
    //---------------------------------------------
    // ESTADO DEL FORMULARIO
    //---------------------------------------------
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    //---------------------------------------------
    // MANEJADORES DE EVENTOS
    //---------------------------------------------

    // Actualiza el estado del formulario cuando el usuario escribe en los inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Procesa el envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        // En una aplicación real, aquí se enviarían los datos a un backend.
        alert(`Gracias por tu mensaje, ${formData.name}. Nos pondremos en contacto contigo pronto.`);
        // Limpia el formulario después del envío
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    //---------------------------------------------
    // RENDERIZADO DEL COMPONENTE
    //---------------------------------------------
    return (
        <div className="_CT_contact-page">
            <NavigationBar />
            <main className="_CT_main-content">
                <Container className="py-5">
                    <div className="text-center mb-5">
                        <h1 className="_CT_page-title">Contáctanos</h1>
                        <p className="lead text-muted">Estamos aquí para ayudarte. Completa el formulario o utiliza nuestros datos de contacto.</p>
                    </div>
                    <Row>
                        {/*---------------------------------------------*/}
                        {/* COLUMNA IZQUIERDA: FORMULARIO DE CONTACTO */}
                        {/*---------------------------------------------*/}
                        <Col lg={7} className="mb-5 mb-lg-0">
                            <Card className="_CT_contact-card">
                                <Card.Body>
                                    <h3 className="_CT_form-title">Envíanos un Mensaje</h3>
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3" controlId="formName">
                                            <Form.Label>Nombre Completo</Form.Label>
                                            <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Tu nombre" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="formEmail">
                                            <Form.Label>Correo Electrónico</Form.Label>
                                            <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="tu@email.com" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="formSubject">
                                            <Form.Label>Asunto</Form.Label>
                                            <Form.Control type="text" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Asunto de tu mensaje" required />
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="formMessage">
                                            <Form.Label>Mensaje</Form.Label>
                                            <Form.Control as="textarea" name="message" value={formData.message} onChange={handleInputChange} rows={5} placeholder="Escribe tu mensaje aquí..." required />
                                        </Form.Group>
                                        <Button variant="primary" type="submit" className="_CT_submit-btn">
                                            Enviar Mensaje
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/*---------------------------------------------*/}
                        {/* COLUMNA DERECHA: INFORMACIÓN Y MAPA */}
                        {/*---------------------------------------------*/}
                        <Col lg={5}>
                            <Card className="_CT_contact-card">
                                <Card.Body>
                                    <h3 className="_CT_info-title">Información de Contacto</h3>
                                    <div className="_CT_info-item">
                                        <FaMapMarkerAlt className="_CT_info-icon" />
                                        <div>
                                            <strong>Dirección:</strong>
                                            <p>Avenida El Dorado # 68C-61, Bogotá, Colombia</p>
                                        </div>
                                    </div>
                                    <div className="_CT_info-item">
                                        <FaPhone className="_CT_info-icon" />
                                        <div>
                                            <strong>Teléfono:</strong>
                                            <p>+57 316 730 35 17</p>
                                        </div>
                                    </div>
                                    <div className="_CT_info-item">
                                        <FaEnvelope className="_CT_info-icon" />
                                        <div>
                                            <strong>Email:</strong>
                                            <p>bmora@idrive.com</p>
                                        </div>
                                    </div>
                                    
                                    <div className="_CT_map-container mt-4">
                                        <iframe
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.666938971844!2d-74.0990206852378!3d4.65292099661498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9b2d3e3e3b3b%3A0x2e0e0a9f3e3e3b3b!2sAvenida%20El%20Dorado%20%2368c-61%2C%20Bogot%C3%A1!5e0!3m2!1ses!2sco!4v1670000000000"
                                            width="100%"
                                            height="250"
                                            style={{ border: 0 }}
                                            allowFullScreen=""
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title="Ubicación de iDrive"
                                        ></iframe>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </main>
            <Footer />
        </div>
    );
}

export default Contact;