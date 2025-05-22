import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./Agendamientos.css";
import Sidebar from "../components/Sidebar";



const Agendamientos = () => {
  const [clasesCalendario, setClasesCalendario] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formulario, setFormulario] = useState({
    cedula: "",
    id_clase: "",
  });
  const [idParaCancelar, setIdParaCancelar] = useState(null);

  useEffect(() => {
    fetchClasesParaCalendario();
    fetchClasesDisponibles();
  }, []);

  const fetchClasesParaCalendario = () => {
    fetch("http://localhost:8000/Clases_Calendario")
      .then((res) => res.json())
      .then((data) => setClasesCalendario(data))
      .catch((err) => console.error("Error al cargar clases calendario:", err));
  };

  const fetchClasesDisponibles = () => {
    fetch("http://localhost:8000/ClasesDisponibles/")
      .then((res) => res.json())
      .then((data) => setClasesDisponibles(data))
      .catch((err) => console.error("Error al traer clases disponibles:", err));
  };

  const handleInputChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleEnviar = () => {
    fetch("http://localhost:8000/Agendar_clase/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    })
      .then((res) => res.json())
      .then(() => {
        setShowModal(false);
        fetchClasesParaCalendario();
        fetchClasesDisponibles();
        setFormulario({ cedula: "", id_clase: "" });
      })
      .catch((err) => console.error("Error al enviar agendamiento:", err));
  };

  const handleCancelar = () => {
    fetch(`http://localhost:8000/Cancelar_agendamiento/${idParaCancelar}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setShowDeleteModal(false);
        fetchClasesParaCalendario();
      })
      .catch((err) => console.error("Error al cancelar agendamiento:", err));
  };

  const eventos = clasesCalendario.map((clase) => ({
    title: `${clase.titulo} (${clase.usuarios_registrados} estudiantes)`,
    date: clase.fecha,
  }));

  return (
    <>
      <Sidebar />
      <div className="main-content container mt-4">
        <h2 className="mb-4">Calendario de Clases</h2>

        <div className="d-flex justify-content-end mb-3 agendamiento-botones">
          <button className="btn-agendar me-2" onClick={() => setShowModal(true)}>
            Agendar Clase
          </button>
          <button
            className="btn-cancelar"
            onClick={() => {
              fetch("http://localhost:3000/Agendamientos/")
                .then((res) => res.json())
                .then((data) => {
                  if (data.length > 0) {
                    const ultimo = data[data.length - 1];
                    setIdParaCancelar(ultimo.id_inscripcion);
                    setShowDeleteModal(true);
                  } else {
                    alert("No hay agendamientos para cancelar.");
                  }
                })
                .catch((err) => console.error("Error al obtener agendamientos:", err));
            }}
          >
            Cancelar Último
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={eventos}
          locale="es"
          height="auto"
        />
      </div>

      {/* Modal de Agendamiento */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Agendar Nueva Clase</h4>

            <input
              type="text"
              name="cedula"
              placeholder="Cédula del Estudiante"
              value={formulario.cedula}
              onChange={handleInputChange}
            />

            <select
              name="id_clase"
              value={formulario.id_clase}
              onChange={handleInputChange}
            >
              <option value="">Selecciona una Clase</option>
              {clasesDisponibles.map((clase) => (
                <option key={clase.id_clase} value={clase.id_clase}>
                  {clase.nombre_clase} - {new Date(clase.fecha_hora).toLocaleString()}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleEnviar}>
                Guardar
              </button>
              <button className="modal-button cancelar" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h5>¿Cancelar el último agendamiento?</h5>
            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleCancelar}>
                Sí, Cancelar
              </button>
              <button className="modal-button cancelar" onClick={() => setShowDeleteModal(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Agendamientos;
