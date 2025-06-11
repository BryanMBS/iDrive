// Agendamientos.js

// --- Importaciones de Módulos y Componentes ---
import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react"; // El componente principal del calendario
import dayGridPlugin from "@fullcalendar/daygrid"; // Plugin para la vista de mes
import interactionPlugin from "@fullcalendar/interaction"; // Plugin para interacciones como hacer clic en fechas/eventos
import axios from "axios"; // Para realizar peticiones HTTP a la API
import "./Agendamientos.css"; // Estilos específicos para esta página
import Sidebar from "../components/Sidebar"; // Componente del menú lateral
import { useAuth } from '../context/AuthContext'; // Hook para verificar permisos del usuario

// --- Configuración del Cliente de API con Axios ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

// Interceptor: Se ejecuta antes de cada petición para añadir el token de autenticación
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Componente Principal de Agendamientos (Vista de Administrador) ---
const Agendamientos = () => {
  // --- Estados del Componente ---
  const { hasPermission } = useAuth(); // Función para verificar permisos del rol actual

  // Estados para almacenar datos de la API
  const [clases, setClases] = useState([]);
  const [agendamientos, setAgendamientos] = useState([]);

  // Estados para controlar la visibilidad de los diferentes modales
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDayClassesModal, setShowDayClassesModal] = useState(false);
  
  // Estados para almacenar datos seleccionados por el usuario
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayClasses, setSelectedDayClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // Estados para los formularios de los modales
  const [formularioAgendamiento, setFormularioAgendamiento] = useState({ cedula: "", id_clase: "" });
  const [idAgendamientoParaCancelar, setIdAgendamientoParaCancelar] = useState('');

  // --- Funciones para Obtener Datos de la API ---
  // useCallback optimiza estas funciones para que no se recreen en cada renderizado
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
      if(err.response?.status !== 404) { // No mostrar alerta si simplemente no hay datos (404)
        alert("Error al cargar agendamientos: " + (err.response?.data?.detail || err.message));
      }
    }
  }, []);

  // Función que agrupa las peticiones iniciales
  const loadInitialData = useCallback(async () => {
    await Promise.all([fetchClases(), fetchAgendamientos()]); // Se ejecutan en paralelo para eficiencia
  }, [fetchClases, fetchAgendamientos]);

  // useEffect se ejecuta una vez cuando el componente se monta para cargar los datos
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // --- Lógica para Procesar y Mostrar Eventos en el Calendario ---
  const eventos = clases.map((clase) => {
    // Para cada clase, contamos cuántos agendamientos tiene asociados
    const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
    const cuposDisponibles = clase.cupos_disponibles;
    // Si la clase está llena, se mostrará en color rojo
    const color = registrados >= cuposDisponibles ? '#e74a3b' : '#2C3E50';

    // Se crea el objeto que FullCalendar entiende como un evento
    return {
      id: clase.id_clase,
      title: `${clase.nombre_clase} (${registrados}/${cuposDisponibles})`,
      date: new Date(clase.fecha_hora).toISOString().split('T')[0],
      backgroundColor: color,
      borderColor: color,
      extendedProps: { // Almacenamos todos los datos extra aquí para usarlos en los modales
        ...clase,
        registrados: registrados,
      },
    };
  });

  // --- Manejadores de Formularios y Acciones del Usuario ---

  const handleAgendamientoInputChange = (e) => setFormularioAgendamiento({ ...formularioAgendamiento, [e.target.name]: e.target.value });
  
  const handleAgendarClase = async () => {
    if (!formularioAgendamiento.cedula || !formularioAgendamiento.id_clase) {
      alert("Por favor, completa todos los campos para agendar.");
      return;
    }
    const isConfirmed = window.confirm("¿Está seguro de que desea agendar a este estudiante en la clase seleccionada?");
    if (!isConfirmed) return;
    try {
      await apiClient.post("/agendamientos/", formularioAgendamiento);
      alert("Clase agendada y confirmada exitosamente.");
      setShowAgendarModal(false);
      loadInitialData(); // Recargamos los datos para reflejar el nuevo agendamiento
      setFormularioAgendamiento({ cedula: "", id_clase: "" });
    } catch (err) {
      alert("Error al agendar la clase: " + (err.response?.data?.detail || err.message));
    }
  };
  
  const handleCancelarAgendamiento = async () => {
    if (!idAgendamientoParaCancelar) {
      alert("Por favor, selecciona un agendamiento de la lista para cancelar.");
      return;
    }
    if (!window.confirm(`¿Está seguro de que desea cancelar el agendamiento seleccionado (ID: ${idAgendamientoParaCancelar})?`)) {
        return;
    }
    try {
      // Llamamos al endpoint DELETE con el ID único del agendamiento
      await apiClient.delete(`/agendamientos/${idAgendamientoParaCancelar}`);
      alert("Agendamiento cancelado exitosamente.");
      setShowCancelarModal(false);
      loadInitialData(); // Recargamos para que el calendario se actualice
      setIdAgendamientoParaCancelar('');
    } catch (err) {
      alert(`Error al cancelar el agendamiento: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Se activa al hacer clic en un evento del calendario
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setShowEventDetailModal(true);
  };
  
  // Se activa al hacer clic en una fecha vacía del calendario
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    const classesForDay = clases.filter(c => new Date(c.fecha_hora).toISOString().split('T')[0] === clickedDate);
    setSelectedDayClasses(classesForDay);
    setShowDayClassesModal(true);
  };
  
  // --- Renderizado del Componente JSX ---
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
            headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
            buttonText={{ today: "Hoy" }}
          />

          <div className="agendamiento-botones">
            <button className="btn-agendar" onClick={() => setShowAgendarModal(true)}>
              Agendar por Admin
            </button>
            <button className="btn-cancelar" onClick={() => setShowCancelarModal(true)}>
              Cancelar Agendamiento
            </button>
          </div>
        </div>
      </div>

      {/* --- Sección de Modales (se renderizan condicionalmente) --- */}

      {/* Modal para Agendar una Nueva Clase */}
      {showAgendarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Agendar Nueva Clase</h4>
            <input
              type="text" name="cedula" placeholder="Cédula del Estudiante"
              value={formularioAgendamiento.cedula} onChange={handleAgendamientoInputChange}
              className="modal-input"
            />
            <select
              name="id_clase" value={formularioAgendamiento.id_clase}
              onChange={handleAgendamientoInputChange} className="modal-select"
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

      {/* Modal para Cancelar un Agendamiento */}
      {showCancelarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Cancelar un Agendamiento</h4>
            <p>Selecciona el agendamiento específico que deseas cancelar de la lista.</p>
            <select
              value={idAgendamientoParaCancelar}
              onChange={(e) => setIdAgendamientoParaCancelar(e.target.value)}
              className="modal-select"
            >
              <option value="">-- Selecciona un agendamiento --</option>
              {agendamientos.filter(ag => ag.estado !== 'Cancelado').map((ag) => (
                <option key={ag.id_agendamiento} value={ag.id_agendamiento}>
                   {ag.nombre_clase} - {ag.estudiante} ({new Date(ag.fecha_hora).toLocaleDateString()})
                </option>
              ))}
            </select>
            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleCancelarAgendamiento}>Confirmar Cancelación</button>
              <button className="modal-button cancelar" onClick={() => setShowCancelarModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver Detalles del Evento */}
      {showEventDetailModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>{selectedEvent.nombre_clase}</h4>
            <p><strong>Descripción:</strong> {selectedEvent.descripcion || "No disponible."}</p>
            <p><strong>Fecha:</strong> {new Date(selectedEvent.fecha_hora).toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {new Date(selectedEvent.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p><strong>Ocupación:</strong> {selectedEvent.registrados} de {selectedEvent.cupos_disponibles} cupos</p>
            <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowEventDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para ver Clases del Día */}
      {showDayClassesModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Clases para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString("es-CO", {dateStyle: 'long'})}</h4>
            {selectedDayClasses.length > 0 ? (
              <ul className="day-classes-list">
                {selectedDayClasses.map((clase) => {
                  const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
                  return (
                    <li key={clase.id_clase}>
                      <strong>{clase.nombre_clase}</strong>
                      <span>Hora: {new Date(clase.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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