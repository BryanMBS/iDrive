import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "./Agendamientos.css";
import Sidebar from "../components/Sidebar";

// MEJORA: Variable de entorno y una instancia de Axios para peticiones autenticadas
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
});

// MEJORA DE SEGURIDAD: Interceptor para añadir el token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Agendamientos = () => {
  const [clasesCalendario, setClasesCalendario] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDayClassesModal, setShowDayClassesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayClasses, setSelectedDayClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [formularioAgendamiento, setFormularioAgendamiento] = useState({
    cedula: "",
    id_clase: "",
  });
  
  // NOTA: El formulario de cancelación original era inviable con el backend actual.
  // Se deja la estructura por si se adapta el backend en el futuro.
  const [formularioCancelacion, setFormularioCancelacion] = useState({
    cedula: "",
    id_clase: "",
  });

  // MEJORA: Se usa useCallback para evitar re-crear las funciones en cada render
  const fetchClasesParaCalendario = useCallback(async () => {
    try {
      // CORRECCIÓN: Apuntar al endpoint correcto del backend (`/clases/`)
      const response = await apiClient.get("/clases/");
      setClasesCalendario(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      if (err.response?.status !== 404) { // No mostrar alerta si simplemente no hay clases
        alert("Error al cargar clases en el calendario: " + errorMsg);
      }
      setClasesCalendario([]); // Asegurar que el estado es un array vacío en caso de error
    }
  }, []);

  const fetchClasesDisponibles = useCallback(async () => {
    try {
      // CORRECCIÓN: Apuntar al endpoint correcto del backend (`/clases/`)
      const response = await apiClient.get("/clases/");
      setClasesDisponibles(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      if (err.response?.status !== 404) {
          alert("Error al cargar clases disponibles: " + errorMsg);
      }
      setClasesDisponibles([]); // Asegurar que el estado es un array vacío en caso de error
    }
  }, []);

  const loadAllClassData = useCallback(async () => {
    await fetchClasesParaCalendario();
    await fetchClasesDisponibles();
  }, [fetchClasesParaCalendario, fetchClasesDisponibles]);

  useEffect(() => {
    loadAllClassData();
  }, [loadAllClassData]);

  const handleAgendamientoInputChange = (e) => {
    setFormularioAgendamiento({
      ...formularioAgendamiento,
      [e.target.name]: e.target.value,
    });
  };

  const handleCancelacionInputChange = (e) => {
    setFormularioCancelacion({
      ...formularioCancelacion,
      [e.target.name]: e.target.value,
    });
  };

  const handleAgendarClase = async () => {
    if (!formularioAgendamiento.cedula || !formularioAgendamiento.id_clase) {
      alert("Por favor, completa todos los campos para agendar.");
      return;
    }
    try {
      // CORRECCIÓN: Apuntar al endpoint de backend correcto para crear un agendamiento (`/agendamientos/`)
      await apiClient.post("/agendamientos/", {
          ...formularioAgendamiento,
          id_clase: parseInt(formularioAgendamiento.id_clase, 10)
      });
      alert("Clase agendada exitosamente.");
      setShowAgendarModal(false);
      loadAllClassData();
      setFormularioAgendamiento({ cedula: "", id_clase: "" });
    } catch (err) {
      alert(
        "Error al agendar la clase: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };
  
  // NOTA IMPORTANTE: La funcionalidad de cancelación no es viable con el backend actual.
  // El backend espera `DELETE /agendamientos/{id_agendamiento}`, pero este formulario
  // solo recolecta `cedula` y `id_clase`, sin forma de obtener el ID del agendamiento.
  // Para que funcione, el backend debería ofrecer un endpoint que permita la cancelación
  // con estos datos, o el frontend debería mostrar una lista de agendamientos del usuario
  // de donde se pueda obtener el `id_agendamiento`.
  const handleCancelarAgendamiento = async () => {
      alert("Funcionalidad no implementada. Se requiere un ajuste en el backend para poder cancelar con los datos proporcionados.");
  };

  // CORRECCIÓN: Mapear `clasesCalendario` usando las propiedades correctas del backend (`nombre_clase`, `fecha_hora`).
  // Se elimina `usuarios_registrados` ya que no es provisto por el endpoint `/clases/`.
  const eventos = clasesCalendario.map((clase) => {
    const fechaHora = new Date(clase.fecha_hora);
    return {
        id: clase.id_clase,
        title: clase.nombre_clase,
        date: fechaHora.toISOString().split('T')[0], // Extraer solo la fecha para el calendario
        extendedProps: {
            // `usuarios_registrados` no está disponible en la respuesta de `/clases/`
            descripcion: clase.descripcion || "Sin descripción",
            hora: fechaHora.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            fechaCompleta: fechaHora,
        },
    };
  });


  const handleEventClick = (clickInfo) => {
    // CORRECCIÓN: Usar las propiedades correctas del evento (`title`, `extendedProps`).
    setSelectedEvent({
      title: clickInfo.event.title,
      date: clickInfo.event.extendedProps.fechaCompleta,
      ...clickInfo.event.extendedProps,
    });
    setShowEventDetailModal(true);
  };

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    // CORRECCIÓN: El backend devuelve `fecha_hora`, no `fecha`. Se compara solo la parte de la fecha.
    const classesForDay = clasesCalendario.filter(
      (clase) => clase.fecha_hora.startsWith(clickedDate)
    );
    setSelectedDayClasses(classesForDay);
    setShowDayClassesModal(true);
  };

  return (
    <>
      <Sidebar />
      <div className="main-content container mt-4">
        <h2 className="mb-4">Calendario de Clases</h2>
        <div className="d-flex justify-content-end mb-3 agendamiento-botones">
          <button
            className="btn-agendar me-2"
            onClick={() => setShowAgendarModal(true)}
          >
            Agendar Clase
          </button>
          {/* BOTÓN DESHABILITADO: La funcionalidad de cancelación no es viable sin cambios en backend. */}
          <button
            className="btn-cancelar"
            onClick={() => setShowCancelarModal(true)}
            disabled 
            title="Funcionalidad no disponible. Requiere cambios en el backend."
          >
            Cancelar Agendamiento
          </button>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={eventos}
          locale="es"
          height="auto"
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
        />
      </div>

      {/* Modal de Agendar (sin cambios estructurales, solo funcionales) */}
      {showAgendarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Agendar Nueva Clase</h4>
            <input
              type="text"
              name="cedula"
              placeholder="Cédula del Estudiante"
              value={formularioAgendamiento.cedula}
              onChange={handleAgendamientoInputChange}
              className="modal-input"
            />
            <select
              name="id_clase"
              value={formularioAgendamiento.id_clase}
              onChange={handleAgendamientoInputChange}
              className="modal-select"
            >
              <option value="">Selecciona una Clase</option>
              {clasesDisponibles.map((clase) => (
                <option key={clase.id_clase} value={clase.id_clase}>
                  {clase.nombre_clase} -{" "}
                  {new Date(clase.fecha_hora).toLocaleString()}
                </option>
              ))}
            </select>
            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleAgendarClase}>Guardar</button>
              <button className="modal-button cancelar" onClick={() => setShowAgendarModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar (Funcionalidad principal deshabilitada pero modal se mantiene) */}
      {showCancelarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h5>Cancelar Agendamiento</h5>
            <p><strong>Nota:</strong> Esta función requiere un ID de agendamiento que no se solicita aquí. Se necesita un ajuste en el backend.</p>
            <input
              type="text"
              name="cedula"
              placeholder="Cédula del Estudiante"
              value={formularioCancelacion.cedula}
              onChange={handleCancelacionInputChange}
              className="modal-input"
              disabled
            />
            <select
              name="id_clase"
              value={formularioCancelacion.id_clase}
              onChange={handleCancelacionInputChange}
              className="modal-select"
              disabled
            >
              <option value="">Selecciona la Clase a Cancelar</option>
            </select>
            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleCancelarAgendamiento} disabled>Sí, Cancelar</button>
              <button className="modal-button cancelar" onClick={() => setShowCancelarModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Evento (Corregido para usar datos correctos) */}
      {showEventDetailModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Detalles de la Clase</h4>
            <p><strong>Clase:</strong> {selectedEvent.title}</p>
            <p><strong>Fecha:</strong> {selectedEvent.date.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {selectedEvent.hora}</p>
            {/* La propiedad `usuarios_registrados` no está disponible */}
            <p><strong>Descripción:</strong> {selectedEvent.descripcion}</p>
            <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowEventDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Clases del Día (Corregido) */}
      {showDayClassesModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>
              Clases para el{" "}
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString("es", { //Asegurar zona horaria correcta
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>
            {selectedDayClasses.length > 0 ? (
              <ul className="day-classes-list">
                {selectedDayClasses.map((clase) => (
                  <li key={clase.id_clase}>
                    <strong>{clase.nombre_clase}</strong> {/* CORRECCIÓN: Usar nombre_clase */}
                    <span>
                      Hora:{" "}
                      {new Date(clase.fecha_hora).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {/* `usuarios_registrados` no está disponible */}
                    <span>
                      Descripción: {clase.descripcion || "Sin descripción"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay clases agendadas para este día.</p>
            )}
            <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowDayClassesModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Agendamientos;