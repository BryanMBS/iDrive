// Agendamientos.js - Corrección final y restauración de elementos

// --- Importaciones de Módulos y Componentes ---
import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "./Agendamientos.css";
import Sidebar from "../components/Sidebar";
import { useAuth } from '../context/AuthContext';

// --- Configuración del Cliente de API con Axios ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// --- Componente Principal de Agendamientos ---
const Agendamientos = () => {
  // Función auxiliar para crear un objeto Date de forma segura desde el formato DD/MM/YYYY
  const crearFechaSegura = (fechaStr) => {
    if (!fechaStr || typeof fechaStr !== 'string') return null;
    const fechaParaParsear = fechaStr.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$2/$1/$3');
    const fechaObj = new Date(fechaParaParsear);
    return isNaN(fechaObj.getTime()) ? null : fechaObj;
  };

  // --- Estados del Componente ---
  const { hasPermission } = useAuth();
  const [clases, setClases] = useState([]);
  const [agendamientos, setAgendamientos] = useState([]);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDayClassesModal, setShowDayClassesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayClasses, setSelectedDayClasses] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [formularioAgendamiento, setFormularioAgendamiento] = useState({ cedula: "", id_clase: "" });
  const [idAgendamientoParaCancelar, setIdAgendamientoParaCancelar] = useState('');

  // --- Funciones para Obtener Datos de la API ---
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
    await Promise.all([fetchClases(), fetchAgendamientos()]);
  }, [fetchClases, fetchAgendamientos]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
// --- Lógica para Procesar y Mostrar Eventos en el Calendario ---
  const eventos = clases
    .map((clase) => {
      // Si no hay fecha, ignoramos esta clase.
      if (!clase.fecha_hora) {
          return null;
      }

      let fechaObj;

      // Intentamos crear un objeto de Fecha.
      // Primero, verificamos si es un texto con el formato "DD/MM/YYYY" y lo corregimos.
      if (typeof clase.fecha_hora === 'string' && clase.fecha_hora.includes('/')) {
          const fechaParaParsear = clase.fecha_hora.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$2/$1/$3');
          fechaObj = new Date(fechaParaParsear);
      } else {
          // Si no es el formato esperado, intentamos que JS lo procese directamente.
          // Esto funciona para fechas estándar (ISO) o si ya es un objeto Date.
          fechaObj = new Date(clase.fecha_hora);
      }

      // Si después de todo, la fecha no es válida, la ignoramos.
      if (!fechaObj || isNaN(fechaObj.getTime())) {
          return null;
      }
      
      // Si llegamos aquí, tenemos una fecha válida. La formateamos para FullCalendar.
      const formattedDate = fechaObj.toISOString().split('T')[0];
      
      const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
      const cuposDisponibles = clase.cupos_disponibles;
      const color = registrados >= cuposDisponibles ? '#e74a3b' : '#2C3E50';

      return {
        id: clase.id_clase,
        title: `${clase.nombre_clase} (${registrados}/${cuposDisponibles})`,
        date: formattedDate,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          ...clase,
          registrados: registrados,
        },
      };
    })
    .filter(evento => evento !== null);

  // --- Manejadores de Formularios y Acciones del Usuario ---
  const handleAgendamientoInputChange = (e) => setFormularioAgendamiento({ ...formularioAgendamiento, [e.target.name]: e.target.value });
  
  const handleAgendarClase = async () => { /* ... sin cambios ... */ };
  const handleCancelarAgendamiento = async () => { /* ... sin cambios ... */ };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setShowEventDetailModal(true);
  };
  
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    const classesForDay = clases.filter(c => {
        if (!c.fecha_hora || typeof c.fecha_hora !== 'string' || !c.fecha_hora.includes('/')) return false;
        const fechaStr = c.fecha_hora.split(',')[0];
        const fechaParts = fechaStr.split('/');
        if (fechaParts.length !== 3) return false;
        const formattedDate = `${fechaParts[2]}-${String(fechaParts[1]).padStart(2, '0')}-${String(fechaParts[0]).padStart(2, '0')}`;
        return formattedDate === clickedDate;
    });
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
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,dayGridWeek" }}
            buttonText={{ today: "Hoy", month: "Mes", week: "Semana" }}
            dayMaxEvents={true}
          />
          <div className="agendamiento-botones">
            <button className="btn-agendar" onClick={() => setShowAgendarModal(true)}>Agendar por Admin</button>
            <button className="btn-cancelar" onClick={() => setShowCancelarModal(true)}>Cancelar Agendamiento</button>
          </div>
        </div>
      </div>

      {/* --- Modales --- */}
      {showAgendarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Agendar Nueva Clase</h4>
            <input type="text" name="cedula" placeholder="Cédula del Estudiante" value={formularioAgendamiento.cedula} onChange={handleAgendamientoInputChange} className="modal-input"/>
            <select name="id_clase" value={formularioAgendamiento.id_clase} onChange={handleAgendamientoInputChange} className="modal-select">
              <option value="">Selecciona una Clase</option>
              {clases.map((clase) => {
                  const fechaObj = crearFechaSegura(clase.fecha_hora);
                  return fechaObj ? (
                    <option key={clase.id_clase} value={clase.id_clase}>{clase.nombre_clase} - {fechaObj.toLocaleString()}</option>
                  ) : null;
              })}
            </select>
            <div className="modal-buttons">
              <button className="modal-button guardar" onClick={handleAgendarClase}>Guardar</button>
              <button className="modal-button cancelar" onClick={() => setShowAgendarModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCancelarModal && ( <div className="modal-overlay"> {/* ... sin cambios ... */} </div> )}

      {showEventDetailModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>{selectedEvent.nombre_clase}</h4>
            {(() => {
              const fechaObj = crearFechaSegura(selectedEvent.fecha_hora);
              return fechaObj ? (
                <>
                  <p><strong>Descripción:</strong> {selectedEvent.descripcion || "No disponible."}</p>
                  <p><strong>Fecha:</strong> {fechaObj.toLocaleDateString()}</p>
                  <p><strong>Hora:</strong> {fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p><strong>Ocupación:</strong> {selectedEvent.registrados} de {selectedEvent.cupos_disponibles} cupos</p>
                </>
              ) : <p>Fecha de evento no disponible.</p>;
            })()}
            <div className="modal-buttons">
              <button className="modal-button cancelar" onClick={() => setShowEventDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {showDayClassesModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Clases para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString("es-CO", {dateStyle: 'long'})}</h4>
            {selectedDayClasses.length > 0 ? (
              <ul className="day-classes-list">
                {selectedDayClasses.map((clase) => {
                  const registrados = agendamientos.filter(a => a.id_clase === clase.id_clase).length;
                  const fechaObj = crearFechaSegura(clase.fecha_hora);
                  return (
                    <li key={clase.id_clase}>
                      <strong>{clase.nombre_clase}</strong>
                      <span>Hora: {fechaObj ? fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
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