import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import './AgendarClase.css';


export default function AgendarClase() {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [tipoClase, setTipoClase] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ fecha, hora, tipoClase });
    alert("Clase agendada correctamente");
  };

  return (
    <Container className="mt-5">
      <h2>Agendar Clase</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Fecha</Form.Label>
          <Form.Control type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hora</Form.Label>
          <Form.Control type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tipo de Clase</Form.Label>
          <Form.Select value={tipoClase} onChange={(e) => setTipoClase(e.target.value)} required>
            <option value="">Selecciona una opción</option>
            <option value="Teórica">Teórica</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit">Agendar</Button>
      </Form>
    </Container>
  );
}
