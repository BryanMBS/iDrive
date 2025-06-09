import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "./Agendamientos.css";
import Sidebar from "../components/Sidebar";

// Configuración de Axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Agendamientos = () => {
  const [clases, setClases] = useState([]);
  const [agendamientos, setAgendamientos] = useState([]);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDayClassesModal, setShowDayClassesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayClasses, setSelectedDayClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [formularioAgendamiento, setFormularioAgendamiento] = useState({ cedula: "", id_clase: "" });

  const fetchClases = useCallback(async () => {
    try {
      const response = await apiClient.get("/clases/");
      setClases(response.data || []);
    } catch (err) {
      alert("Error al cargar clases: " + (err.response?.data?.detail || err.message));
    }
  }, []);

  const fetchAgendamientos = useCallback(async () => {
    try {
      const response = await apiClient.get("/agendamientos/");
      setAgendamientos(response.data || []);
    } catch (err) {
      if(err.response?.status !== 404) {
        alert("Error al cargar agendamientos: " + (err.response?.data?.detail || err.message));
      }
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    await fetchClases();
    await fetchAgendamientos();
  }, [fetchClases, fetchAgendamientos]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const eventos = clases.map((clase) => {
    const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
    const cuposDisponibles = clase.cupos_disponibles;
    const color = registrados >= cuposDisponibles ? '#e74a3b' : '#2C3E50';

    return {
      id: clase.id_clase,
      title: `${clase.nombre_clase} (${registrados}/${cuposDisponibles})`,
      date: new Date(clase.fecha_hora).toISOString().split('T')[0],
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        ...clase,
        registrados: registrados,
      },
    };
  });

  const handleAgendarClase = async () => {
    if (!formularioAgendamiento.cedula || !formularioAgendamiento.id_clase) {
      alert("Por favor, completa todos los campos para agendar.");
      return;
    }
    try {
      await apiClient.post("/agendamientos/", formularioAgendamiento);
      alert("Clase agendada exitosamente.");
      setShowAgendarModal(false);
      loadInitialData();
      setFormularioAgendamiento({ cedula: "", id_clase: "" });
    } catch (err) {
      alert("Error al agendar la clase: " + (err.response?.data?.detail || err.message));
    }
  };
  
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setShowEventDetailModal(true);
  };
  
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    const classesForDay = clases.filter(
      (clase) => new Date(clase.fecha_hora).toISOString().split('T')[0] === clickedDate
    );
    setSelectedDayClasses(classesForDay);
    setShowDayClassesModal(true);
  };
  
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="page-container">
        <div className="main-content">
          <h2>Calendario de Clases</h2>
          
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
              right: "" // <-- CAMBIO: Botones de Mes/Semana/Día eliminados
            }}
            buttonText={{
              today: "Hoy"
            }}
          />

          <div className="agendamiento-botones">
            <button className="btn-agendar" onClick={() => setShowAgendarModal(true)}>
              Agendar Clase
            </button>
            <button className="btn-cancelar" onClick={() => alert("Función de cancelación no implementada.")}>
              Cancelar Agendamiento
            </button>
          </div>
        </div>
      </div>

      {/* --- Modales (sin cambios en su estructura interna) --- */}
      {showAgendarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Agendar Nueva Clase</h4>
            <input
              type="text"
              name="cedula"
              placeholder="Cédula del Estudiante"
              value={formularioAgendamiento.cedula}
              onChange={(e) => setFormularioAgendamiento({...formularioAgendamiento, cedula: e.target.value})}
              className="modal-input"
            />
            <select
              name="id_clase"
              value={formularioAgendamiento.id_clase}
              onChange={(e) => setFormularioAgendamiento({...formularioAgendamiento, id_clase: e.target.value})}
              className="modal-select"
            >
              <option value="">Selecciona una Clase</option>
              {clases.map((clase) => (
                <option key={clase.id_clase} value={clase.id_clase}>
                  {clase.nombre_clase} - {new Date(clase.fecha_hora).toLocaleString()}
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

      {showEventDetailModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>{selectedEvent.nombre_clase}</h4>
            <p><strong>Descripción:</strong> {selectedEvent.descripcion || "No disponible."}</p>
            <p><strong>Fecha:</strong> {new Date(selectedEvent.fecha_hora).toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {new Date(selectedEvent.fecha_hora).toLocaleTimeString()}</p>
            <p><strong>Ocupación:</strong> {selectedEvent.registrados} de {selectedEvent.cupos_disponibles} cupos</p>
            <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowEventDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {showDayClassesModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Clases para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</h4>
            {selectedDayClasses.length > 0 ? (
              <ul className="day-classes-list">
                {selectedDayClasses.map((clase) => {
                  const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
                  return (
                    <li key={clase.id_clase}>
                      <strong>{clase.nombre_clase}</strong>
                      <span>Hora: {new Date(clase.fecha_hora).toLocaleTimeString()}</span>
                      <span>Ocupación: {registrados} de {clase.cupos_disponibles} cupos</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>No hay clases programadas para este día.</p>
            )}
             <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowDayClassesModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agendamientos;